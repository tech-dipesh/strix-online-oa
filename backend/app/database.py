from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings

client = AsyncIOMotorClient(settings.mongo_uri)
db = client[settings.mongo_db_name]

users_collection = db["users"]
projects_collection = db["projects"]
files_collection = db["files"]
reviews_collection = db["reviews"]
diff_reviews_collection = db["diff_reviews"]
generated_docs_collection = db["generated_docs"]
chat_sessions_collection = db["chat_sessions"]
messages_collection = db["messages"]
ai_providers_collection = db["ai_providers"]
