from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models
from database import engine, get_db
import models, schemas, database, utils
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Universe Campus Management API")

app = FastAPI(title="Universe API")

origins = [
    "http://localhost",
    "http://localhost:8080", 
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@app.get("/")
def home():
    return {"message": "Universe API is running!"}

@app.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = utils.hash_password(user.password)
    
    new_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user) 
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user or not utils.verify_password(form_data.password, user.password):
        raise HTTPException(status_code=403, detail="Geçersiz bilgiler")
    
    access_token = utils.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}



from jose import JWTError, jwt 

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Kimlik bilgileri doğrulanamadı",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, utils.SECRET_KEY, algorithms=[utils.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/communities/", response_model=schemas.CommunityOut)
def create_community(
    community: schemas.CommunityCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user) 
):
    new_community = models.Community(
        name=community.name,
        description=community.description,
        owner_id=current_user.id 
    )
    db.add(new_community)
    db.commit()
    db.refresh(new_community)
    return new_community

@app.get("/communities/", response_model=list[schemas.CommunityOut])
def read_communities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    communities = db.query(models.Community).offset(skip).limit(limit).all()
    return communities

@app.get("/communities/{community_id}", response_model=schemas.CommunityOut)
def read_community(community_id: int, db: Session = Depends(get_db)):
    db_community = db.query(models.Community).filter(models.Community.id == community_id).first()
    if db_community is None:
        raise HTTPException(status_code=404, detail="Topluluk bulunamadı")
    return db_community

@app.post("/communities/join", response_model=schemas.MembershipOut)
def join_community(
    membership: schemas.MembershipCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.Membership).filter(
        models.Membership.user_id == current_user.id,
        models.Membership.community_id == membership.community_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Zaten bu topluluğun üyesisiniz.")

    new_member = models.Membership(
        user_id=current_user.id,
        community_id=membership.community_id,
        role="member"
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@app.get("/users/me", response_model=schemas.UserOut)
def get_user_profile(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/events/", response_model=schemas.EventOut)
def create_event(
    event: schemas.EventCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    community = db.query(models.Community).filter(
        models.Community.id == event.community_id,
        models.Community.owner_id == current_user.id
    ).first()

    if not community:
        raise HTTPException(status_code=403, detail="Bu topluluk adına etkinlik oluşturma yetkiniz yok.")

    new_event = models.Event(**event.dict())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@app.post("/events/join", response_model=schemas.ParticipantOut)
def join_event(
    data: schemas.EventJoin, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    event = db.query(models.Event).filter(models.Event.id == data.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı.")
    
    already_joined = db.query(models.EventParticipant).filter(
        models.EventParticipant.user_id == current_user.id,
        models.EventParticipant.event_id == data.event_id
    ).first()
    
    if already_joined:
        raise HTTPException(status_code=400, detail="Bu etkinliğe zaten kayıtlısınız.")

    new_participant = models.EventParticipant(
        user_id=current_user.id,
        event_id=data.event_id
    )
    db.add(new_participant)
    db.commit()
    db.refresh(new_participant)
    return new_participant

@app.get("/communities/{community_id}/members", response_model=list[schemas.MembershipOut])
def get_community_members(community_id: int, db: Session = Depends(get_db)):
    members = db.query(models.Membership).filter(models.Membership.community_id == community_id).all()
    
    if not members:
        return []
        
    return members

@app.post("/announcements/", response_model=schemas.AnnouncementOut)
def create_announcement(
    announcement: schemas.AnnouncementCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    community = db.query(models.Community).filter(
        models.Community.id == announcement.community_id,
        models.Community.owner_id == current_user.id
    ).first()

    if not community:
        raise HTTPException(
            status_code=403, 
            detail="Sadece topluluk liderleri duyuru paylaşabilir."
        )

    new_announcement = models.Announcement(**announcement.dict())
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)
    return new_announcement