from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from datetime import datetime, timedelta
import os
import uuid
import shutil
from pathlib import Path
from typing import Optional, List
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
import bcrypt

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Configuration
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "limpopo_classifieds")

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db.users
ads_collection = db.ads
messages_collection = db.messages

# Create upload directory
UPLOAD_DIR = Path("/app/frontend/public/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Limpopo locations
LIMPOPO_LOCATIONS = [
    "Polokwane", "Makhado (Louis Trichardt)", "Giyani", "Thohoyandou", 
    "Tzaneen", "Mokopane", "Lephalale", "Musina", "Bela-Bela", "Modimolle",
    "Lebowakgomo", "Marble Hall", "Dendron", "Ga-Kgapane", "Sekhukhune"
]

# Ad categories
AD_CATEGORIES = [
    "Men Seeking Women",
    "Women Seeking Men", 
    "Men Seeking Men",
    "Women Seeking Women",
    "Casual Encounters",
    "Adult Services"
]

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    age: Optional[int] = None
    location: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AdCreate(BaseModel):
    title: str
    description: str
    category: str
    location: str
    age: Optional[int] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None

class MessageCreate(BaseModel):
    to_user_id: str
    content: str

# Auth Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_verification_token():
    return secrets.token_urlsafe(32)

# Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.get("/api/locations")
async def get_locations():
    return {"locations": LIMPOPO_LOCATIONS}

@app.get("/api/categories")
async def get_categories():
    return {"categories": AD_CATEGORIES}

@app.post("/api/register")
async def register(user: UserCreate):
    # Check if user exists
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate location
    if user.location not in LIMPOPO_LOCATIONS:
        raise HTTPException(status_code=400, detail="Invalid location")
    
    # Create user
    user_id = str(uuid.uuid4())
    verification_token = generate_verification_token()
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "age": user.age,
        "location": user.location,
        "verified": False,
        "verification_token": verification_token,
        "created_at": datetime.utcnow()
    }
    
    users_collection.insert_one(user_doc)
    
    # In real app, send verification email here
    # For MVP, we'll auto-verify
    users_collection.update_one(
        {"id": user_id}, 
        {"$set": {"verified": True, "verification_token": None}}
    )
    
    return {
        "message": "Registration successful", 
        "user_id": user_id,
        "verified": True
    }

@app.post("/api/login")
async def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not db_user["verified"]:
        raise HTTPException(status_code=401, detail="Email not verified")
    
    # In real app, return JWT token
    return {
        "message": "Login successful",
        "user_id": db_user["id"],
        "name": db_user["name"],
        "email": db_user["email"]
    }

@app.post("/api/ads")
async def create_ad(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    user_id: str = Form(...),
    age: Optional[int] = Form(None),
    phone: Optional[str] = Form(None),
    whatsapp: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    # Validate category and location
    if category not in AD_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    if location not in LIMPOPO_LOCATIONS:
        raise HTTPException(status_code=400, detail="Invalid location")
    
    # Verify user exists
    user = users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    ad_id = str(uuid.uuid4())
    image_url = None
    
    # Handle image upload
    if image:
        image_filename = f"{ad_id}_{image.filename}"
        image_path = UPLOAD_DIR / image_filename
        
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        image_url = f"/uploads/{image_filename}"
    
    ad_doc = {
        "id": ad_id,
        "user_id": user_id,
        "title": title,
        "description": description,
        "category": category,
        "location": location,
        "age": age,
        "phone": phone,
        "whatsapp": whatsapp,
        "image_url": image_url,
        "created_at": datetime.utcnow(),
        "active": True,
        "views": 0
    }
    
    ads_collection.insert_one(ad_doc)
    
    return {"message": "Ad created successfully", "ad_id": ad_id}

@app.get("/api/ads")
async def get_ads(
    category: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 20,
    skip: int = 0
):
    query = {"active": True}
    
    if category and category != "All":
        query["category"] = category
    if location and location != "All":
        query["location"] = location
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    ads = list(ads_collection.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit))
    
    # Add user info to each ad
    for ad in ads:
        user = users_collection.find_one({"id": ad["user_id"]}, {"_id": 0, "name": 1})
        ad["user_name"] = user["name"] if user else "Anonymous"
    
    return {"ads": ads}

@app.get("/api/ads/{ad_id}")
async def get_ad(ad_id: str):
    ad = ads_collection.find_one({"id": ad_id, "active": True}, {"_id": 0})
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
    
    # Increment view count
    ads_collection.update_one({"id": ad_id}, {"$inc": {"views": 1}})
    ad["views"] += 1
    
    # Add user info
    user = users_collection.find_one({"id": ad["user_id"]}, {"_id": 0, "name": 1})
    ad["user_name"] = user["name"] if user else "Anonymous"
    
    return ad

@app.post("/api/messages")
async def send_message(message: MessageCreate, sender_id: str = Form(...)):
    # Verify both users exist
    sender = users_collection.find_one({"id": sender_id})
    recipient = users_collection.find_one({"id": message.to_user_id})
    
    if not sender or not recipient:
        raise HTTPException(status_code=404, detail="User not found")
    
    message_doc = {
        "id": str(uuid.uuid4()),
        "from_user_id": sender_id,
        "to_user_id": message.to_user_id,
        "content": message.content,
        "created_at": datetime.utcnow(),
        "read": False
    }
    
    messages_collection.insert_one(message_doc)
    
    return {"message": "Message sent successfully"}

@app.get("/api/messages/{user_id}")
async def get_messages(user_id: str, other_user_id: str):
    messages = list(messages_collection.find({
        "$or": [
            {"from_user_id": user_id, "to_user_id": other_user_id},
            {"from_user_id": other_user_id, "to_user_id": user_id}
        ]
    }, {"_id": 0}).sort("created_at", 1))
    
    # Mark messages as read
    messages_collection.update_many(
        {"from_user_id": other_user_id, "to_user_id": user_id},
        {"$set": {"read": True}}
    )
    
    return {"messages": messages}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)