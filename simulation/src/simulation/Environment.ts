import { PhysicsWorld } from './PhysicsWorld.js';

export interface Plant {
  id: string;
  position: [number, number, number];
  health: 'healthy' | 'sick' | 'unknown';
  confidence: number;
  age: number;
  size: number;
  type: 'corn' | 'wheat' | 'soybean' | 'tomato';
  growthStage: 'seedling' | 'vegetative' | 'flowering' | 'mature';
  waterLevel: number;
  nutrientLevel: number;
  diseaseLevel: number;
}

export interface WeatherConditions {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  sunlight: number;
}

export interface EnvironmentConfig {
  worldSize: number;
  maxPlants: number;
  plantTypes: string[];
  weatherEnabled: boolean;
  growthEnabled: boolean;
  diseaseEnabled: boolean;
}

export class Environment {
  private physicsWorld?: PhysicsWorld;
  private plants: Plant[] = [];
  private groundBody?: any;
  private weather: WeatherConditions = {
    temperature: 20,
    humidity: 60,
    windSpeed: 2,
    windDirection: 0,
    precipitation: 0,
    sunlight: 80,
  };
  
  private config: EnvironmentConfig = {
    worldSize: parseInt(process.env.WORLD_SIZE || '100'),
    maxPlants: parseInt(process.env.MAX_PLANTS || '100'),
    plantTypes: ['corn', 'wheat', 'soybean', 'tomato'],
    weatherEnabled: process.env.WEATHER_ENABLED === 'true',
    growthEnabled: process.env.GROWTH_ENABLED === 'true',
    diseaseEnabled: process.env.DISEASE_ENABLED === 'true',
  };

  async initialize(physicsWorld: PhysicsWorld): Promise<void> {
    console.log('🌱 Initializing environment...');
    
    this.physicsWorld = physicsWorld;
    
    try {
      await this.createGround();
      await this.generatePlants();
      
      console.log(`✅ Environment initialized with ${this.plants.length} plants`);
    } catch (error) {
      console.error('❌ Failed to initialize environment:', error);
      throw error;
    }
  }

