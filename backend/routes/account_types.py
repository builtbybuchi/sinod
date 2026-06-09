from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import logging
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query

from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["account-types"])

def get_appwrite_client():
    client = Client()
    client.set_endpoint(settings.APPWRITE_ENDPOINT)
    client.set_project(settings.APPWRITE_PROJECT_ID)
    client.set_key(settings.APPWRITE_API_KEY)
    return client

@router.get("/account-types")
async def list_account_types():
    """
    Returns list of account-types documents.
    Frontend pricing page should call: GET {VITE_BACKEND_URL}/api/account-types
    """
    try:
        client = get_appwrite_client()
        db = Databases(client)
        res = db.list_documents(
            database_id=settings.APPWRITE_DATABASE_ID,
            collection_id=settings.ACCOUNT_TYPES_COLLECTION_ID
        )
        documents = res.get("documents", res.get("rows", [])) if isinstance(res, dict) else res
        # Normalize output: include id and data fields
        out = []
        for d in documents:
            item = {"id": d.get("$id"), **d.get("data", {})}
            out.append(item)
        return JSONResponse(content={"success": True, "account_types": out})
    except Exception as e:
        logger.exception("Failed to fetch account-types: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch account-types")