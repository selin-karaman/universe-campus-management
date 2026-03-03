from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone

Base = declarative_base() 

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255))
    role = Column(String(20), default="student") 
    communities = relationship("Community", back_populates="owner")
    memberships = relationship("Membership", back_populates="user")
    event_participations = relationship("EventParticipant", back_populates="user")

class Community(Base):
    __tablename__ = "communities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id")) 
    owner = relationship("User", back_populates="communities")
    events = relationship("Event", back_populates="community")
    members = relationship("Membership", back_populates="community")

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200))
    description = Column(Text)
    date = Column(DateTime)
    location = Column(String(255))
    
    community_id = Column(Integer, ForeignKey("communities.id"))
    community = relationship("Community", back_populates="events")
    participants = relationship("EventParticipant", back_populates="event")

class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    community_id = Column(Integer, ForeignKey("communities.id"))
    role = Column(String, default="member") 

    user = relationship("User", back_populates="memberships")
    community = relationship("Community", back_populates="members")

    @property
    def community_name(self):
        return self.community.name if self.community else None
    
class EventParticipant(Base):
    __tablename__ = "event_participants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="event_participations")
    event = relationship("Event", back_populates="participants")