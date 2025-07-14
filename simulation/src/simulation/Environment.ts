import * as CANNON from 'cannon-es';
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
  visualVariation: number; // For visual diversity
}

export interface WeatherConditions {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  sunlight: number;
  timeOfDay: number; // 0-24 hours
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

export interface EnvironmentConfig {
  worldSize: number;
  maxPlants: number;
  plantTypes: string[];
  weatherEnabled: boolean;
  growthEnabled: boolean;
  diseaseEnabled: boolean;
  seasonalChanges: boolean;
  plantDensity: number;
}

export class Environment {
  private physicsWorld?: PhysicsWorld;
  private plants: Plant[] = [];
  private groundBody?: CANNON.Body;
  private plantBodies: Map<string, CANNON.Body> = new Map();
  
  private weather: WeatherConditions = {
    temperature: 22,
    humidity: 65,
    windSpeed: 3,
    windDirection: 0,
    precipitation: 0,
    sunlight: 85,
    timeOfDay: 12, // Noon
    season: 'summer',
  };
  
  private config: EnvironmentConfig = {
    worldSize: parseInt(process.env.WORLD_SIZE || '100'),
    maxPlants: parseInt(process.env.MAX_PLANTS || '100'),
    plantTypes: ['corn', 'wheat', 'soybean', 'tomato'],
    weatherEnabled: process.env.WEATHER_ENABLED === 'true',
    growthEnabled: process.env.GROWTH_ENABLED === 'true',
    diseaseEnabled: process.env.DISEASE_ENABLED === 'true',
    seasonalChanges: true,
    plantDensity: 0.8, // Plants per square meter
  };

  // Materials
  private groundMaterial?: CANNON.Material;
  private plantMaterial?: CANNON.Material;

  async initialize(physicsWorld: PhysicsWorld): Promise<void> {
    console.log('🌱 Initializing enhanced environment...');
    
    this.physicsWorld = physicsWorld;
    
    try {
      await this.createMaterials();
      await this.createGround();
      await this.generatePlants();
      
      console.log(`✅ Enhanced environment initialized with ${this.plants.length} plants`);
    } catch (error) {
      console.error('❌ Failed to initialize environment:', error);
      throw error;
    }
  }

  private async createMaterials(): Promise<void> {
    // Create ground material
    this.groundMaterial = this.physicsWorld!.createMaterial('ground', 0.6, 0.2);
    
    // Create plant material
    this.plantMaterial = this.physicsWorld!.createMaterial('plant', 0.4, 0.1);
    
    // Create contact materials
    this.physicsWorld!.createContactMaterial(this.groundMaterial, this.plantMaterial, {
      friction: 0.8,
      restitution: 0.1,
    });
  }

  private async createGround(): Promise<void> {
    // Create realistic terrain with height variations
    const groundShape = this.physicsWorld!.createPlaneShape();
    
    this.groundBody = new CANNON.Body({
      mass: 0, // Static body
      shape: groundShape,
      position: new CANNON.Vec3(0, 0, 0),
      material: this.groundMaterial,
    });
    
    // Rotate to be horizontal
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    
    // Add to physics world
    this.physicsWorld!.addRigidBody('ground', this.groundBody);
  }

  private async generatePlants(): Promise<void> {
    this.plants = [];
    this.plantBodies.clear();
    
    // Generate plants in a more realistic distribution
    const plantCount = Math.min(this.config.maxPlants, 
      Math.floor(this.config.worldSize * this.config.worldSize * this.config.plantDensity / 100));
    
    for (let i = 0; i < plantCount; i++) {
      const plant = this.createRandomPlant(i);
      this.plants.push(plant);
      
      // Create physics body for plant (optional collision)
      if (plant.size > 0.5) {
        this.createPlantPhysicsBody(plant);
      }
    }
  }

