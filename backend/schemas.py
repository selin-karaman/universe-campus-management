from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class MembershipBase(BaseModel):
    community_id: int

class MembershipCreate(MembershipBase):
    pass

class MembershipOut(MembershipBase):
    id: int
    user_id: int
    role: str
    community_name: str | None = None

    class Config:
        from_attributes = True

class ParticipantOut(BaseModel):
    id: int
    user_id: int
    event_id: int
    joined_at: datetime

    class Config:
        from_attributes = True

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
    memberships: list[MembershipOut] = []
    event_participations: list[ParticipantOut] = []

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

class EventBase(BaseModel):
    title: str
    description: str
    date: datetime
    location: str

class EventCreate(EventBase):
    community_id: int

class EventOut(EventBase):
    id: int
    community_id: int

    class Config:
        from_attributes = True

class EventJoin(BaseModel):
    event_id: int

