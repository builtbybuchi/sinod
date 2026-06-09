"""
Database Service
Handles database operations for user records and other data
"""

from services.appwrite_service import get_appwrite_service
import secrets

def generate_unique_id() -> str:
    """Generate a unique 6-character ID"""
    return secrets.token_hex(3).upper()

async def create_user_record(first_name: str, last_name: str, email: str, password: str) -> str:
    """
    Create a user record in the unique-id-collection

    Args:
        first_name: User's first name
        last_name: User's last name
        email: User's email
        password: User's password (not stored in DB, just for validation)

    Returns:
        The unique ID generated for the user
    """
    appwrite_service = get_appwrite_service()

    # Generate unique ID
    unique_id = generate_unique_id()

    # Create user record in unique-id-collection
    user_data = {
        "first_name": first_name,
        "last_name": last_name,
        "user_email": email,
        "unique_id": unique_id,
        "profile_pic_url": "https://images.unsplash.com/photo-1511367"  # Default profile pic
    }

    document = appwrite_service.create_document(
        collection_id="unique-id-collection",
        data=user_data
    )

    return unique_id