  private createRandomPlant(index: number): Plant {
    const plantType = this.config.plantTypes[Math.floor(Math.random() * this.config.plantTypes.length)];
    const age = Math.random() * 120; // 0-120 days
    
    // Generate position with some clustering for realism
    const clusterCenter = [
      (Math.random() - 0.5) * this.config.worldSize * 0.6,
      0,
      (Math.random() - 0.5) * this.config.worldSize * 0.6,
    ];
    
    const position: [number, number, number] = [
      clusterCenter[0] + (Math.random() - 0.5) * 10,
      0,
      clusterCenter[2] + (Math.random() - 0.5) * 10,
    ];
    
    return {
      id: `plant_${index}`,
      position,
      health: this.determineInitialHealth(plantType, age),
      confidence: 0,
      age,
      size: this.calculateSize(plantType, age),
      type: plantType as any,
      growthStage: this.determineGrowthStage(age),
      waterLevel: 60 + (Math.random() - 0.5) * 50, // 35-85%
      nutrientLevel: 65 + (Math.random() - 0.5) * 50, // 40-90%
      diseaseLevel: Math.random() * 15, // 0-15% initial disease
      visualVariation: Math.random(), // For visual diversity
    };
  }

  private createPlantPhysicsBody(plant: Plant): void {
    // Create simple cylinder collision for larger plants
    const radius = plant.size * 0.1;
    const height = plant.size;
    
    const plantShape = this.physicsWorld!.createCylinderShape(radius, radius, height, 8);
    
    const plantBody = new CANNON.Body({
      mass: 0, // Static collision
      shape: plantShape,
      position: new CANNON.Vec3(plant.position[0], height / 2, plant.position[2]),
      material: this.plantMaterial,
    });
    
    this.physicsWorld!.addRigidBody(plant.id, plantBody);
    this.plantBodies.set(plant.id, plantBody);
  }

  private determineInitialHealth(type: string, age: number): 'healthy' | 'sick' | 'unknown' {
    let healthProbability = 0.75;
    
    // Age affects health
    if (age < 15) healthProbability *= 0.85; // Young plants more vulnerable
    if (age > 90) healthProbability *= 0.9; // Old plants more vulnerable
    
    // Type affects health (realistic plant characteristics)
    switch (type) {
      case 'tomato': healthProbability *= 0.85; break; // More susceptible
      case 'corn': healthProbability *= 1.1; break; // More resistant
      case 'wheat': healthProbability *= 1.0; break; // Average
      case 'soybean': healthProbability *= 1.05; break; // Slightly resistant
    }
    
    // Season affects health
    switch (this.weather.season) {
      case 'spring': healthProbability *= 1.1; break;
      case 'summer': healthProbability *= 1.0; break;
      case 'autumn': healthProbability *= 0.95; break;
      case 'winter': healthProbability *= 0.8; break;
    }
    
    return Math.random() < healthProbability ? 'healthy' : 'sick';
  }

  private calculateSize(type: string, age: number): number {
    const maxSizes = { 
      corn: 2.8, 
      wheat: 1.4, 
      soybean: 1.1, 
      tomato: 2.0 
    };
    const maxSize = maxSizes[type as keyof typeof maxSizes] || 1.0;
    
    // Realistic growth curve: slow start, rapid growth, plateau
    const growthFactor = 1 - Math.exp(-age / 30);
    const seasonalMultiplier = this.getSeasonalGrowthMultiplier();
    
    return maxSize * growthFactor * seasonalMultiplier;
  }

  private getSeasonalGrowthMultiplier(): number {
    switch (this.weather.season) {
      case 'spring': return 1.1;
      case 'summer': return 1.0;
      case 'autumn': return 0.9;
      case 'winter': return 0.7;
      default: return 1.0;
    }
  }

  private determineGrowthStage(age: number): 'seedling' | 'vegetative' | 'flowering' | 'mature' {
    if (age < 20) return 'seedling';
    if (age < 50) return 'vegetative';
    if (age < 80) return 'flowering';
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
    
    // Update seasonal changes
    if (this.config.seasonalChanges) {
      this.updateSeasons(deltaTime);
    }
  }

