"""
Notification Service for AgMo

This service handles email and SMS notifications for plant health alerts.
"""

import logging
import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Dict, Any
from datetime import datetime

import requests
from twilio.rest import Client
from twilio.base.exceptions import TwilioException

from agmo.core.config import settings

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending email and SMS notifications."""
    
    def __init__(self):
        self.logger = logger
        self._twilio_client = None
        self._setup_twilio()
    
    def _setup_twilio(self):
        """Initialize Twilio client if credentials are available."""
        if (settings.TWILIO_ACCOUNT_SID and 
            settings.TWILIO_AUTH_TOKEN and 
            settings.TWILIO_PHONE_NUMBER):
            try:
                self._twilio_client = Client(
                    settings.TWILIO_ACCOUNT_SID, 
                    settings.TWILIO_AUTH_TOKEN
                )
                self.logger.info("✅ Twilio client initialized")
            except Exception as e:
                self.logger.warning(f"⚠️ Failed to initialize Twilio: {e}")
        else:
            self.logger.info("ℹ️ Twilio credentials not configured - SMS disabled")
    
    def _get_notification_emails(self) -> List[str]:
        """Get list of notification email addresses."""
        if not settings.NOTIFICATION_EMAILS:
            return []
        
        return [email.strip() for email in settings.NOTIFICATION_EMAILS.split(',') if email.strip()]
    
    def _get_notification_phones(self) -> List[str]:
        """Get list of notification phone numbers."""
        if not settings.NOTIFICATION_PHONES:
            return []
        
        return [phone.strip() for phone in settings.NOTIFICATION_PHONES.split(',') if phone.strip()]
    
    async def send_sick_plant_notification(
        self, 
        session_data: Dict[str, Any]
    ) -> None:
        """
        Send notifications for sick plant detection.
        
        This method is called asynchronously to avoid blocking the main API flow.
        """
        try:
            # Only send notifications for sick/diseased plants
            health_status = session_data.get('health_status', '').lower()
            if health_status not in ['diseased', 'sick', 'unhealthy', 'infected']:
                return
            
            # Prepare notification message
            message = self._format_notification_message(session_data)
            
            # Send notifications asynchronously
            await asyncio.gather(
                self._send_email_notifications(message, session_data),
                self._send_sms_notifications(message, session_data),
                return_exceptions=True
            )
            
            self.logger.info(f"📧 Notifications sent for sick plant: {session_data.get('plant_id', 'unknown')}")
            
        except Exception as e:
            self.logger.error(f"❌ Failed to send notifications: {e}")
    
    def _format_notification_message(self, session_data: Dict[str, Any]) -> str:
        """Format the notification message."""
        plant_id = session_data.get('plant_id', 'Unknown')
        label = session_data.get('label', 'Disease')
        health_status = session_data.get('health_status', 'Unknown')
        location = session_data.get('location', {})
        timestamp = session_data.get('detected_at', session_data.get('created_at', ''))
        
        # Format timestamp
        try:
            if timestamp:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                formatted_time = dt.strftime('%Y-%m-%d %H:%M:%S')
            else:
                formatted_time = 'Unknown'
        except:
            formatted_time = 'Unknown'
        
        # Format location
        x = location.get('x', 0)
        z = location.get('z', 0)
        location_str = f"({x:.1f}, {z:.1f})"
        
        message = f"ALERT: SICK PLANT DETECTED\n\n"
        message += f"Disease: {label}\n"
        message += f"Health Status: {health_status}\n"
        message += f"Location: {location_str}\n"
        message += f"Detected: {formatted_time}\n\n"
        message += "IMMEDIATE ACTION REQUIRED!"
        
        return message
    
    async def _send_email_notifications(
        self, 
        message: str, 
        session_data: Dict[str, Any]
    ) -> None:
        """Send email notifications."""
        emails = self._get_notification_emails()
        if not emails:
            self.logger.info("ℹ️ No notification emails configured")
            return
        
        if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD]):
            self.logger.warning("⚠️ SMTP settings not configured - email notifications disabled")
            return
        
        try:
            # Create email
            msg = MIMEMultipart()
            msg['From'] = settings.SMTP_USER
            msg['To'] = ', '.join(emails)
            msg['Subject'] = f"ALERT: Sick Plant Detected - {session_data.get('plant_id', 'Unknown')}"
            
            # Add body
            body = message + "\n\n"
            body += "This is an automated alert from AgMo Farming System.\n"
            body += "Please check your dashboard for more details."
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            self.logger.info(f"📧 Email notification sent to {len(emails)} recipients")
            
        except Exception as e:
            self.logger.error(f"❌ Failed to send email notification: {e}")
    
    async def _send_sms_notifications(
        self, 
        message: str, 
        session_data: Dict[str, Any]
    ) -> None:
        """Send SMS notifications."""
        phones = self._get_notification_phones()
        if not phones:
            self.logger.info("ℹ️ No notification phones configured")
            return
        
        if not self._twilio_client:
            self.logger.warning("⚠️ Twilio not configured - SMS notifications disabled")
            return
        
        try:
            # Send SMS to each phone number
            for phone in phones:
                try:
                    self._twilio_client.messages.create(
                        body=message,
                        from_=settings.TWILIO_PHONE_NUMBER,
                        to=phone
                    )
                    self.logger.info(f"📱 SMS notification sent to {phone}")
                except TwilioException as e:
                    self.logger.error(f"❌ Failed to send SMS to {phone}: {e}")
                except Exception as e:
                    self.logger.error(f"❌ Unexpected error sending SMS to {phone}: {e}")
            
        except Exception as e:
            self.logger.error(f"❌ Failed to send SMS notifications: {e}")


# Global notification service instance
notification_service = NotificationService() 