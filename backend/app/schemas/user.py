from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    phone_number: str
    full_name: str
    email: Optional[EmailStr] = None
    password: str

class UserResponse(BaseModel):
    id: int
    phone_number: str
    full_name: str
    email: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    points: int
    total_points_earned: int
    total_distance_km: int
    total_workouts: int
    current_streak_days: int
    longest_streak_days: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    phone_number: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str