  private updateWeather(deltaTime: number): void {
    const timeScale = deltaTime * 0.05; // Slower weather changes
    
    // Time of day progression
    this.weather.timeOfDay += deltaTime * 0.1; // 1 hour per 10 seconds
    if (this.weather.timeOfDay >= 24) {
      this.weather.timeOfDay = 0;
    }
    
    // Temperature variation based on time of day
    const baseTemp = this.getSeasonalBaseTemperature();
    const dailyTempVariation = Math.sin((this.weather.timeOfDay - 6) * Math.PI / 12) * 8;
    this.weather.temperature = baseTemp + dailyTempVariation + (Math.random() - 0.5) * 2;
    
    // Humidity variation
    this.weather.humidity += (Math.random() - 0.5) * timeScale * 3;
    this.weather.humidity = Math.max(30, Math.min(95, this.weather.humidity));
    
    // Wind variation
    this.weather.windSpeed += (Math.random() - 0.5) * timeScale * 2;
    this.weather.windSpeed = Math.max(0, Math.min(15, this.weather.windSpeed));
    
    this.weather.windDirection += (Math.random() - 0.5) * timeScale * 30;
    this.weather.windDirection = ((this.weather.windDirection % 360) + 360) % 360;
    
    // Precipitation (weather patterns)
    if (this.weather.humidity > 80 && Math.random() < 0.002) {
      this.weather.precipitation = Math.random() * 8;
    } else {
      this.weather.precipitation = Math.max(0, this.weather.precipitation - timeScale * 2);
    }
    
    // Sunlight based on time of day and weather
    const sunAngle = Math.max(0, Math.sin((this.weather.timeOfDay - 6) * Math.PI / 12));
    const cloudCover = Math.min(1, this.weather.humidity / 100 + this.weather.precipitation / 10);
    this.weather.sunlight = sunAngle * 100 * (1 - cloudCover * 0.7);
  }

  private getSeasonalBaseTemperature(): number {
    switch (this.weather.season) {
      case 'spring': return 18;
      case 'summer': return 28;
      case 'autumn': return 15;
      case 'winter': return 5;
      default: return 20;
    }
  }

  private updateSeasons(deltaTime: number): void {
    // Simple seasonal progression (could be more sophisticated)
    // For demo purposes, change season every few minutes
    const seasonDuration = 120; // seconds
    const currentTime = Date.now() / 1000;
    const seasonIndex = Math.floor((currentTime / seasonDuration) % 4);
    
    const seasons: Array<'spring' | 'summer' | 'autumn' | 'winter'> = 
      ['spring', 'summer', 'autumn', 'winter'];
    
    if (this.weather.season !== seasons[seasonIndex]) {
      this.weather.season = seasons[seasonIndex];
      console.log(`🌍 Season changed to: ${this.weather.season}`);
    }
  }

  private updatePlantGrowth(deltaTime: number): void {
    this.plants.forEach(plant => {
      // Age plants
      plant.age += deltaTime * 0.05; // 1 day per 20 seconds
      
      // Update growth stage
      plant.growthStage = this.determineGrowthStage(plant.age);
      
      // Update size
      const newSize = this.calculateSize(plant.type, plant.age);
      if (newSize !== plant.size) {
        plant.size = newSize;
        // Update physics body if it exists
        this.updatePlantPhysicsBody(plant);
      }
      
      // Water level changes based on weather
      const waterChange = (this.weather.precipitation * 0.2 - 0.3) * deltaTime;
      plant.waterLevel += waterChange;
      plant.waterLevel = Math.max(0, Math.min(100, plant.waterLevel));
      
      // Nutrient level changes
      const nutrientChange = (plant.waterLevel > 60 ? 0.05 : -0.15) * deltaTime;
      plant.nutrientLevel += nutrientChange;
      plant.nutrientLevel = Math.max(0, Math.min(100, plant.nutrientLevel));
    });
  }

  private updatePlantPhysicsBody(plant: Plant): void {
    const body = this.plantBodies.get(plant.id);
    if (body && plant.size > 0.5) {
      // Update collision shape size
      const radius = plant.size * 0.1;
      const height = plant.size;
      
      // Remove old body
      this.physicsWorld!.removeRigidBody(plant.id);
      this.plantBodies.delete(plant.id);
      
      // Create new body with updated size
      this.createPlantPhysicsBody(plant);
    }
  }

