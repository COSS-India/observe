import random
import string
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.user import Captcha
from app.core.config import settings


def generate_captcha_text(length: int = 6) -> str:
    """Generate random captcha text"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))


def generate_captcha_image(text: str) -> str:
    """Generate captcha image and return as base64 string"""
    # Create image
    width, height = 200, 80
    image = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(image)
    
    # Try to use a font, fallback to default if not available
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
    except:
        font = ImageFont.load_default()
    
    # Draw text
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    # Add some noise to make it harder to read
    for _ in range(100):
        x_noise = random.randint(0, width)
        y_noise = random.randint(0, height)
        draw.point((x_noise, y_noise), fill=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)))
    
    # Draw the text
    draw.text((x, y), text, fill='black', font=font)
    
    # Add some lines to make it harder to read
    for _ in range(5):
        start_x = random.randint(0, width)
        start_y = random.randint(0, height)
        end_x = random.randint(0, width)
        end_y = random.randint(0, height)
        draw.line([(start_x, start_y), (end_x, end_y)], fill=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)), width=2)
    
    # Convert to base64
    buffer = BytesIO()
    image.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return img_str


def create_captcha(db: Session) -> dict:
    """Create a new captcha"""
    captcha_text = generate_captcha_text()
    captcha_id = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(10))
    image_data = generate_captcha_image(captcha_text)
    
    # Set expiration time
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.CAPTCHA_EXPIRE_MINUTES)
    
    # Save to database
    captcha = Captcha(
        captcha_id=captcha_id,
        captcha_text=captcha_text,
        image_data=image_data,
        expires_at=expires_at
    )
    
    db.add(captcha)
    db.commit()
    db.refresh(captcha)
    
    return {
        "captcha_id": captcha_id,
        "image": image_data
    }


def verify_captcha(db: Session, captcha_id: str, captcha_text: str) -> bool:
    """Verify captcha"""
    captcha = db.query(Captcha).filter(
        Captcha.captcha_id == captcha_id,
        Captcha.is_used == False,
        Captcha.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not captcha:
        return False
    
    if captcha.captcha_text != captcha_text:
        return False
    
    # Mark as used
    captcha.is_used = True
    db.commit()
    
    return True


def cleanup_expired_captchas(db: Session):
    """Clean up expired captchas"""
    expired_captchas = db.query(Captcha).filter(Captcha.expires_at < datetime.utcnow()).all()
    for captcha in expired_captchas:
        db.delete(captcha)
    db.commit()
