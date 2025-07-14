import * as CANNON from 'cannon-es';

export interface PhysicsConfig {
  gravity: [number, number, number];
  maxSubSteps: number;
  enableContactCallbacks: boolean;
  enableCollisionFiltering: boolean;
  enablePerformanceMonitoring: boolean;
  broadphase: 'naive' | 'sap' | 'grid';
  solver: 'gs' | 'split';
}

export interface CollisionInfo {
  bodyA: string;
  bodyB: string;
  position: [number, number, number];
  normal: [number, number, number];
  impulse: number;
}

export class PhysicsWorld {
  private world: CANNON.World;
  private bodies: Map<string, CANNON.Body> = new Map();
  private collisionCallbacks: Map<string, (info: CollisionInfo) => void> = new Map();
  private initialized = false;
  
  // Performance monitoring
  private performanceMetrics = {
    stepTime: 0,
    collisionChecks: 0,
    activeBodies: 0,
  };
  
  // Configuration
  private config: PhysicsConfig = {
    gravity: [0, -9.81, 0],
    maxSubSteps: parseInt(process.env.PHYSICS_MAX_SUBSTEPS || '10'),
    enableContactCallbacks: process.env.ENABLE_CONTACT_CALLBACKS === 'true',
    enableCollisionFiltering: process.env.ENABLE_COLLISION_FILTERING === 'true',
    enablePerformanceMonitoring: process.env.ENABLE_PHYSICS_PERFORMANCE === 'true',
    broadphase: 'sap',
    solver: 'gs',
  };

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('🌍 Initializing enhanced physics world with Cannon.js...');
    
