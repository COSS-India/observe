import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Email service for sending notifications"""
    
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
        self.from_name = settings.FROM_NAME
        self.tls = settings.SMTP_TLS
        self.ssl = settings.SMTP_SSL
    
    def send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """Send email to recipient"""
        
        if not self.smtp_username or not self.smtp_password:
            logger.warning("SMTP credentials not configured. Email not sent.")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            # Add text content
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            # Add HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Create SMTP session
            if self.ssl:
                server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            else:
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                if self.tls:
                    server.starttls()
            
            # Login and send email
            server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_welcome_email(self, to_email: str, first_name: str, temp_password: str, reset_token: str) -> bool:
        """Send welcome email with temporary credentials"""
        
        subject = "Welcome to Adopter Platform - Your Account Credentials"
        
        # Create reset URL using configured frontend URL
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to Adopter Platform</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #1e40af; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f8fafc; }}
                .credentials {{ background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                .button {{ display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }}
                .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Adopter Platform</h1>
                </div>
                <div class="content">
                    <p>Dear {first_name},</p>
                    
                    <p>Welcome to the Adopter Platform! Your account has been successfully created.</p>
                    
                    <div class="credentials">
                        <h3>Your Login Credentials:</h3>
                        <p><strong>Email:</strong> {to_email}</p>
                        <p><strong>Temporary Password:</strong> {temp_password}</p>
                    </div>
                    
                    <p><strong>Important Security Notice:</strong></p>
                    <ul>
                        <li>This is a temporary password that expires in 24 hours</li>
                        <li>You must change your password on first login</li>
                        <li>Keep your credentials secure and don't share them</li>
                    </ul>
                    
                    <p>To get started, please:</p>
                    <ol>
                        <li>Login with your credentials above</li>
                        <li>Change your password immediately</li>
                        <li>Complete your profile setup</li>
                    </ol>
                    
                    <p>If you need to reset your password, you can use the link below:</p>
                    <a href="{reset_url}" class="button">Reset Password</a>
                    
                    <p>If you have any questions or need assistance, please contact our support team.</p>
                    
                    <p>Best regards,<br>
                    The Adopter Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Welcome to Adopter Platform!
        
        Dear {first_name},
        
        Your account has been successfully created.
        
        Login Credentials:
        Email: {to_email}
        Temporary Password: {temp_password}
        
        Important Security Notice:
        - This is a temporary password that expires in 24 hours
        - You must change your password on first login
        - Keep your credentials secure and don't share them
        
        To get started:
        1. Login with your credentials above
        2. Change your password immediately
        3. Complete your profile setup
        
        Reset Password: {reset_url}
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The Adopter Team
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_password_reset_email(self, to_email: str, first_name: str, reset_token: str) -> bool:
        """Send password reset email"""
        
        subject = "Password Reset Request - Adopter Platform"
        
        # Create reset URL using configured frontend URL
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Password Reset Request</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #dc2626; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f8fafc; }}
                .button {{ display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }}
                .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
                .warning {{ background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <p>Dear {first_name},</p>
                    
                    <p>We received a request to reset your password for your Adopter Platform account.</p>
                    
                    <div class="warning">
                        <p><strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.</p>
                    </div>
                    
                    <p>To reset your password, click the button below:</p>
                    <a href="{reset_url}" class="button">Reset Password</a>
                    
                    <p><strong>For testing purposes, your reset token is:</strong></p>
                    <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all;">
                        {reset_token}
                    </div>
                    <p><strong>Reset URL:</strong></p>
                    <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all;">
                        {reset_url}
                    </div>
                    
                    <p><strong>Important:</strong></p>
                    <ul>
                        <li>This link expires in 1 hour</li>
                        <li>You can only use this link once</li>
                        <li>If the link doesn't work, request a new password reset</li>
                    </ul>
                    
                    <p>If you have any questions or need assistance, please contact our support team.</p>
                    
                    <p>Best regards,<br>
                    The Adopter Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Password Reset Request - Adopter Platform
        
        Dear {first_name},
        
        We received a request to reset your password for your Adopter Platform account.
        
        Security Notice: If you didn't request this password reset, please ignore this email. Your account remains secure.
        
        To reset your password, visit: {reset_url}
        
        For testing purposes, your reset token is: {reset_token}
        
        Important:
        - This link expires in 1 hour
        - You can only use this link once
        - If the link doesn't work, request a new password reset
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The Adopter Team
        """
        
        return self.send_email(to_email, subject, html_content, text_content)


# Global email service instance
email_service = EmailService()