  private async createGround(): Promise<void> {
    const ammoModule = await import('ammo.js');
    const Ammo = ammoModule.default || ammoModule;
    
    // Initialize Ammo.js
    if (typeof Ammo === 'function') {
      await Ammo();
    }
    
    // Create ground collision shape
    const groundShape = new Ammo.btBoxShape(
      new Ammo.btVector3(this.config.worldSize / 2, 0.5, this.config.worldSize / 2)
    );
    
    // Create ground transform
    const groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -0.5, 0));
    
    // Create ground motion state
    const groundMotionState = new Ammo.btDefaultMotionState(groundTransform);
    
    // Create ground rigid body (mass = 0 for static body)
    const groundRbInfo = new Ammo.btRigidBodyConstructionInfo(
      0,
      groundMotionState,
      groundShape,
      new Ammo.btVector3(0, 0, 0)
    );
    
    this.groundBody = new Ammo.btRigidBody(groundRbInfo);
    
    // Add to physics world
    this.physicsWorld!.addRigidBody('ground', this.groundBody);
  }

  private async generatePlants(): Promise<void> {
    this.plants = [];
    
    for (let i = 0; i < this.config.maxPlants; i++) {
      const plantType = this.config.plantTypes[Math.floor(Math.random() * this.config.plantTypes.length)];
      const age = Math.random() * 100; // Random age between 0-100 days
      
      const plant: Plant = {
        id: `plant_${i}`,
        position: [
          (Math.random() - 0.5) * this.config.worldSize * 0.8,
          0,
          (Math.random() - 0.5) * this.config.worldSize * 0.8,
        ],
        health: this.determineInitialHealth(plantType, age),
        confidence: 0,
        age: age,
        size: this.calculateSize(plantType, age),
        type: plantType as any,
        growthStage: this.determineGrowthStage(age),
        waterLevel: 70 + (Math.random() - 0.5) * 40, // 50-90%
        nutrientLevel: 70 + (Math.random() - 0.5) * 40, // 50-90%
        diseaseLevel: Math.random() * 20, // 0-20% initial disease
      };
      
      this.plants.push(plant);
    }
  }

  private determineInitialHealth(type: string, age: number): 'healthy' | 'sick' | 'unknown' {
    // Base health probability
    let healthProbability = 0.7;
    
    // Age affects health
    if (age < 10) healthProbability *= 0.8; // Young plants more vulnerable
    if (age > 80) healthProbability *= 0.9; // Old plants more vulnerable
    
    // Type affects health
    switch (type) {
      case 'tomato': healthProbability *= 0.9; break; // More susceptible
      case 'corn': healthProbability *= 1.1; break; // More resistant
      case 'wheat': healthProbability *= 1.0; break; // Average
      case 'soybean': healthProbability *= 1.05; break; // Slightly resistant
    }
    
    return Math.random() < healthProbability ? 'healthy' : 'sick';
  }

  private calculateSize(type: string, age: number): number {
    const maxSizes = { corn: 2.5, wheat: 1.2, soybean: 1.0, tomato: 1.8 };
    const maxSize = maxSizes[type as keyof typeof maxSizes] || 1.0;
    
    // Growth curve: slow start, rapid growth, plateau
    const growthFactor = Math.min(1.0, age / 60);
    return maxSize * growthFactor;
  }

  private determineGrowthStage(age: number): 'seedling' | 'vegetative' | 'flowering' | 'mature' {
    if (age < 15) return 'seedling';
    if (age < 45) return 'vegetative';
    if (age < 75) return 'flowering';
    return 'mature';
  }

  update(deltaTime: number): void {
    if (this.config.weatherEnabled) {
      this.updateWeather(deltaTime);
    }
    
    if (this.config.growthEnabled) {
      this.updatePlantGrowth(deltaTime);
    }
    
    if (this.config.diseaseEnabled) {
      this.updatePlantDiseases(deltaTime);
    }
    
    // Update plant health based on conditions
    this.updatePlantHealth();
  }

  private updateWeather(deltaTime: number): void {
    // Simulate weather changes over time
    const timeScale = deltaTime * 0.1; // Slow weather changes
    
    // Temperature variation
    this.weather.temperature += (Math.random() - 0.5) * timeScale * 2;
    this.weather.temperature = Math.max(-10, Math.min(40, this.weather.temperature));
    
    // Humidity variation
    this.weather.humidity += (Math.random() - 0.5) * timeScale * 5;
    this.weather.humidity = Math.max(20, Math.min(100, this.weather.humidity));
    
    // Wind variation
    this.weather.windSpeed += (Math.random() - 0.5) * timeScale * 3;
    this.weather.windSpeed = Math.max(0, Math.min(20, this.weather.windSpeed));
    
    // Precipitation (occasional rain)
    if (Math.random() < 0.001) { // 0.1% chance per frame
      this.weather.precipitation = Math.random() * 10;
    } else {
      this.weather.precipitation = Math.max(0, this.weather.precipitation - timeScale);
    }
    
    // Sunlight variation
    this.weather.sunlight += (Math.random() - 0.5) * timeScale * 10;
    this.weather.sunlight = Math.max(20, Math.min(100, this.weather.sunlight));
  }

  private updatePlantGrowth(deltaTime: number): void {
    this.plants.forEach(plant => {
      // Age plants
      plant.age += deltaTime * 0.1; // 1 day per 10 seconds
      
      // Update growth stage
      plant.growthStage = this.determineGrowthStage(plant.age);
      
      // Update size
      plant.size = this.calculateSize(plant.type, plant.age);
      
      // Water level changes
      plant.waterLevel += (this.weather.precipitation * 0.1 - 0.5) * deltaTime;
      plant.waterLevel = Math.max(0, Math.min(100, plant.waterLevel));
      
      // Nutrient level changes (affected by water and temperature)
      const nutrientChange = (plant.waterLevel > 60 ? 0.1 : -0.2) * deltaTime;
      plant.nutrientLevel += nutrientChange;
      plant.nutrientLevel = Math.max(0, Math.min(100, plant.nutrientLevel));
    });
  }

  private updatePlantDiseases(deltaTime: number): void {
    this.plants.forEach(plant => {
      // Disease spread based on conditions
      const diseaseRisk = this.calculateDiseaseRisk(plant);
      
      if (Math.random() < diseaseRisk * deltaTime) {
        plant.diseaseLevel += Math.random() * 5 * deltaTime;
      }
      
      // Natural recovery
      if (plant.waterLevel > 70 && plant.nutrientLevel > 70) {
        plant.diseaseLevel = Math.max(0, plant.diseaseLevel - 2 * deltaTime);
      }
      
      plant.diseaseLevel = Math.min(100, plant.diseaseLevel);
    });
  }

  private calculateDiseaseRisk(plant: Plant): number {
    let risk = 0.01; // Base risk
    
    // High humidity increases disease risk
    if (this.weather.humidity > 80) risk *= 2;
    
    // Low water increases disease risk
    if (plant.waterLevel < 40) risk *= 1.5;
    
    // Low nutrients increase disease risk
    if (plant.nutrientLevel < 40) risk *= 1.5;
    
    // High disease level increases spread
    if (plant.diseaseLevel > 50) risk *= 2;
    
    // Plant type affects disease susceptibility
    switch (plant.type) {
      case 'tomato': risk *= 1.5; break;
      case 'corn': risk *= 0.8; break;
      case 'wheat': risk *= 1.0; break;
      case 'soybean': risk *= 0.9; break;
    }
    
    return risk;
  }

  private updatePlantHealth(): void {
    this.plants.forEach(plant => {
      const oldHealth = plant.health;
      
      // Determine health based on conditions
      const healthScore = this.calculateHealthScore(plant);
      
      if (healthScore > 70) {
        plant.health = 'healthy';
      } else if (healthScore < 30) {
        plant.health = 'sick';
      } else {
        plant.health = 'unknown';
      }
      
      // Update confidence based on how clear the health indicators are
      plant.confidence = Math.min(100, Math.abs(healthScore - 50) * 2);
      
      // Log health changes
      if (oldHealth !== plant.health) {
        console.log(`🌱 Plant ${plant.id} health changed from ${oldHealth} to ${plant.health}`);
      }
    });
  }

  private calculateHealthScore(plant: Plant): number {
    let score = 50; // Base score
    
    // Water level affects health
    if (plant.waterLevel > 60 && plant.waterLevel < 90) score += 20;
    else if (plant.waterLevel < 30 || plant.waterLevel > 95) score -= 30;
    
    // Nutrient level affects health
    if (plant.nutrientLevel > 60 && plant.nutrientLevel < 90) score += 20;
    else if (plant.nutrientLevel < 30 || plant.nutrientLevel > 95) score -= 30;
    
    // Disease level affects health
    score -= plant.diseaseLevel * 0.5;
    
    // Age affects health (very young or very old plants are more vulnerable)
    if (plant.age < 10 || plant.age > 90) score -= 10;
    
    // Weather affects health
    if (this.weather.temperature < 5 || this.weather.temperature > 35) score -= 15;
    if (this.weather.sunlight < 30) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  getPlants(): Plant[] {
    return [...this.plants];
  }

  getWeather(): WeatherConditions {
    return { ...this.weather };
  }

  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  updatePlantHealth(plantId: string, health: 'healthy' | 'sick', confidence: number): void {
    const plant = this.plants.find(p => p.id === plantId);
    if (plant) {
      plant.health = health;
      plant.confidence = confidence;
    }
  }

  // Get plants within a certain radius of a position
  getPlantsInRadius(position: [number, number, number], radius: number): Plant[] {
    return this.plants.filter(plant => {
      const dx = plant.position[0] - position[0];
      const dz = plant.position[2] - position[2];
      const distance = Math.sqrt(dx * dx + dz * dz);
      return distance <= radius;
    });
  }

  // Get plants visible from drone position (simplified line of sight)
  getVisiblePlants(dronePosition: [number, number, number], droneRotation: [number, number, number], maxDistance: number = 20): Plant[] {
    return this.plants.filter(plant => {
      const dx = plant.position[0] - dronePosition[0];
      const dy = plant.position[1] - dronePosition[1];
      const dz = plant.position[2] - dronePosition[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (distance > maxDistance) return false;
      
      // Simple line of sight check (drone can see plants below it)
      return dy < 0 || distance < 5; // Can see plants below or very close
    });
  }

  // Apply environmental effects (e.g., from drone actions)
  applyEnvironmentalEffect(position: [number, number, number], effectType: 'water' | 'fertilizer' | 'pesticide', intensity: number): void {
    const affectedPlants = this.getPlantsInRadius(position, 5);
    
    affectedPlants.forEach(plant => {
      switch (effectType) {
        case 'water':
          plant.waterLevel = Math.min(100, plant.waterLevel + intensity * 10);
          break;
        case 'fertilizer':
          plant.nutrientLevel = Math.min(100, plant.nutrientLevel + intensity * 15);
          break;
        case 'pesticide':
          plant.diseaseLevel = Math.max(0, plant.diseaseLevel - intensity * 20);
          break;
      }
    });
  }

  updateConfig(newConfig: Partial<EnvironmentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Environment config updated:', this.config);
  }

  reset(): void {
    console.log('🔄 Resetting environment...');
    this.generatePlants();
    this.weather = {
      temperature: 20,
      humidity: 60,
      windSpeed: 2,
      windDirection: 0,
      precipitation: 0,
      sunlight: 80,
    };
  }
}