    try {
      // Create physics world
      this.world = new CANNON.World({
        gravity: new CANNON.Vec3(...this.config.gravity),
      });
      
      // Configure solver
      if (this.config.solver === 'split') {
        this.world.solver = new CANNON.SplitSolver(new CANNON.GSSolver());
      } else {
        this.world.solver = new CANNON.GSSolver();
      }
      
      this.world.solver.iterations = 10;
      this.world.solver.tolerance = 0.0001;
      
      // Configure broadphase
      switch (this.config.broadphase) {
        case 'sap':
          this.world.broadphase = new CANNON.SAPBroadphase(this.world);
          break;
        case 'grid':
          this.world.broadphase = new CANNON.GridBroadphase();
          break;
        default:
          this.world.broadphase = new CANNON.NaiveBroadphase();
      }
      
      // Enable contact material
      this.world.defaultContactMaterial.friction = 0.4;
      this.world.defaultContactMaterial.restitution = 0.3;
      
      // Allow sleeping for performance
      this.world.allowSleep = true;
      
      // Setup collision callbacks if enabled
      if (this.config.enableContactCallbacks) {
        this.setupCollisionCallbacks();
      }
      
      this.initialized = true;
      console.log('✅ Enhanced physics world initialized with Cannon.js');
    } catch (error) {
      console.error('❌ Failed to initialize physics world:', error);
      throw error;
    }
  }

  private setupCollisionCallbacks(): void {
    this.world.addEventListener('beginContact', (event: any) => {
      const { bodyA, bodyB, contact } = event;
      
      // Find body IDs
      let bodyAId = '';
      let bodyBId = '';
      
      for (const [id, body] of this.bodies) {
        if (body === bodyA) bodyAId = id;
        if (body === bodyB) bodyBId = id;
      }
      
      if (bodyAId && bodyBId) {
        const collisionInfo: CollisionInfo = {
          bodyA: bodyAId,
          bodyB: bodyBId,
          position: [
            contact.getContactPoint(bodyA).x,
            contact.getContactPoint(bodyA).y,
            contact.getContactPoint(bodyA).z,
          ],
          normal: [
            contact.ni.x,
            contact.ni.y,
            contact.ni.z,
          ],
          impulse: contact.getImpactVelocityAlongNormal(),
        };
        
        // Call registered callbacks
        const callbackKey = `${bodyAId}-${bodyBId}`;
        const callback = this.collisionCallbacks.get(callbackKey);
        if (callback) {
          callback(collisionInfo);
        }
        
        // Also check reverse order
        const reverseCallbackKey = `${bodyBId}-${bodyAId}`;
        const reverseCallback = this.collisionCallbacks.get(reverseCallbackKey);
        if (reverseCallback) {
          reverseCallback(collisionInfo);
        }
      }
    });
  }

  step(deltaTime: number): void {
    if (!this.initialized || !this.world) return;
    
    const startTime = performance.now();
    
    // Step the simulation with fixed timestep
    this.world.fixedStep(deltaTime, deltaTime, this.config.maxSubSteps);
    
    // Update performance metrics
    if (this.config.enablePerformanceMonitoring) {
      this.performanceMetrics.stepTime = performance.now() - startTime;
      this.performanceMetrics.activeBodies = this.world.bodies.length;
      this.performanceMetrics.collisionChecks = this.world.contacts.length;
    }
  }

  addRigidBody(id: string, body: CANNON.Body, collisionGroup: number = 1, collisionMask: number = -1): void {
    if (!this.initialized || !this.world) return;
    
    if (this.config.enableCollisionFiltering) {
      body.collisionFilterGroup = collisionGroup;
      body.collisionFilterMask = collisionMask;
    }
    
    this.world.addBody(body);
    this.bodies.set(id, body);
  }

  removeRigidBody(id: string): void {
    if (!this.initialized || !this.world) return;
    
    const body = this.bodies.get(id);
    if (body) {
      this.world.removeBody(body);
      this.bodies.delete(id);
    }
  }

  getRigidBody(id: string): CANNON.Body | undefined {
    return this.bodies.get(id);
  }

  // Create common shapes
  createBoxShape(size: [number, number, number]): CANNON.Shape {
    return new CANNON.Box(new CANNON.Vec3(size[0] / 2, size[1] / 2, size[2] / 2));
  }

  createSphereShape(radius: number): CANNON.Shape {
    return new CANNON.Sphere(radius);
  }

  createCylinderShape(radiusTop: number, radiusBottom: number, height: number, numSegments: number = 8): CANNON.Shape {
    return new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments);
  }

  createPlaneShape(): CANNON.Shape {
    return new CANNON.Plane();
  }

  // Create common materials
  createMaterial(name: string, friction: number = 0.4, restitution: number = 0.3): CANNON.Material {
    return new CANNON.Material(name, {
      friction,
      restitution,
    });
  }

  createContactMaterial(materialA: CANNON.Material, materialB: CANNON.Material, options: any = {}): CANNON.ContactMaterial {
    const contactMaterial = new CANNON.ContactMaterial(materialA, materialB, {
      friction: options.friction || 0.4,
      restitution: options.restitution || 0.3,
      contactEquationStiffness: options.stiffness || 1e8,
      contactEquationRelaxation: options.relaxation || 3,
    });
    
    this.world.addContactMaterial(contactMaterial);
    return contactMaterial;
  }

  // Add collision callback for specific body pairs
  addCollisionCallback(bodyAId: string, bodyBId: string, callback: (info: CollisionInfo) => void): void {
    const key = `${bodyAId}-${bodyBId}`;
    this.collisionCallbacks.set(key, callback);
  }

  // Remove collision callback
  removeCollisionCallback(bodyAId: string, bodyBId: string): void {
    const key = `${bodyAId}-${bodyBId}`;
    this.collisionCallbacks.delete(key);
  }

  // Get all bodies in a region
  getBodiesInRegion(center: [number, number, number], radius: number): string[] {
    const bodiesInRegion: string[] = [];
    
    for (const [id, body] of this.bodies) {
      const distance = body.position.distanceTo(new CANNON.Vec3(...center));
      if (distance <= radius) {
        bodiesInRegion.push(id);
      }
    }
    
    return bodiesInRegion;
  }

  // Apply force to a body
  applyForce(bodyId: string, force: [number, number, number], position?: [number, number, number]): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;
    
    const forceVector = new CANNON.Vec3(...force);
    
    if (position) {
      const positionVector = new CANNON.Vec3(...position);
      body.applyForce(forceVector, positionVector);
    } else {
      body.applyForce(forceVector);
    }
  }

  // Apply impulse to a body
  applyImpulse(bodyId: string, impulse: [number, number, number], position?: [number, number, number]): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;
    
    const impulseVector = new CANNON.Vec3(...impulse);
    
    if (position) {
      const positionVector = new CANNON.Vec3(...position);
      body.applyImpulse(impulseVector, positionVector);
    } else {
      body.applyImpulse(impulseVector);
    }
  }

  // Get body transform
  getBodyTransform(bodyId: string): { position: [number, number, number]; rotation: [number, number, number, number] } | null {
    const body = this.bodies.get(bodyId);
    if (!body) return null;
    
    return {
      position: [body.position.x, body.position.y, body.position.z],
      rotation: [body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w],
    };
  }

  // Set body transform
  setBodyTransform(bodyId: string, position: [number, number, number], rotation: [number, number, number, number]): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;
    
    body.position.set(...position);
    body.quaternion.set(rotation[0], rotation[1], rotation[2], rotation[3]);
  }

  // Get body velocity
  getBodyVelocity(bodyId: string): { linear: [number, number, number]; angular: [number, number, number] } | null {
    const body = this.bodies.get(bodyId);
    if (!body) return null;
    
    return {
      linear: [body.velocity.x, body.velocity.y, body.velocity.z],
      angular: [body.angularVelocity.x, body.angularVelocity.y, body.angularVelocity.z],
    };
  }

  // Set body velocity
  setBodyVelocity(bodyId: string, linear: [number, number, number], angular: [number, number, number]): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;
    
    body.velocity.set(...linear);
    body.angularVelocity.set(...angular);
  }

  // Add constraints
  addConstraint(constraint: CANNON.Constraint): void {
    this.world.addConstraint(constraint);
  }

  removeConstraint(constraint: CANNON.Constraint): void {
    this.world.removeConstraint(constraint);
  }

  reset(): void {
    if (!this.initialized || !this.world) return;
    
    console.log('🔄 Resetting physics world...');
    
    // Remove all bodies
    for (const [id, body] of this.bodies) {
      this.world.removeBody(body);
    }
    this.bodies.clear();
    
    // Clear collision callbacks
    this.collisionCallbacks.clear();
    
    // Reset performance metrics
    this.performanceMetrics = {
      stepTime: 0,
      collisionChecks: 0,
      activeBodies: 0,
    };
  }

  getWorld(): CANNON.World {
    return this.world;
  }

  getConfig(): PhysicsConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update gravity if changed
    if (this.world && newConfig.gravity) {
      this.world.gravity.set(...newConfig.gravity);
    }
    
    console.log('⚙️ Physics config updated:', this.config);
  }

  getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }

  // Cleanup
  dispose(): void {
    if (this.world) {
      // Remove all bodies
      for (const [id, body] of this.bodies) {
        this.world.removeBody(body);
      }
      this.bodies.clear();
      
      // Clear callbacks
      this.collisionCallbacks.clear();
    }
    
    console.log('🧹 Physics world disposed');
  }
}