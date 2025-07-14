"""
Weather API endpoints for AgMo farming application.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import logging

from agmo.services.weather_service import get_weather_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/current")
async def get_current_weather(location: str = Query(..., description="City name, coordinates, or IP address")):
    """
    Get current weather for a location.
    
    Args:
        location: City name, coordinates, or IP address
        
    Returns:
        Current weather data with agricultural insights
    """
    try:
        weather_service = get_weather_service()
        weather_data = await weather_service.get_current_weather(location)
        
        logger.info(f"🌤️ Retrieved current weather for {location}")
        return weather_data
        
    except Exception as e:
        logger.error(f"❌ Failed to get current weather: {e}")
        raise HTTPException(status_code=500, detail=f"Weather service error: {str(e)}")


@router.get("/forecast")
async def get_weather_forecast(
    location: str = Query(..., description="City name, coordinates, or IP address"),
    days: int = Query(7, ge=1, le=14, description="Number of forecast days (1-14)")
):
    """
    Get weather forecast for a location.
    
    Args:
        location: City name, coordinates, or IP address
        days: Number of forecast days (1-14)
        
    Returns:
        Weather forecast data with agricultural insights
    """
    try:
        weather_service = get_weather_service()
        forecast_data = await weather_service.get_forecast(location, days)
        
        logger.info(f"🌤️ Retrieved {days}-day forecast for {location}")
        return forecast_data
        
    except Exception as e:
        logger.error(f"❌ Failed to get weather forecast: {e}")
        raise HTTPException(status_code=500, detail=f"Weather service error: {str(e)}")


@router.get("/historical")
async def get_historical_weather(
    location: str = Query(..., description="City name, coordinates, or IP address"),
    date: str = Query(..., description="Date in YYYY-MM-DD format")
):
    """
    Get historical weather data.
    
    Args:
        location: City name, coordinates, or IP address
        date: Date in YYYY-MM-DD format
        
    Returns:
        Historical weather data
    """
    try:
        weather_service = get_weather_service()
        historical_data = await weather_service.get_historical_weather(location, date)
        
        logger.info(f"🌤️ Retrieved historical weather for {location} on {date}")
        return historical_data
        
    except Exception as e:
        logger.error(f"❌ Failed to get historical weather: {e}")
        raise HTTPException(status_code=500, detail=f"Weather service error: {str(e)}")


@router.get("/agricultural-insights")
async def get_agricultural_insights(
    location: str = Query(..., description="City name, coordinates, or IP address")
):
    """
    Get agricultural insights based on current weather.
    
    Args:
        location: City name, coordinates, or IP address
        
    Returns:
        Agricultural recommendations and insights
    """
    try:
        weather_service = get_weather_service()
        weather_data = await weather_service.get_current_weather(location)
        
        insights = weather_data.get("agricultural_insights", {})
        
        # Add additional agricultural recommendations
        recommendations = {
            "irrigation": "Consider irrigation" if insights.get("irrigation_needed") else "No irrigation needed",
            "frost_protection": "Protect crops from frost" if insights.get("frost_risk") else "No frost risk",
            "heat_management": "Implement heat stress management" if insights.get("heat_stress") else "Normal temperatures",
            "wind_protection": "Secure crops from wind damage" if insights.get("wind_damage_risk") else "Normal wind conditions",
            "disease_monitoring": "Monitor for disease development" if insights.get("disease_risk") else "Low disease risk",
            "harvest_timing": "Good conditions for harvesting" if insights.get("harvest_conditions") else "Consider delaying harvest",
            "planting_conditions": "Good conditions for planting" if insights.get("planting_recommendation") else "Consider delaying planting"
        }
        
        logger.info(f"🌾 Generated agricultural insights for {location}")
        return {
            "location": weather_data.get("location", {}),
            "current_weather": weather_data.get("current", {}),
            "insights": insights,
            "recommendations": recommendations
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get agricultural insights: {e}")
        raise HTTPException(status_code=500, detail=f"Weather service error: {str(e)}") 