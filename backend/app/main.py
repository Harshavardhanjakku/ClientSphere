from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Integer, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection with pooling for Neon DB
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=300
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Model
class OPT_Party(Base):
    __tablename__ = "opt_party"
    
    PTY_ID = Column(String, primary_key=True, index=True)
    PTY_FirstName = Column(String(100), nullable=False)
    PTY_LastName = Column(String(100), nullable=False)
    PTY_Phone = Column(String(20))
    PTY_SSN = Column(String(11))
    PTY_Gender = Column(String(10), nullable=False)
    PTY_Age = Column(Integer, nullable=False)

# Pydantic models
class ClientBase(BaseModel):
    PTY_FirstName: str
    PTY_LastName: str
    PTY_Phone: Optional[str] = None
    PTY_SSN: Optional[str] = None
    PTY_Gender: str
    PTY_Age: int

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    PTY_ID: str
    
    class Config:
        orm_mode = True

# Create database tables (only needed once, can be removed after first run)
# Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Client Management API is running"}

# API Endpoints
@app.get("/api/genders", response_model=List[str])
def get_gender_list():
    return ["Male", "Female"]

@app.get("/api/genders/{gender}/count")
def get_gender_count(gender: str, db: Session = Depends(get_db)):
    try:
        count = db.query(OPT_Party).filter(OPT_Party.PTY_Gender == gender).count()
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/clients", response_model=List[Client])
def get_clients(
    age_min: int = 0, 
    age_max: int = 100,
    gender: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(OPT_Party).filter(
            OPT_Party.PTY_Age >= age_min,
            OPT_Party.PTY_Age <= age_max
        )
        
        if gender:
            query = query.filter(OPT_Party.PTY_Gender == gender)
            
        clients = query.all()
        return clients
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add a new client
@app.post("/api/clients/", response_model=Client)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    try:
        # Generate a simple ID (you might want to use UUID in production)
        from datetime import datetime
        new_id = f"pty_{int(datetime.now().timestamp())}"
        
        db_client = OPT_Party(
            PTY_ID=new_id,
            **client.dict()
        )
        db.add(db_client)
        db.commit()
        db.refresh(db_client)
        return db_client
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)