  private updatePlantDiseases(deltaTime: number): void {
    this.plants.forEach(plant => {
      const diseaseRisk = this.calculateDiseaseRisk(plant);
      
      // Disease spread
      if (Math.random() < diseaseRisk * deltaTime) {
        plant.diseaseLevel += Math.random() * 3 * deltaTime;
      }
      
      // Natural recovery with good conditions
      if (plant.waterLevel > 70 && plant.nutrientLevel > 70 && this.weather.sunlight > 60) {
        plant.diseaseLevel = Math.max(0, plant.diseaseLevel - 1.5 * deltaTime);
      }
      
      // Disease spread to nearby plants
      if (plant.diseaseLevel > 60) {
        this.spreadDiseaseToNearbyPlants(plant, deltaTime);
      }
      
      plant.diseaseLevel = Math.min(100, plant.diseaseLevel);
    });
  }

  private calculateDiseaseRisk(plant: Plant): number {
    let risk = 0.005; // Base risk
    
    // Weather conditions affect disease risk
    if (this.weather.humidity > 85) risk *= 2.5;
    if (this.weather.temperature < 10 || this.weather.temperature > 35) risk *= 1.8;
    if (this.weather.precipitation > 5) risk *= 1.5;
    
    // Plant conditions affect disease risk
    if (plant.waterLevel < 30) risk *= 2.0;
    if (plant.nutrientLevel < 30) risk *= 1.8;
    if (plant.age < 15 || plant.age > 100) risk *= 1.5;
    
    // Existing disease increases risk
    if (plant.diseaseLevel > 40) risk *= 2.0;
    
    // Plant type susceptibility
    switch (plant.type) {
      case 'tomato': risk *= 1.6; break;
      case 'corn': risk *= 0.7; break;
      case 'wheat': risk *= 1.0; break;
      case 'soybean': risk *= 0.85; break;
    }
    
    // Seasonal effects
    switch (this.weather.season) {
      case 'spring': risk *= 1.2; break;
      case 'summer': risk *= 0.9; break;
      case 'autumn': risk *= 1.1; break;
      case 'winter': risk *= 1.4; break;
    }
    
    return risk;
  }

  private spreadDiseaseToNearbyPlants(diseased: Plant, deltaTime: number): void {
    const spreadRadius = 5; // meters
    const nearbyPlants = this.getPlantsInRadius(diseased.position, spreadRadius);
    
    nearbyPlants.forEach(plant => {
      if (plant.id !== diseased.id && plant.diseaseLevel < 20) {
        const distance = Math.sqrt(
          Math.pow(plant.position[0] - diseased.position[0], 2) +
          Math.pow(plant.position[2] - diseased.position[2], 2)
        );
        
        const spreadChance = (1 - distance / spreadRadius) * 0.01 * deltaTime;
        if (Math.random() < spreadChance) {
          plant.diseaseLevel += Math.random() * 5;
        }
      }
    });
  }

  private updatePlantHealth(): void {
    this.plants.forEach(plant => {
      const oldHealth = plant.health;
      const healthScore = this.calculateHealthScore(plant);
      
      if (healthScore > 75) {
        plant.health = 'healthy';
      } else if (healthScore < 35) {
        plant.health = 'sick';
      } else {
        plant.health = 'unknown';
      }
      
      // Update confidence based on how clear the health indicators are
      plant.confidence = Math.min(100, Math.abs(healthScore - 50) * 2);
      
      // Log significant health changes
      if (oldHealth !== plant.health && Math.random() < 0.01) {
        console.log(`🌱 Plant ${plant.id} (${plant.type}) health: ${oldHealth} → ${plant.health}`);
      }
    });
  }

