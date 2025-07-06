import { PhysicsWorld } from './PhysicsWorld.js';

export interface DroneConfig {
  mass: number;
  maxThrust: number;
  maxAngularVelocity: number;
  dragCoefficient: number;
  batteryCapacity: number;
  batteryDrainRate: number;
  motorResponseTime: number;
  pidGains: {
    pitch: { p: number; i: number; d: number };
    roll: { p: number; i: number; d: number };
    yaw: { p: number; i: number; d: number };
    altitude: { p: number; i: number; d: number };
  };
}

export interface DroneState {
  position: [number, number, number];
  rotation: [number, number, number];
  velocity: [number, number, number];
  angularVelocity: [number, number, number];
  battery: number;
  motors: [number, number, number, number]; // Individual motor thrusts
  isArmed: boolean;
  flightMode: 'manual' | 'stabilized' | 'autonomous';
  heightLockEnabled: boolean;
  targetAltitude: number;
}

export class DroneController {
  private physicsWorld?: PhysicsWorld;
  private droneBody?: any;
  private Ammo?: any;
  
  // State
  private state: DroneState = {
    position: [0, 3, 0], // Lower starting position
    rotation: [0, 0, 0],
    velocity: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    battery: 100,
    motors: [0, 0, 0, 0],
    isArmed: false,
    flightMode: 'manual',
    heightLockEnabled: false,
    targetAltitude: 3, // Lower target altitude
  };
  
  // Control inputs
  private targetAction: [number, number, number, number] = [0, 0, 0, 0]; // [thrust, pitch, roll, yaw]
  private currentAction: [number, number, number, number] = [0, 0, 0, 0];
  
  // PID controllers
  private pidControllers = {
    pitch: { integral: 0, lastError: 0 },
    roll: { integral: 0, lastError: 0 },
    yaw: { integral: 0, lastError: 0 },
    altitude: { integral: 0, lastError: 0 },
  };
  
  // Configuration
  private config: DroneConfig = {
    mass: 1.5,
    maxThrust: 25.0, // N per motor
    maxAngularVelocity: 5.0, // rad/s
    dragCoefficient: 0.1,
    batteryCapacity: 100,
    batteryDrainRate: 0.5, // % per second at max thrust
    motorResponseTime: 0.1, // seconds
    pidGains: {
      pitch: { p: 2.0, i: 0.1, d: 0.5 },
      roll: { p: 2.0, i: 0.1, d: 0.5 },
      yaw: { p: 1.5, i: 0.05, d: 0.3 },
      altitude: { p: 0.8, i: 0.02, d: 0.3 }, // Adjusted for better stability
    },
  };

  // Height lock and hover control
  private hoverThrust: number = 0.15; // More realistic hover thrust
  private gravity: number = 9.81; // m/s²
  private lastAltitudeError: number = 0;
  private altitudeIntegral: number = 0;

