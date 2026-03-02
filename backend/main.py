from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models
from database import engine, get_db
import models, schemas, database, utils
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.security import OAuth2PasswordBearer

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Universe Campus Management API")

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
    db.refresh(new_user) # ID gibi otomatik oluşan alanları geri al
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user or not utils.verify_password(form_data.password, user.password):
        raise HTTPException(status_code=403, detail="Geçersiz bilgiler")
    
    access_token = utils.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}



from jose import JWTError, jwt # Importları unutmayalım

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