  private calculateHealthScore(plant: Plant): number {
    let score = 50; // Base score
    
    // Water level affects health (optimal range: 60-85%)
    if (plant.waterLevel >= 60 && plant.waterLevel <= 85) {
      score += 25;
    } else if (plant.waterLevel < 30 || plant.waterLevel > 95) {
      score -= 30;
    } else {
      score -= Math.abs(plant.waterLevel - 72.5) * 0.4;
    }
    
    // Nutrient level affects health (optimal range: 65-90%)
    if (plant.nutrientLevel >= 65 && plant.nutrientLevel <= 90) {
      score += 25;
    } else if (plant.nutrientLevel < 35 || plant.nutrientLevel > 95) {
      score -= 30;
    } else {
      score -= Math.abs(plant.nutrientLevel - 77.5) * 0.4;
    }
    
    // Disease level affects health
    score -= plant.diseaseLevel * 0.6;
    
    // Age affects health (optimal range: 20-80 days)
    if (plant.age >= 20 && plant.age <= 80) {
      score += 10;
    } else if (plant.age < 10 || plant.age > 100) {
      score -= 15;
    }
    
    // Weather affects health
    if (this.weather.temperature >= 15 && this.weather.temperature <= 30) {
      score += 10;
    } else {
      score -= Math.abs(this.weather.temperature - 22.5) * 0.8;
    }
    
    if (this.weather.sunlight >= 60) {
      score += 10;
    } else {
      score -= (60 - this.weather.sunlight) * 0.2;
    }
    
    // Seasonal effects
    switch (this.weather.season) {
      case 'spring': score += 5; break;
      case 'summer': score += 0; break;
      case 'autumn': score -= 5; break;
      case 'winter': score -= 15; break;
    }
    
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

  getPlantsInRadius(position: [number, number, number], radius: number): Plant[] {
    return this.plants.filter(plant => {
      const dx = plant.position[0] - position[0];
      const dz = plant.position[2] - position[2];
      const distance = Math.sqrt(dx * dx + dz * dz);
      return distance <= radius;
    });
  }

  getVisiblePlants(dronePosition: [number, number, number], droneRotation: [number, number, number], maxDistance: number = 25): Plant[] {
    return this.plants.filter(plant => {
      const dx = plant.position[0] - dronePosition[0];
      const dy = plant.position[1] - dronePosition[1];
      const dz = plant.position[2] - dronePosition[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (distance > maxDistance) return false;
      
      // Simple line of sight check
      const heightDifference = Math.abs(dy);
      return heightDifference < 5 || distance < 8;
    });
  }

  applyEnvironmentalEffect(position: [number, number, number], effectType: 'water' | 'fertilizer' | 'pesticide', intensity: number): void {
    const affectedPlants = this.getPlantsInRadius(position, 6);
    
    affectedPlants.forEach(plant => {
      const distance = Math.sqrt(
        Math.pow(plant.position[0] - position[0], 2) +
        Math.pow(plant.position[2] - position[2], 2)
      );
      
      // Effect diminishes with distance
      const effectStrength = intensity * (1 - distance / 6);
      
      switch (effectType) {
        case 'water':
          plant.waterLevel = Math.min(100, plant.waterLevel + effectStrength * 15);
          break;
        case 'fertilizer':
          plant.nutrientLevel = Math.min(100, plant.nutrientLevel + effectStrength * 20);
          break;
        case 'pesticide':
          plant.diseaseLevel = Math.max(0, plant.diseaseLevel - effectStrength * 25);
          break;
      }
    });
    
    console.log(`🌱 Applied ${effectType} (${intensity.toFixed(2)}) to ${affectedPlants.length} plants`);
  }

  updateConfig(newConfig: Partial<EnvironmentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Environment config updated:', this.config);
  }

  reset(): void {
    console.log('🔄 Resetting environment...');
    
    // Remove plant physics bodies
    for (const [plantId, body] of this.plantBodies) {
      this.physicsWorld!.removeRigidBody(plantId);
    }
    this.plantBodies.clear();
    
    // Regenerate plants
    this.generatePlants();
    
    // Reset weather
    this.weather = {
      temperature: 22,
      humidity: 65,
      windSpeed: 3,
      windDirection: 0,
      precipitation: 0,
      sunlight: 85,
      timeOfDay: 12,
      season: 'summer',
    };
  }
}