  async initialize(physicsWorld: PhysicsWorld): Promise<void> {
    console.log('🚁 Initializing drone controller...');
    
    this.physicsWorld = physicsWorld;
    
    try {
      const ammoModule = await import('ammo.js');
      this.Ammo = ammoModule.default || ammoModule;
      if (typeof this.Ammo === 'function') {
        await this.Ammo();
      }
      
      // Create drone collision shape (more realistic quadcopter shape)
      const shape = new this.Ammo.btCompoundShape();
      
      // Main body (central box)
      const bodyShape = new this.Ammo.btBoxShape(new this.Ammo.btVector3(0.3, 0.1, 0.3));
      const bodyTransform = new this.Ammo.btTransform();
      bodyTransform.setIdentity();
      shape.addChildShape(bodyTransform, bodyShape);
      
      // Four arms (cylinders)
      const armLength = 0.4;
      const armRadius = 0.02;
      const armShape = new this.Ammo.btCylinderShape(new this.Ammo.btVector3(armRadius, armLength / 2, armRadius));
      
      const armPositions = [
        [armLength / 2, 0, 0], [-armLength / 2, 0, 0],
        [0, 0, armLength / 2], [0, 0, -armLength / 2]
      ];
      
      armPositions.forEach(pos => {
        const armTransform = new this.Ammo.btTransform();
        armTransform.setIdentity();
        armTransform.setOrigin(new this.Ammo.btVector3(...pos));
        shape.addChildShape(armTransform, armShape);
      });
      
      // Create motion state
      const transform = new this.Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new this.Ammo.btVector3(...this.state.position));
      
      const motionState = new this.Ammo.btDefaultMotionState(transform);
      
      // Create rigid body
      const localInertia = new this.Ammo.btVector3(0, 0, 0);
      shape.calculateLocalInertia(this.config.mass, localInertia);
      
      const rbInfo = new this.Ammo.btRigidBodyConstructionInfo(
        this.config.mass,
        motionState,
        shape,
        localInertia
      );
      
      this.droneBody = new this.Ammo.btRigidBody(rbInfo);
      this.droneBody.setActivationState(4); // Disable deactivation
      this.droneBody.setDamping(0.1, 0.1); // Linear and angular damping
      
      // Add to physics world
      this.physicsWorld.addRigidBody('drone', this.droneBody);
      
      console.log('✅ Drone controller initialized');
    } catch (error) {
      console.error('❌ Failed to initialize drone controller:', error);
      throw error;
    }
  }

  update(deltaTime: number): void {
    if (!this.droneBody || !this.Ammo) return;
    
    // Calculate hover thrust if needed
    this.calculateHoverThrust();
    
    // Update motor response (simulate motor dynamics)
    this.updateMotorResponse(deltaTime);
    
    // Apply height lock if enabled
    if (this.state.heightLockEnabled) {
      this.applyHeightLock(deltaTime);
    }
    
    // Calculate motor thrusts based on control inputs
    const motorThrusts = this.calculateMotorThrusts();
    
    // Apply forces and torques
    this.applyForcesAndTorques(motorThrusts);
    
    // Update state from physics body
    this.updateStateFromPhysics();
    
    // Update battery
    this.updateBattery(deltaTime);
    
    // Apply safety constraints
    this.applySafetyConstraints();
  }

  private calculateHoverThrust(): void {
    // Calculate required thrust to counteract gravity
    // F = m * g, then divide by max thrust per motor * 4 motors
    const requiredThrust = (this.config.mass * this.gravity) / (this.config.maxThrust * 4);
    this.hoverThrust = Math.max(0.12, Math.min(0.25, requiredThrust * 0.8)); // More realistic range
    
    // Debug the calculation
    console.log('🚁 Hover thrust calculation:', {
      mass: this.config.mass,
      gravity: this.gravity,
      maxThrust: this.config.maxThrust,
      requiredThrust: requiredThrust.toFixed(4),
      hoverThrust: this.hoverThrust.toFixed(4)
    });
  }

  private applyHeightLock(deltaTime: number): void {
    const currentAltitude = this.state.position[1];
    const altitudeError = this.state.targetAltitude - currentAltitude;
    const altitudeVelocity = this.state.velocity[1];
    
    // PID control for altitude
    this.altitudeIntegral += altitudeError * deltaTime;
    const altitudeDerivative = (altitudeError - this.lastAltitudeError) / deltaTime;
    
    // Clamp integral to prevent windup
    this.altitudeIntegral = Math.max(-1, Math.min(1, this.altitudeIntegral));
    
    const altitudeCorrection = 
      this.config.pidGains.altitude.p * altitudeError +
      this.config.pidGains.altitude.i * this.altitudeIntegral +
      this.config.pidGains.altitude.d * altitudeDerivative;
    
    // Apply altitude correction to thrust
    const newThrust = this.hoverThrust + altitudeCorrection;
    this.targetAction[0] = Math.max(0, Math.min(1, newThrust));
    
    // Debug logging for height lock
    if (Math.abs(altitudeError) > 0.1) {
      console.log('🔒 Height Lock:', {
        current: currentAltitude.toFixed(2),
        target: this.state.targetAltitude.toFixed(2),
        error: altitudeError.toFixed(2),
        thrust: newThrust.toFixed(3),
        hoverThrust: this.hoverThrust.toFixed(3)
      });
    }
    
    this.lastAltitudeError = altitudeError;
  }

  private updateMotorResponse(deltaTime: number): void {
    const responseRate = deltaTime / this.config.motorResponseTime;
    
    for (let i = 0; i < 4; i++) {
      const error = this.targetAction[i] - this.currentAction[i];
      this.currentAction[i] += error * responseRate;
    }
  }

  private calculateMotorThrusts(): [number, number, number, number] {
    const [thrust, pitch, roll, yaw] = this.currentAction;
    
    // Convert control inputs to individual motor thrusts
    // Motor layout: [front-left, front-right, back-right, back-left]
    const baseThrust = Math.max(0, thrust) * this.config.maxThrust;
    const pitchThrust = pitch * this.config.maxThrust * 0.5;
    const rollThrust = roll * this.config.maxThrust * 0.5;
    const yawThrust = yaw * this.config.maxThrust * 0.3;
    
    return [
      baseThrust + pitchThrust + rollThrust - yawThrust, // Front-left
      baseThrust + pitchThrust - rollThrust + yawThrust, // Front-right
      baseThrust - pitchThrust - rollThrust - yawThrust, // Back-right
      baseThrust - pitchThrust + rollThrust + yawThrust, // Back-left
    ];
  }

  private applyForcesAndTorques(motorThrusts: [number, number, number, number]): void {
    // Calculate total thrust
    const totalThrust = motorThrusts.reduce((sum, thrust) => sum + thrust, 0);
    
    // Apply thrust force in drone's local up direction
    const thrustForce = new this.Ammo!.btVector3(0, totalThrust, 0);
    this.droneBody.applyCentralForce(thrustForce);
    
    // Calculate torques from motor differences
    const [fl, fr, br, bl] = motorThrusts;
    const armLength = 0.4;
    
    const pitchTorque = (fl + fr - br - bl) * armLength * 0.5;
    const rollTorque = (fl - fr - br + bl) * armLength * 0.5;
    const yawTorque = (fl - fr + br - bl) * armLength * 0.3;
    
    const torque = new this.Ammo!.btVector3(pitchTorque, yawTorque, rollTorque);
    this.droneBody.applyTorque(torque);
    
    // Apply movement forces based on drone orientation
    // When drone tilts, it should move in that direction
    const [thrust, pitch, roll, yaw] = this.currentAction;
    
    // Calculate movement forces based on tilt
    // For now, apply forces directly in world coordinates for simplicity
    const pitchForce = pitch * totalThrust * 0.15; // Reduced forward/backward force
    const rollForce = roll * totalThrust * 0.15;   // Reduced left/right force
    
    // Apply movement forces directly (simplified approach)
    // In a real drone, this would be the horizontal component of the thrust vector
    const movementForce = new this.Ammo!.btVector3(rollForce, 0, pitchForce);
    this.droneBody.applyCentralForce(movementForce);
    
    // Apply drag forces
    this.applyDragForces();
  }

  private applyDragForces(): void {
    const velocity = this.droneBody.getLinearVelocity();
    const speed = Math.sqrt(velocity.x() * velocity.x() + velocity.y() * velocity.y() + velocity.z() * velocity.z());
    
    if (speed > 0.1) {
      const dragForce = new this.Ammo!.btVector3(
        -velocity.x() * this.config.dragCoefficient,
        -velocity.y() * this.config.dragCoefficient,
        -velocity.z() * this.config.dragCoefficient
      );
      this.droneBody.applyCentralForce(dragForce);
    }
  }

  private updateStateFromPhysics(): void {
    const transform = this.droneBody.getWorldTransform();
    const origin = transform.getOrigin();
    const rotation = transform.getRotation();
    const velocity = this.droneBody.getLinearVelocity();
    const angularVelocity = this.droneBody.getAngularVelocity();
    
    this.state.position = [origin.x(), origin.y(), origin.z()];
    this.state.velocity = [velocity.x(), velocity.y(), velocity.z()];
    this.state.angularVelocity = [angularVelocity.x(), angularVelocity.y(), angularVelocity.z()];
    
    // Convert quaternion to euler angles
    this.state.rotation = this.quaternionToEuler(rotation);
    
    // Update motor states
    const motorThrusts = this.calculateMotorThrusts();
    this.state.motors = motorThrusts.map(t => t / this.config.maxThrust) as [number, number, number, number];
  }

  private quaternionToEuler(q: any): [number, number, number] {
    const qx = q.x();
    const qy = q.y();
    const qz = q.z();
    const qw = q.w();
    
    // Roll (x-axis rotation)
    const sinr_cosp = 2 * (qw * qx + qy * qz);
    const cosr_cosp = 1 - 2 * (qx * qx + qy * qy);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);
    
    // Pitch (y-axis rotation)
    const sinp = 2 * (qw * qy - qz * qx);
    let pitch;
    if (Math.abs(sinp) >= 1) {
      pitch = Math.sign(sinp) * Math.PI / 2; // Use 90 degrees if out of range
    } else {
      pitch = Math.asin(sinp);
    }
    
    // Yaw (z-axis rotation)
    const siny_cosp = 2 * (qw * qz + qx * qy);
    const cosy_cosp = 1 - 2 * (qy * qy + qz * qz);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);
    
    return [roll, pitch, yaw];
  }

  private updateBattery(deltaTime: number): void {
    const totalThrust = this.state.motors.reduce((sum, motor) => sum + motor, 0);
    const drainRate = (totalThrust / 4) * this.config.batteryDrainRate * deltaTime;
    this.state.battery = Math.max(0, this.state.battery - drainRate);
  }

  private applySafetyConstraints(): void {
    // Low battery protection
    if (this.state.battery < 10) {
      this.targetAction[0] = Math.min(this.targetAction[0], 0.3); // Reduce thrust
    }
    
    // Maximum altitude protection - MUCH MORE AGGRESSIVE
    if (this.state.position[1] > 10) {
      this.targetAction[0] = 0; // Cut all thrust
      console.log('🚨 EMERGENCY: Drone too high, cutting thrust!');
    } else if (this.state.position[1] > 5) {
      this.targetAction[0] = Math.min(this.targetAction[0], 0.05); // Minimal thrust
      console.log('⚠️ WARNING: Drone getting high, reducing thrust');
    }
    
    // Ground collision protection
    if (this.state.position[1] < 0.5) {
      this.targetAction[0] = Math.max(this.targetAction[0], 0.1);
    }
    
    // Emergency velocity limit
    if (this.state.velocity[1] > 5) {
      this.targetAction[0] = 0; // Cut thrust if moving up too fast
      console.log('🚨 EMERGENCY: Drone moving up too fast, cutting thrust!');
    }
  }

  setAction(action: [number, number, number, number]): void {
    this.targetAction = [
      Math.max(-1, Math.min(1, action[0])), // Thrust: 0 to 1
      Math.max(-1, Math.min(1, action[1])), // Pitch: -1 to 1
      Math.max(-1, Math.min(1, action[2])), // Roll: -1 to 1
      Math.max(-1, Math.min(1, action[3])), // Yaw: -1 to 1
    ];
  }

  arm(): void {
    this.state.isArmed = true;
    console.log('🔓 Drone armed');
  }

  disarm(): void {
    this.state.isArmed = false;
    this.targetAction = [0, 0, 0, 0];
    console.log('🔒 Drone disarmed');
  }

  setFlightMode(mode: 'manual' | 'stabilized' | 'autonomous'): void {
    this.state.flightMode = mode;
    console.log(`🛸 Flight mode changed to: ${mode}`);
  }

  toggleHeightLock(): void {
    this.state.heightLockEnabled = !this.state.heightLockEnabled;
    if (this.state.heightLockEnabled) {
      this.state.targetAltitude = this.state.position[1];
      console.log(`🔒 Height lock enabled at ${this.state.targetAltitude.toFixed(2)}m`);
    } else {
      console.log('🔓 Height lock disabled');
    }
  }

  setHeightLock(enabled: boolean): void {
    this.state.heightLockEnabled = enabled;
    if (enabled) {
      this.state.targetAltitude = this.state.position[1];
      console.log(`🔒 Height lock enabled at ${this.state.targetAltitude.toFixed(2)}m`);
    } else {
      console.log('🔓 Height lock disabled');
    }
  }

  setTargetAltitude(altitude: number): void {
    this.state.targetAltitude = Math.max(0.5, Math.min(50, altitude));
    console.log(`🎯 Target altitude set to ${this.state.targetAltitude.toFixed(2)}m`);
  }

  emergencyLand(): void {
    console.log('🚨 EMERGENCY LANDING - Forcing drone to ground');
    this.state.targetAltitude = 0.5;
    this.targetAction = [0.1, 0, 0, 0]; // Minimal thrust
    this.currentAction = [0.1, 0, 0, 0];
    this.altitudeIntegral = 0;
    this.lastAltitudeError = 0;
  }

  getPosition(): [number, number, number] {
    return [...this.state.position];
  }

  getRotation(): [number, number, number] {
    return [...this.state.rotation];
  }

  getVelocity(): [number, number, number] {
    return [...this.state.velocity];
  }

  getBattery(): number {
    return this.state.battery;
  }

  getState(): DroneState {
    return { ...this.state };
  }

  getConfig(): DroneConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<DroneConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Drone config updated:', this.config);
  }

  reset(): void {
    console.log('🔄 Resetting drone controller...');
    
    this.state = {
      position: [0, 3, 0], // Lower starting position
      rotation: [0, 0, 0],
      velocity: [0, 0, 0],
      angularVelocity: [0, 0, 0],
      battery: 100,
      motors: [0, 0, 0, 0],
      isArmed: false,
      flightMode: 'manual',
      heightLockEnabled: false,
      targetAltitude: 3, // Lower target altitude
    };
    
    this.targetAction = [0, 0, 0, 0];
    this.currentAction = [0, 0, 0, 0];
    
    // Reset PID controllers
    Object.keys(this.pidControllers).forEach(key => {
      this.pidControllers[key as keyof typeof this.pidControllers] = {
        integral: 0,
        lastError: 0,
      };
    });
    
    // Reset altitude control
    this.altitudeIntegral = 0;
    this.lastAltitudeError = 0;
    
    if (this.droneBody && this.Ammo) {
      // Reset physics body position
      const transform = this.droneBody.getWorldTransform();
      transform.setOrigin(new this.Ammo.btVector3(...this.state.position));
      transform.setRotation(new this.Ammo.btQuaternion(0, 0, 0, 1));
      this.droneBody.setWorldTransform(transform);
      
      // Reset velocities
      this.droneBody.setLinearVelocity(new this.Ammo.btVector3(0, 0, 0));
      this.droneBody.setAngularVelocity(new this.Ammo.btVector3(0, 0, 0));
    }
  }
}