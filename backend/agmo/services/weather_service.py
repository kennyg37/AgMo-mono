"""
Weather Service for AgMo Farming Application

This service integrates with WeatherAPI.com to provide weather data
for agricultural decision making.
"""

import aiohttp
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class WeatherService:
    """Weather service for agricultural weather data."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "http://api.weatherapi.com/v1"
        
    async def get_current_weather(self, location: str) -> Dict[str, Any]:
        """
        Get current weather for a location.
        
        Args:
            location: City name, coordinates, or IP address
            
        Returns:
            Current weather data
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/current.json"
                params = {
                    "key": self.api_key,
                    "q": location,
                    "aqi": "no"  # Air quality data
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._format_current_weather(data)
                    else:
                        logger.error(f"Weather API error: {response.status}")
                        return self._get_fallback_weather()
                        
        except Exception as e:
            logger.error(f"Failed to get current weather: {e}")
            return self._get_fallback_weather()
    
    async def get_forecast(self, location: str, days: int = 7) -> Dict[str, Any]:
        """
        Get weather forecast for a location.
        
        Args:
            location: City name, coordinates, or IP address
            days: Number of days (1-14)
            
        Returns:
            Forecast weather data
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/forecast.json"
                params = {
                    "key": self.api_key,
                    "q": location,
                    "days": min(days, 14),
                    "aqi": "no"
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._format_forecast(data)
                    else:
                        logger.error(f"Weather API error: {response.status}")
                        return self._get_fallback_forecast(days)
                        
        except Exception as e:
            logger.error(f"Failed to get forecast: {e}")
            return self._get_fallback_forecast(days)
    
    async def get_historical_weather(self, location: str, date: str) -> Dict[str, Any]:
        """
        Get historical weather data.
        
        Args:
            location: City name, coordinates, or IP address
            date: Date in YYYY-MM-DD format
            
        Returns:
            Historical weather data
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/history.json"
                params = {
                    "key": self.api_key,
                    "q": location,
                    "dt": date
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._format_historical_weather(data)
                    else:
                        logger.error(f"Weather API error: {response.status}")
                        return self._get_fallback_historical(date)
                        
        except Exception as e:
            logger.error(f"Failed to get historical weather: {e}")
            return self._get_fallback_historical(date)
    
    def _format_current_weather(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Format current weather data for agricultural use."""
        current = data.get("current", {})
        location = data.get("location", {})
        
        return {
            "location": {
                "name": location.get("name", "Unknown"),
                "region": location.get("region", ""),
                "country": location.get("country", ""),
                "lat": location.get("lat", 0),
                "lon": location.get("lon", 0)
            },
            "current": {
                "temperature_c": current.get("temp_c", 0),
                "temperature_f": current.get("temp_f", 0),
                "humidity": current.get("humidity", 0),
                "wind_kph": current.get("wind_kph", 0),
                "wind_mph": current.get("wind_mph", 0),
                "pressure_mb": current.get("pressure_mb", 0),
                "precip_mm": current.get("precip_mm", 0),
                "cloud": current.get("cloud", 0),
                "feels_like_c": current.get("feelslike_c", 0),
                "feels_like_f": current.get("feelslike_f", 0),
                "uv": current.get("uv", 0),
                "condition": {
                    "text": current.get("condition", {}).get("text", "Unknown"),
                    "icon": current.get("condition", {}).get("icon", ""),
                    "code": current.get("condition", {}).get("code", 0)
                },
                "last_updated": current.get("last_updated", "")
            },
            "agricultural_insights": self._get_agricultural_insights(current)
        }
    
    def _format_forecast(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Format forecast data for agricultural use."""
        location = data.get("location", {})
        forecast = data.get("forecast", {})
        forecast_days = forecast.get("forecastday", [])
        
        formatted_days = []
        for day in forecast_days:
            formatted_days.append({
                "date": day.get("date", ""),
                "max_temp_c": day.get("day", {}).get("maxtemp_c", 0),
                "min_temp_c": day.get("day", {}).get("mintemp_c", 0),
                "avg_temp_c": day.get("day", {}).get("avgtemp_c", 0),
                "max_temp_f": day.get("day", {}).get("maxtemp_f", 0),
                "min_temp_f": day.get("day", {}).get("mintemp_f", 0),
                "avg_temp_f": day.get("day", {}).get("avgtemp_f", 0),
                "max_wind_kph": day.get("day", {}).get("maxwind_kph", 0),
                "total_precip_mm": day.get("day", {}).get("totalprecip_mm", 0),
                "avg_humidity": day.get("day", {}).get("avghumidity", 0),
                "condition": {
                    "text": day.get("day", {}).get("condition", {}).get("text", "Unknown"),
                    "icon": day.get("day", {}).get("condition", {}).get("icon", "")
                },
                "agricultural_insights": self._get_agricultural_insights(day.get("day", {}))
            })
        
        return {
            "location": {
                "name": location.get("name", "Unknown"),
                "region": location.get("region", ""),
                "country": location.get("country", "")
            },
            "forecast": formatted_days
        }
    
    def _format_historical_weather(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Format historical weather data."""
        location = data.get("location", {})
        forecast = data.get("forecast", {})
        forecast_days = forecast.get("forecastday", [])
        
        if forecast_days:
            day = forecast_days[0]
            return {
                "date": day.get("date", ""),
                "max_temp_c": day.get("day", {}).get("maxtemp_c", 0),
                "min_temp_c": day.get("day", {}).get("mintemp_c", 0),
                "avg_temp_c": day.get("day", {}).get("avgtemp_c", 0),
                "total_precip_mm": day.get("day", {}).get("totalprecip_mm", 0),
                "avg_humidity": day.get("day", {}).get("avghumidity", 0),
                "condition": {
                    "text": day.get("day", {}).get("condition", {}).get("text", "Unknown"),
                    "icon": day.get("day", {}).get("condition", {}).get("icon", "")
                }
            }
        return {}
    
    def _get_agricultural_insights(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate agricultural insights from weather data."""
        temp_c = weather_data.get("temp_c", 0)
        humidity = weather_data.get("humidity", 0)
        precip_mm = weather_data.get("precip_mm", 0)
        wind_kph = weather_data.get("wind_kph", 0)
        
        # Agricultural recommendations
        insights = {
            "irrigation_needed": humidity < 40 and precip_mm < 5,
            "frost_risk": temp_c < 2,
            "heat_stress": temp_c > 35,
            "optimal_growing": 15 <= temp_c <= 30 and 40 <= humidity <= 80,
            "wind_damage_risk": wind_kph > 30,
            "disease_risk": humidity > 85 and temp_c > 20,
            "harvest_conditions": 10 <= temp_c <= 25 and humidity < 70,
            "planting_recommendation": 10 <= temp_c <= 25 and precip_mm > 0
        }
        
        return insights
    
    def _get_fallback_weather(self) -> Dict[str, Any]:
        """Fallback weather data when API fails."""
        return {
            "location": {"name": "Unknown", "region": "", "country": ""},
            "current": {
                "temperature_c": 20,
                "humidity": 60,
                "wind_kph": 10,
                "precip_mm": 0,
                "condition": {"text": "Unknown", "icon": ""},
                "last_updated": datetime.now().isoformat()
            },
            "agricultural_insights": {
                "irrigation_needed": False,
                "frost_risk": False,
                "heat_stress": False,
                "optimal_growing": True,
                "wind_damage_risk": False,
                "disease_risk": False,
                "harvest_conditions": True,
                "planting_recommendation": True
            }
        }
    
    def _get_fallback_forecast(self, days: int) -> Dict[str, Any]:
        """Fallback forecast data when API fails."""
        forecast_days = []
        for i in range(days):
            forecast_days.append({
                "date": (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d"),
                "max_temp_c": 25,
                "min_temp_c": 15,
                "avg_temp_c": 20,
                "total_precip_mm": 0,
                "avg_humidity": 60,
                "condition": {"text": "Unknown", "icon": ""},
                "agricultural_insights": {
                    "irrigation_needed": False,
                    "frost_risk": False,
                    "heat_stress": False,
                    "optimal_growing": True,
                    "wind_damage_risk": False,
                    "disease_risk": False,
                    "harvest_conditions": True,
                    "planting_recommendation": True
                }
            })
        
        return {
            "location": {"name": "Unknown", "region": "", "country": ""},
            "forecast": forecast_days
        }
    
    def _get_fallback_historical(self, date: str) -> Dict[str, Any]:
        """Fallback historical data when API fails."""
        return {
            "date": date,
            "max_temp_c": 25,
            "min_temp_c": 15,
            "avg_temp_c": 20,
            "total_precip_mm": 0,
            "avg_humidity": 60,
            "condition": {"text": "Unknown", "icon": ""}
        }


# Global weather service instance
weather_service: Optional[WeatherService] = None

def get_weather_service() -> WeatherService:
    """Get the global weather service instance."""
    global weather_service
    if weather_service is None:
        # Get API key from environment or config
        api_key = "YOUR_WEATHERAPI_KEY"  # Replace with actual API key
        weather_service = WeatherService(api_key)
    return weather_service 