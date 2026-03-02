from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "student"

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class CommunityBase(BaseModel):
    name: str
    description: str | None = None

class CommunityCreate(CommunityBase):
    pass

class CommunityOut(CommunityBase): 
    id: int
    owner_id: int

    class Config:
        from_attributes = True