"""
Fallback Weather Service for AgMo Farming Application

This service provides mock weather data when the real weather APIs are not available.
Useful for development and testing without requiring API keys.
"""

import asyncio
import random
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class FallbackWeatherService:
    """Fallback weather service that provides realistic mock data."""
    
    def __init__(self):
        self.locations = {
            "kigali": {"lat": -1.9891631, "lon": 30.1032884, "name": "Kigali, Rwanda"},
            "nairobi": {"lat": -1.2921, "lon": 36.8219, "name": "Nairobi, Kenya"},
            "kampala": {"lat": 0.3476, "lon": 32.5825, "name": "Kampala, Uganda"},
            "dar es salaam": {"lat": -6.8235, "lon": 39.2695, "name": "Dar es Salaam, Tanzania"},
            "addis ababa": {"lat": 9.0320, "lon": 38.7486, "name": "Addis Ababa, Ethiopia"}
        }
    
    async def get_current_weather(self, location_input: str) -> Dict[str, Any]:
        """Get mock current weather data."""
        location = self._resolve_location(location_input)
        
        # Generate realistic weather data based on location and time
        temp_c = self._get_realistic_temperature(location["name"])
        humidity = random.randint(40, 85)
        wind_speed = random.uniform(5, 25)
        pressure = random.randint(1000, 1020)
        precip_mm = random.uniform(0, 5)
        cloud_cover = random.randint(0, 100)
        
        # Determine weather condition based on temperature and humidity
        condition = self._get_weather_condition(temp_c, humidity, precip_mm)
        
        return {
            "location": {
                "name": location["name"],
                "region": "East Africa",
                "country": "Rwanda",
                "lat": location["lat"],
                "lon": location["lon"]
            },
            "current": {
                "temperature_c": round(temp_c, 1),
                "temperature_f": round((temp_c * 9/5) + 32, 1),
                "humidity": humidity,
                "wind_kph": round(wind_speed * 3.6, 1),
                "wind_mph": round(wind_speed * 2.237, 1),
                "pressure_mb": pressure,
                "precip_mm": round(precip_mm, 1),
                "cloud": cloud_cover,
                "feels_like_c": round(temp_c + random.uniform(-2, 2), 1),
                "feels_like_f": round(((temp_c + random.uniform(-2, 2)) * 9/5) + 32, 1),
                "uv": random.randint(1, 10),
                "condition": {
                    "text": condition,
                    "description": f"{condition.lower()} conditions",
                    "icon": self._get_weather_icon(condition)
                },
                "last_updated": datetime.now().isoformat()
            },
            "agricultural_insights": self._get_agricultural_insights({
                "temp": temp_c,
                "humidity": humidity,
                "rain": precip_mm,
                "wind_speed": wind_speed
            })
        }
    
    async def get_weather_forecast(self, location_input: str, days: int = 7) -> Dict[str, Any]:
        """Get mock weather forecast data."""
        location = self._resolve_location(location_input)
        
        forecast_days = []
        base_temp = self._get_realistic_temperature(location["name"])
        
        for i in range(days):
            date = datetime.now() + timedelta(days=i)
            
            # Vary temperature slightly each day
            temp_variation = random.uniform(-3, 3)
            max_temp = base_temp + temp_variation + random.uniform(2, 5)
            min_temp = base_temp + temp_variation - random.uniform(2, 5)
            avg_temp = (max_temp + min_temp) / 2
            
            humidity = random.randint(40, 85)
            wind_speed = random.uniform(5, 25)
            precip_mm = random.uniform(0, 10)
            
            condition = self._get_weather_condition(avg_temp, humidity, precip_mm)
            
            forecast_days.append({
                "date": date.strftime("%Y-%m-%d"),
                "max_temp_c": round(max_temp, 1),
                "min_temp_c": round(min_temp, 1),
                "avg_temp_c": round(avg_temp, 1),
                "max_temp_f": round((max_temp * 9/5) + 32, 1),
                "min_temp_f": round((min_temp * 9/5) + 32, 1),
                "avg_temp_f": round((avg_temp * 9/5) + 32, 1),
                "max_wind_kph": round(wind_speed * 3.6, 1),
                "total_precip_mm": round(precip_mm, 1),
                "avg_humidity": humidity,
                "condition": {
                    "text": condition,
                    "description": f"{condition.lower()} conditions",
                    "icon": self._get_weather_icon(condition)
                },
                "agricultural_insights": self._get_agricultural_insights({
                    "temp": avg_temp,
                    "humidity": humidity,
                    "rain": precip_mm,
                    "wind_speed": wind_speed
                })
            })
        
        return {
            "location": {
                "name": location["name"],
                "region": "East Africa",
                "country": "Rwanda"
            },
            "forecast": forecast_days
        }
    
    def _resolve_location(self, location_input: str) -> Dict[str, Any]:
        """Resolve location input to coordinates."""
        location_input_lower = location_input.lower()
        
        # Check if it's a known location
        for key, location in self.locations.items():
            if key in location_input_lower:
                return location
        
        # Default to Kigali if location not found
        logger.warning(f"Location '{location_input}' not found, using Kigali as default")
        return self.locations["kigali"]
    
    def _get_realistic_temperature(self, location_name: str) -> float:
        """Get realistic temperature based on location and time."""
        # Base temperatures for different locations
        base_temps = {
            "Kigali": 22,
            "Nairobi": 20,
            "Kampala": 24,
            "Dar es Salaam": 26,
            "Addis Ababa": 18
        }
        
        # Find the closest location
        for loc_name, temp in base_temps.items():
            if loc_name.lower() in location_name.lower():
                base_temp = temp
                break
        else:
            base_temp = 22  # Default to Kigali temperature
        
        # Add some variation
        variation = random.uniform(-3, 3)
        return base_temp + variation
    
    def _get_weather_condition(self, temp_c: float, humidity: float, precip_mm: float) -> str:
        """Determine weather condition based on parameters."""
        if precip_mm > 2:
            return "Rain"
        elif humidity > 80 and temp_c > 20:
            return "Mist"
        elif temp_c < 10:
            return "Cold"
        elif temp_c > 30:
            return "Hot"
        elif humidity < 40:
            return "Clear"
        else:
            return "Partly Cloudy"
    
    def _get_weather_icon(self, condition: str) -> str:
        """Get weather icon based on condition."""
        icons = {
            "Rain": "10d",
            "Mist": "50d",
            "Cold": "13d",
            "Hot": "01d",
            "Clear": "01d",
            "Partly Cloudy": "02d"
        }
        return icons.get(condition, "01d")
    
    def _get_agricultural_insights(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate agricultural insights from weather data."""
        temp_c = weather_data.get("temp", 20)
        humidity = weather_data.get("humidity", 60)
        precip_mm = weather_data.get("rain", 0)
        wind_speed = weather_data.get("wind_speed", 10)

        return {
            "irrigation_needed": humidity < 40 and precip_mm < 5,
            "frost_risk": temp_c < 2,
            "heat_stress": temp_c > 35,
            "optimal_growing": 15 <= temp_c <= 30 and 40 <= humidity <= 80,
            "wind_damage_risk": wind_speed > 8.33,  # > 30 km/h
            "disease_risk": humidity > 85 and temp_c > 20,
            "harvest_conditions": 10 <= temp_c <= 25 and humidity < 70,
            "planting_recommendation": 10 <= temp_c <= 25 and precip_mm > 0
        }
    
    def clear_cache(self):
        """Clear cache (no-op for fallback service)."""
        logger.info("🗑️ Fallback weather service cache cleared (no cache to clear)")


def get_fallback_weather_service() -> FallbackWeatherService:
    """Get fallback weather service instance."""
    return FallbackWeatherService() 