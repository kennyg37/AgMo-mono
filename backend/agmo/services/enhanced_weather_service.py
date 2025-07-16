"""
Enhanced Weather Service for AgMo Farming Application

This service integrates with Google Maps API for location detection
and OpenWeatherMap API for weather data with intelligent caching
to minimize API calls and costs.
"""

import aiohttp
import asyncio
import json
import hashlib
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass
from functools import lru_cache

logger = logging.getLogger(__name__)

@dataclass
class Location:
    """Location data structure."""
    lat: float
    lon: float
    name: str
    country: str
    region: str = ""

@dataclass
class WeatherData:
    """Weather data structure."""
    temperature: float
    humidity: int
    wind_speed: float
    pressure: float
    precipitation: float
    cloud_cover: int
    condition: str
    icon: str
    timestamp: datetime

class EnhancedWeatherService:
    """Enhanced weather service with Google Maps and OpenWeatherMap integration."""
    
    def __init__(self, google_api_key: str, openweather_api_key: str):
        self.google_api_key = google_api_key
        self.openweather_api_key = openweather_api_key
        self.google_base_url = "https://maps.googleapis.com/maps/api"
        self.openweather_base_url = "https://api.openweathermap.org/data/2.5"
        
        # In-memory cache for API responses (in production, use Redis)
        self._location_cache = {}
        self._weather_cache = {}
        self._cache_duration = timedelta(minutes=30)  # Cache for 30 minutes
        
    async def get_location_from_address(self, address: str) -> Optional[Location]:
        """
        Get location coordinates from address using Google Maps Geocoding API.
        
        Args:
            address: Address string
            
        Returns:
            Location object with coordinates and metadata
        """
        cache_key = f"location:{hashlib.md5(address.encode()).hexdigest()}"
        
        # Check cache first
        if cache_key in self._location_cache:
            cached_data = self._location_cache[cache_key]
            if datetime.now() - cached_data['timestamp'] < self._cache_duration:
                logger.info(f"📍 Using cached location for {address}")
                return cached_data['data']
        
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.google_base_url}/geocode/json"
                params = {
                    "address": address,
                    "key": self.google_api_key
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data.get("status") == "OK" and data.get("results"):
                            result = data["results"][0]
                            geometry = result.get("geometry", {})
                            location = geometry.get("location", {})
                            
                            # Extract address components
                            address_components = result.get("address_components", [])
                            country = ""
                            region = ""
                            
                            for component in address_components:
                                types = component.get("types", [])
                                if "country" in types:
                                    country = component.get("long_name", "")
                                elif "administrative_area_level_1" in types:
                                    region = component.get("long_name", "")
                            
                            location_obj = Location(
                                lat=location.get("lat", 0),
                                lon=location.get("lng", 0),
                                name=result.get("formatted_address", address),
                                country=country,
                                region=region
                            )
                            
                            # Cache the result
                            self._location_cache[cache_key] = {
                                'data': location_obj,
                                'timestamp': datetime.now()
                            }
                            
                            logger.info(f"📍 Retrieved location for {address}: {location_obj.lat}, {location_obj.lon}")
                            return location_obj
                        else:
                            logger.error(f"❌ Geocoding failed for {address}: {data.get('status')}")
                            return None
                    else:
                        logger.error(f"❌ Google Maps API error: {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"❌ Failed to get location from address: {e}")
            return None
    
    async def get_location_from_coordinates(self, lat: float, lon: float) -> Optional[Location]:
        """
        Get location name from coordinates using Google Maps Reverse Geocoding API.
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            Location object with name and metadata
        """
        cache_key = f"reverse_location:{lat:.4f},{lon:.4f}"
        
        # Check cache first
        if cache_key in self._location_cache:
            cached_data = self._location_cache[cache_key]
            if datetime.now() - cached_data['timestamp'] < self._cache_duration:
                logger.info(f"📍 Using cached reverse location for {lat}, {lon}")
                return cached_data['data']
        
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.google_base_url}/geocode/json"
                params = {
                    "latlng": f"{lat},{lon}",
                    "key": self.google_api_key
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data.get("status") == "OK" and data.get("results"):
                            result = data["results"][0]
                            
                            # Extract address components
                            address_components = result.get("address_components", [])
                            country = ""
                            region = ""
                            
                            for component in address_components:
                                types = component.get("types", [])
                                if "country" in types:
                                    country = component.get("long_name", "")
                                elif "administrative_area_level_1" in types:
                                    region = component.get("long_name", "")
                            
                            location_obj = Location(
                                lat=lat,
                                lon=lon,
                                name=result.get("formatted_address", f"{lat}, {lon}"),
                                country=country,
                                region=region
                            )
                            
                            # Cache the result
                            self._location_cache[cache_key] = {
                                'data': location_obj,
                                'timestamp': datetime.now()
                            }
                            
                            logger.info(f"📍 Retrieved reverse location for {lat}, {lon}")
                            return location_obj
                        else:
                            logger.error(f"❌ Reverse geocoding failed for {lat}, {lon}: {data.get('status')}")
                            return None
                    else:
                        logger.error(f"❌ Google Maps API error: {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"❌ Failed to get reverse location: {e}")
            return None
    
    async def get_current_weather(self, location_input: str) -> Dict[str, Any]:
        """
        Get current weather for a location using OpenWeatherMap API.
        
        Args:
            location_input: Address string or coordinates
            
        Returns:
            Current weather data with agricultural insights
        """
        # First, get location coordinates
        location = await self._resolve_location(location_input)
        if not location:
            return self._get_fallback_weather()
        
        cache_key = f"weather:{location.lat:.4f},{location.lon:.4f}"
        
        # Check cache first
        if cache_key in self._weather_cache:
            cached_data = self._weather_cache[cache_key]
            if datetime.now() - cached_data['timestamp'] < self._cache_duration:
                logger.info(f"🌤️ Using cached weather for {location.name}")
                return cached_data['data']
        
        try:
            async with aiohttp.ClientSession() as session:
                # Use the free Current Weather API endpoint
                url = f"{self.openweather_base_url}/weather"
                params = {
                    "lat": location.lat,
                    "lon": location.lon,
                    "appid": self.openweather_api_key,
                    "units": "metric"
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        weather_data = self._format_current_weather(data, location)
                        
                        # Cache the result
                        self._weather_cache[cache_key] = {
                            'data': weather_data,
                            'timestamp': datetime.now()
                        }
                        
                        logger.info(f"🌤️ Retrieved current weather for {location.name}")
                        return weather_data
                    else:
                        logger.error(f"❌ OpenWeatherMap API error: {response.status}")
                        return self._get_fallback_weather()
                        
        except Exception as e:
            logger.error(f"❌ Failed to get current weather: {e}")
            return self._get_fallback_weather()
    
    async def get_weather_forecast(self, location_input: str, days: int = 5) -> Dict[str, Any]:
        """
        Get weather forecast for a location using OpenWeatherMap API.
        
        Args:
            location_input: Address string or coordinates
            days: Number of forecast days (1-5 for free tier)
            
        Returns:
            Weather forecast data with agricultural insights
        """
        # Limit to 5 days for free tier
        days = min(days, 5)
        
        # First, get location coordinates
        location = await self._resolve_location(location_input)
        if not location:
            return self._get_fallback_forecast(days)
        
        cache_key = f"forecast:{location.lat:.4f},{location.lon:.4f}:{days}"
        
        # Check cache first
        if cache_key in self._weather_cache:
            cached_data = self._weather_cache[cache_key]
            if datetime.now() - cached_data['timestamp'] < self._cache_duration:
                logger.info(f"🌤️ Using cached forecast for {location.name}")
                return cached_data['data']
        
        try:
            async with aiohttp.ClientSession() as session:
                # Use the free 5-day forecast API endpoint
                url = f"{self.openweather_base_url}/forecast"
                params = {
                    "lat": location.lat,
                    "lon": location.lon,
                    "appid": self.openweather_api_key,
                    "units": "metric",
                    "cnt": min(days * 8, 40)  # 8 forecasts per day, max 40 for free tier
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        forecast_data = self._format_forecast(data, location, days)
                        
                        # Cache the result
                        self._weather_cache[cache_key] = {
                            'data': forecast_data,
                            'timestamp': datetime.now()
                        }
                        
                        logger.info(f"🌤️ Retrieved {days}-day forecast for {location.name}")
                        return forecast_data
                    else:
                        logger.error(f"❌ OpenWeatherMap API error: {response.status}")
                        return self._get_fallback_forecast(days)
                        
        except Exception as e:
            logger.error(f"❌ Failed to get weather forecast: {e}")
            return self._get_fallback_forecast(days)
    
    async def _resolve_location(self, location_input: str) -> Optional[Location]:
        """Resolve location input to coordinates and metadata."""
        try:
            # Check if input is coordinates
            if ',' in location_input:
                parts = location_input.split(',')
                if len(parts) == 2:
                    try:
                        lat = float(parts[0].strip())
                        lon = float(parts[1].strip())
                        return await self.get_location_from_coordinates(lat, lon)
                    except ValueError:
                        pass
            
            # Treat as address
            return await self.get_location_from_address(location_input)
            
        except Exception as e:
            logger.error(f"❌ Failed to resolve location: {e}")
            return None
    
    def _format_current_weather(self, data: Dict[str, Any], location: Location) -> Dict[str, Any]:
        """Format current weather data from OpenWeatherMap API."""
        weather = data.get("weather", [{}])[0]
        main = data.get("main", {})
        wind = data.get("wind", {})
        rain = data.get("rain", {})
        
        return {
            "location": {
                "name": location.name,
                "region": location.region,
                "country": location.country,
                "lat": location.lat,
                "lon": location.lon
            },
            "current": {
                "temperature_c": main.get("temp", 0),
                "temperature_f": (main.get("temp", 0) * 9/5) + 32,
                "humidity": main.get("humidity", 0),
                "wind_kph": wind.get("speed", 0) * 3.6,  # Convert m/s to km/h
                "wind_mph": wind.get("speed", 0) * 2.237,  # Convert m/s to mph
                "pressure_mb": main.get("pressure", 0),
                "precip_mm": rain.get("1h", 0),
                "cloud": data.get("clouds", {}).get("all", 0),
                "feels_like_c": main.get("feels_like", 0),
                "feels_like_f": (main.get("feels_like", 0) * 9/5) + 32,
                "uv": data.get("uvi", 0),
                "condition": {
                    "text": weather.get("main", "Unknown"),
                    "description": weather.get("description", "Unknown"),
                    "icon": weather.get("icon", "")
                },
                "last_updated": datetime.fromtimestamp(data.get("dt", 0)).isoformat()
            },
            "agricultural_insights": self._get_agricultural_insights(main)
        }
    
    def _format_forecast(self, data: Dict[str, Any], location: Location, days: int) -> Dict[str, Any]:
        """Format forecast data from OpenWeatherMap API."""
        forecast_list = data.get("list", [])
        
        # Group forecasts by day
        daily_forecasts = {}
        for forecast in forecast_list:
            date = datetime.fromtimestamp(forecast.get("dt", 0)).strftime("%Y-%m-%d")
            if date not in daily_forecasts:
                daily_forecasts[date] = []
            daily_forecasts[date].append(forecast)
        
        formatted_days = []
        for i, (date, forecasts) in enumerate(daily_forecasts.items()):
            if i >= days:
                break
                
            # Calculate daily averages
            temps = [f.get("main", {}).get("temp", 0) for f in forecasts]
            humidities = [f.get("main", {}).get("humidity", 0) for f in forecasts]
            wind_speeds = [f.get("wind", {}).get("speed", 0) for f in forecasts]
            precipitations = [f.get("rain", {}).get("3h", 0) for f in forecasts]
            
            # Get the most common weather condition
            weather_conditions = [f.get("weather", [{}])[0] for f in forecasts]
            # Count occurrences of each weather condition
            weather_counts = {}
            for weather in weather_conditions:
                weather_key = weather.get("main", "Unknown")
                weather_counts[weather_key] = weather_counts.get(weather_key, 0) + 1
            
            # Find the most common weather condition
            most_common_weather_key = max(weather_counts, key=weather_counts.get) if weather_counts else "Unknown"
            most_common_weather = next((w for w in weather_conditions if w.get("main") == most_common_weather_key), weather_conditions[0] if weather_conditions else {})
            
            formatted_days.append({
                "date": date,
                "max_temp_c": max(temps) if temps else 0,
                "min_temp_c": min(temps) if temps else 0,
                "avg_temp_c": sum(temps) / len(temps) if temps else 0,
                "max_temp_f": (max(temps) * 9/5) + 32 if temps else 0,
                "min_temp_f": (min(temps) * 9/5) + 32 if temps else 0,
                "avg_temp_f": ((sum(temps) / len(temps)) * 9/5) + 32 if temps else 0,
                "max_wind_kph": max(wind_speeds) * 3.6 if wind_speeds else 0,
                "total_precip_mm": sum(precipitations) if precipitations else 0,
                "avg_humidity": sum(humidities) / len(humidities) if humidities else 0,
                "condition": {
                    "text": most_common_weather.get("main", "Unknown"),
                    "description": most_common_weather.get("description", "Unknown"),
                    "icon": most_common_weather.get("icon", "")
                },
                "agricultural_insights": self._get_agricultural_insights({
                    "temp": sum(temps) / len(temps) if temps else 0,
                    "humidity": sum(humidities) / len(humidities) if humidities else 0,
                    "rain": sum(precipitations) if precipitations else 0,
                    "wind_speed": max(wind_speeds) if wind_speeds else 0
                })
            })
        
        return {
            "location": {
                "name": location.name,
                "region": location.region,
                "country": location.country
            },
            "forecast": formatted_days
        }
    
    def _get_agricultural_insights(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate agricultural insights from weather data."""
        temp = weather_data.get("temp", weather_data.get("day", 0))
        if isinstance(temp, dict):
            temp_c = temp.get("day", 0)
        else:
            temp_c = temp
        humidity = weather_data.get("humidity", 0)
        precip_mm = weather_data.get("rain", 0)
        wind_speed = weather_data.get("wind_speed", 0)

        # Agricultural recommendations
        insights = {
            "irrigation_needed": humidity < 40 and precip_mm < 5,
            "frost_risk": temp_c < 2,
            "heat_stress": temp_c > 35,
            "optimal_growing": 15 <= temp_c <= 30 and 40 <= humidity <= 80,
            "wind_damage_risk": wind_speed > 8.33,  # > 30 km/h
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
            date = datetime.now() + timedelta(days=i)
            forecast_days.append({
                "date": date.strftime("%Y-%m-%d"),
                "max_temp_c": 25,
                "min_temp_c": 15,
                "avg_temp_c": 20,
                "max_temp_f": 77,
                "min_temp_f": 59,
                "avg_temp_f": 68,
                "max_wind_kph": 15,
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
    
    def clear_cache(self):
        """Clear all cached data."""
        self._location_cache.clear()
        self._weather_cache.clear()
        logger.info("🗑️ Weather service cache cleared")


def get_enhanced_weather_service() -> EnhancedWeatherService:
    """Get enhanced weather service instance."""
    from agmo.core.config import settings
    
    # Use the correct API key names
    google_api_key = settings.GOOGLE_MAPS_API_KEY or settings.GOOGLE_API_KEY
    openweather_api_key = settings.OPENWEATHER_API_KEY or settings.OPEN_WEATHER_KEY
    
    if not google_api_key:
        raise ValueError("Google Maps API key not found. Please set GOOGLE_MAPS_API_KEY or GOOGLE_API_KEY in your .env file")
    
    if not openweather_api_key:
        raise ValueError("OpenWeather API key not found. Please set OPENWEATHER_API_KEY or OPEN_WEATHER_KEY in your .env file")
    
    return EnhancedWeatherService(
        google_api_key=google_api_key,
        openweather_api_key=openweather_api_key
    ) 