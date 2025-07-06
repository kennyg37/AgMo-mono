export interface PhysicsConfig {
  gravity: [number, number, number];
  maxSubSteps: number;
  enableContactCallbacks: boolean;
  enableCollisionFiltering: boolean;
  enablePerformanceMonitoring: boolean;
}

export interface CollisionInfo {
  bodyA: string;
  bodyB: string;
  position: [number, number, number];
  normal: [number, number, number];
  impulse: number;
}

export class PhysicsWorld {
  private world: any;
  private bodies: Map<string, any> = new Map();
  private collisionCallbacks: Map<string, (info: CollisionInfo) => void> = new Map();
  private initialized = false;
  private Ammo?: any;
  
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
  };

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('🌍 Initializing physics world...');
    
    try {
      // Import Ammo.js dynamically
      const ammoModule = await import('ammo.js');
      this.Ammo = ammoModule.default || ammoModule;
      
      // Initialize Ammo.js
      if (typeof this.Ammo === 'function') {
        await this.Ammo();
      }
      
      // Create collision configuration
      const collisionConfiguration = new this.Ammo.btDefaultCollisionConfiguration();
      const dispatcher = new this.Ammo.btCollisionDispatcher(collisionConfiguration);
      const overlappingPairCache = new this.Ammo.btDbvtBroadphase();
      const solver = new this.Ammo.btSequentialImpulseConstraintSolver();
      
      // Create physics world
      this.world = new this.Ammo.btDiscreteDynamicsWorld(
        dispatcher,
        overlappingPairCache,
        solver,
        collisionConfiguration
      );
      
      // Set gravity
      this.world.setGravity(new this.Ammo.btVector3(...this.config.gravity));
      
      // Setup collision callbacks if enabled
      if (this.config.enableContactCallbacks) {
        this.setupCollisionCallbacks();
      }
      
      this.initialized = true;
      console.log('✅ Physics world initialized');
    } catch (error) {
      console.error('❌ Failed to initialize physics world:', error);
      throw error;
    }
  }

  private setupCollisionCallbacks(): void {
    // Create a custom collision callback
    const collisionCallback = new (this.Ammo as any).btCollisionWorld.ContactResultCallback();
    
    collisionCallback.addSingleResult = (cp: any, colObj0Wrap: any, partId0: number, index0: number, colObj1Wrap: any, partId1: number, index1: number) => {
      const bodyA = colObj0Wrap.getCollisionObject();
      const bodyB = colObj1Wrap.getCollisionObject();
      
      // Find body IDs
      let bodyAId = '';
      let bodyBId = '';
      
      for (const [id, body] of this.bodies) {
        if (body === bodyA) bodyAId = id;
        if (body === bodyB) bodyBId = id;
      }
      
      if (bodyAId && bodyBId) {
        const contactPoint = cp.get_m_localPointA();
        const normal = cp.get_m_normalWorldOnB();
        const impulse = cp.get_m_appliedImpulse();
        
        const collisionInfo: CollisionInfo = {
          bodyA: bodyAId,
          bodyB: bodyBId,
          position: [contactPoint.x(), contactPoint.y(), contactPoint.z()],
          normal: [normal.x(), normal.y(), normal.z()],
          impulse: impulse,
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
      
      return 0;
    };
    
    // Store the callback for use in step
    (this.world as any).collisionCallback = collisionCallback;
  }

  step(deltaTime: number): void {
    if (!this.initialized || !this.world) return;
    
    const startTime = performance.now();
    
    // Step the simulation
    this.world.stepSimulation(deltaTime, this.config.maxSubSteps);
    
    // Update performance metrics
    if (this.config.enablePerformanceMonitoring) {
      this.performanceMetrics.stepTime = performance.now() - startTime;
      this.performanceMetrics.activeBodies = this.world.getNumCollisionObjects();
    }
    
    // Process collision callbacks if enabled
    if (this.config.enableContactCallbacks && (this.world as any).collisionCallback) {
      this.processCollisionCallbacks();
    }
  }

  private processCollisionCallbacks(): void {
    // This would be called after each physics step to process collisions
    // For now, we'll use a simpler approach with manual collision detection
    const collisionPairs = new Set<string>();
    
    // Check for overlapping bodies (simplified collision detection)
    const bodies = Array.from(this.bodies.values());
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const bodyA = bodies[i];
        const bodyB = bodies[j];
        
        // Get body IDs
        let bodyAId = '';
        let bodyBId = '';
        for (const [id, body] of this.bodies) {
          if (body === bodyA) bodyAId = id;
          if (body === bodyB) bodyBId = id;
        }
        
        if (bodyAId && bodyBId) {
          const pairKey = `${bodyAId}-${bodyBId}`;
          if (!collisionPairs.has(pairKey)) {
            // Check if bodies are colliding (simplified)
            const transformA = bodyA.getWorldTransform();
            const transformB = bodyB.getWorldTransform();
            const posA = transformA.getOrigin();
            const posB = transformB.getOrigin();
            
            const distance = Math.sqrt(
              Math.pow(posA.x() - posB.x(), 2) +
              Math.pow(posA.y() - posB.y(), 2) +
              Math.pow(posA.z() - posB.z(), 2)
            );
            
            // Simple collision detection (bodies are colliding if very close)
            if (distance < 1.0) {
              collisionPairs.add(pairKey);
              this.performanceMetrics.collisionChecks++;
              
              // Call collision callback
              const callback = this.collisionCallbacks.get(pairKey);
              if (callback) {
                const collisionInfo: CollisionInfo = {
                  bodyA: bodyAId,
                  bodyB: bodyBId,
                  position: [posA.x(), posA.y(), posA.z()],
                  normal: [0, 1, 0], // Simplified normal
                  impulse: 0,
                };
                callback(collisionInfo);
              }
            }
          }
        }
      }
    }
  }

  addRigidBody(id: string, body: any, collisionGroup: number = 1, collisionMask: number = -1): void {
    if (!this.initialized || !this.world) return;
    
    if (this.config.enableCollisionFiltering) {
      this.world.addRigidBody(body, collisionGroup, collisionMask);
    } else {
      this.world.addRigidBody(body);
    }
    
    this.bodies.set(id, body);
  }

  removeRigidBody(id: string): void {
    if (!this.initialized || !this.world) return;
    
    const body = this.bodies.get(id);
    if (body) {
      this.world.removeRigidBody(body);
      this.bodies.delete(id);
    }
  }

  getRigidBody(id: string): any {
    return this.bodies.get(id);
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
      const transform = body.getWorldTransform();
      const position = transform.getOrigin();
      
      const distance = Math.sqrt(
        Math.pow(position.x() - center[0], 2) +
        Math.pow(position.y() - center[1], 2) +
        Math.pow(position.z() - center[2], 2)
      );
      
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
    
    const forceVector = new this.Ammo!.btVector3(...force);
    
    if (position) {
      const positionVector = new this.Ammo!.btVector3(...position);
      body.applyForce(forceVector, positionVector);
    } else {
      body.applyCentralForce(forceVector);
    }
  }

  // Apply impulse to a body
  applyImpulse(bodyId: string, impulse: [number, number, number], position?: [number, number, number]): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;
    
    const impulseVector = new this.Ammo!.btVector3(...impulse);
    
    if (position) {
      const positionVector = new this.Ammo!.btVector3(...position);
      body.applyImpulse(impulseVector, positionVector);
    } else {
      body.applyCentralImpulse(impulseVector);
    }
  }

  // Get body transform
  getBodyTransform(bodyId: string): { position: [number, number, number]; rotation: [number, number, number, number] } | null {
    const body = this.bodies.get(bodyId);
    if (!body) return null;
    
    const transform = body.getWorldTransform();
    const position = transform.getOrigin();
    const rotation = transform.getRotation();
    
    return {
      position: [position.x(), position.y(), position.z()],
      rotation: [rotation.x(), rotation.y(), rotation.z(), rotation.w()],
    };
  }

  // Set body transform
  setBodyTransform(bodyId: string, position: [number, number, number], rotation: [number, number, number, number]): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;
    
    const transform = body.getWorldTransform();
    transform.setOrigin(new this.Ammo!.btVector3(...position));
    transform.setRotation(new this.Ammo!.btQuaternion(...rotation));
    body.setWorldTransform(transform);
  }

  // Get body velocity
  getBodyVelocity(bodyId: string): { linear: [number, number, number]; angular: [number, number, number] } | null {
    const body = this.bodies.get(bodyId);
    if (!body) return null;
    
    const linearVel = body.getLinearVelocity();
    const angularVel = body.getAngularVelocity();
    
    return {
      linear: [linearVel.x(), linearVel.y(), linearVel.z()],
      angular: [angularVel.x(), angularVel.y(), angularVel.z()],
    };
  }

  // Set body velocity
  setBodyVelocity(bodyId: string, linear: [number, number, number], angular: [number, number, number]): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;
    
    body.setLinearVelocity(new this.Ammo!.btVector3(...linear));
    body.setAngularVelocity(new this.Ammo!.btVector3(...angular));
  }

  reset(): void {
    if (!this.initialized || !this.world) return;
    
    console.log('🔄 Resetting physics world...');
    
    // Remove all bodies
    for (const [id, body] of this.bodies) {
      this.world.removeRigidBody(body);
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

  getWorld(): any {
    return this.world;
  }

  getConfig(): PhysicsConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update gravity if changed
    if (this.world && newConfig.gravity) {
      this.world.setGravity(new this.Ammo!.btVector3(...newConfig.gravity));
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
        this.world.removeRigidBody(body);
      }
      this.bodies.clear();
      
      // Clear callbacks
      this.collisionCallbacks.clear();
    }
    
    console.log('🧹 Physics world disposed');
  }
}