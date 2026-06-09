"""
This file contains the setup script for initializing the Appwrite database, 

This file would help us to easily reproduce our exact database structure 
if any crash happens or if we need to set up the database in a new environment.
"""

import os
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID

APPWRITE_ENDPOINT="http://localhost"


APPWRITE_PROJECT_ID="sinod"
APPWRITE_API_KEY="standard_24a4ce5f7e783a1d28b088100313eee230c5b2d2421eec177480a20645c80a5f4063780be217952370fa2e3015879bdee4ba4fc97d7d86fbe8bad07a02b4d958ceec663e13ab0e6f842314f5e51c339c0067032be728506b3093c426affe594743ff7ff8635c480b62fdad3a285e748f9725fd9e1b8f198e05f1398d4a966e7d"


DATABASE_INFO = {
    "id": "sinod-db",
    "name": "The official Sinod' Database"
}

# A list of all collections to be created, each with its attributes, permissions, and indexes
COLLECTIONS_DEFINITIONS = [
    {
        "id": "unique-id-collection", "name": "unique-id-collection",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "user_email_index", "type": "key", "attributes": ["user_email"]},
            {"key": "unique_id_index", "type": "key", "attributes": ["unique_id"]}
        ],
        "attributes": [
            {"key": "first_name", "type": "string", "size": 255, "required": True},
            {"key": "last_name", "type": "string", "size": 255, "required": True},
            {"key": "user_email", "type": "email", "required": True},
            {"key": "profile_pic_url", "type": "url", "required": False, "default": "https://images.unsplash.com/photo-1511367"},
            {"key": "unique_id", "type": "string", "size": 255, "required": True},
        ]
    },
    {
        "id": "events-collection", "name": "events-collection",
        "permissions": ["read(\"any\")", "write(\"users\")"],
        "indexes": [
            {"key": "event_time_index", "type": "key", "attributes": ["event_time"]},
            {"key": "user_email_index", "type": "key", "attributes": ["user_email"]}
        ],
        "attributes": [
            {"key": "event_name", "type": "string", "size": 255, "required": True},
            {"key": "event_time", "type": "datetime", "required": True},
            {"key": "public_status", "type": "boolean", "required": False, "default": True},
            {"key": "virtual_status", "type": "boolean", "required": False, "default": True},
            {"key": "event_description", "type": "string", "size": 5000, "required": False, "default": "No description provided for this event."},
            {"key": "event_address", "type": "string", "size": 500, "required": False},
            {"key": "event_url", "type": "url", "required": False},
            {"key": "paid", "type": "boolean", "required": True},
            {"key": "city", "type": "string", "size": 255, "required": False},
            {"key": "event_end_time", "type": "datetime", "required": True},
            {"key": "event_price", "type": "float", "required": False},
            {"key": "user_email", "type": "email", "required": True},
            {"key": "event_page_url", "type": "string", "size": 255, "required": True},
            {"key": "auto_approve", "type": "boolean", "required": False, "default": True},
            {"key": "has_custom_questions", "type": "boolean", "required": False, "default": False},
            # Theme & customization
            {"key": "theme", "type": "string", "size": 50, "required": False},
            {"key": "primary_color", "type": "string", "size": 20, "required": False},
            {"key": "font_family", "type": "string", "size": 100, "required": False},
            {"key": "logo_url", "type": "url", "required": False},
            {"key": "bg_color", "type": "string", "size": 20, "required": False},
            {"key": "text_color", "type": "string", "size": 20, "required": False},
            {"key": "allow_group_registration", "type": "boolean", "required": False, "default": False},
            {"key": "max_group_size", "type": "integer", "required": False},
            {"key": "fee_bearer", "type": "string", "size": 20, "required": False},
            # meta: JSON blob holding custom_questions, ticket_types, coupons
            # (consolidated to avoid Appwrite per-collection attribute size limit)
            {"key": "meta", "type": "string", "size": 16000, "required": False},
        ]
    },
    {
        "id": "attendees-collection", "name": "attendees-collection",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "event_id_index", "type": "key", "attributes": ["event_id"]},
            {"key": "email_index", "type": "key", "attributes": ["email"]}
        ],
        "attributes": [
            {"key": "first_name", "type": "string", "size": 255, "required": True},
            {"key": "last_name", "type": "string", "size": 255, "required": True},
            {"key": "other_names", "type": "string", "size": 255, "required": False},
            {"key": "email", "type": "email", "required": True},
            {"key": "phone_number", "type": "string", "size": 30, "required": False},
            {"key": "registration_id", "type": "string", "size": 255, "required": False},
            {"key": "paid", "type": "boolean", "required": False, "default": False},
            {"key": "approved", "type": "boolean", "required": False, "default": False},
            {"key": "verified", "type": "boolean", "required": False, "default": False},
            {"key": "event_id", "type": "string", "size": 255, "required": True},
            {"key": "verified_at", "type": "datetime", "required": False},
            {"key": "approved_at", "type": "datetime", "required": False},
            {"key": "custom_responses", "type": "string", "size": 8000, "required": False},
            {"key": "ticket_type_id", "type": "string", "size": 255, "required": False},
            {"key": "ticket_name", "type": "string", "size": 255, "required": False},
            {"key": "amount_paid", "type": "float", "required": False},
            {"key": "coupon_code", "type": "string", "size": 100, "required": False},
            {"key": "coupon_discount", "type": "float", "required": False},
        ]
    },
    {
        "id": "documents", "name": "documents-collection",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "createdBy_index", "type": "key", "attributes": ["createdBy"]},
            {"key": "isPublic_index", "type": "key", "attributes": ["isPublic"]}
        ],
        "attributes": [
            {"key": "title", "type": "string", "size": 255, "required": True},
            {"key": "content", "type": "string", "size": 10000, "required": False},
            {"key": "createdBy", "type": "string", "size": 255, "required": True},
            {"key": "createdAt", "type": "datetime", "required": True},
            {"key": "updatedAt", "type": "datetime", "required": True},
            {"key": "collaborators", "type": "string", "size": 255, "required": False, "array": True},
            {"key": "isPublic", "type": "boolean", "required": True},
        ]
    },
    {
        "id": "document-invites", "name": "document-invites",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "attributes": [
            {"key": "documentId", "type": "string", "size": 255, "required": True},
            {"key": "email", "type": "email", "required": True},
            {"key": "invitedBy", "type": "string", "size": 255, "required": True},
            {"key": "status", "type": "enum", "elements": ["pending", "accepted", "rejected"], "required": True},
            {"key": "token", "type": "string", "size": 255, "required": True},
            {"key": "createdAt", "type": "datetime", "required": True},
            {"key": "expiresAt", "type": "datetime", "required": False},
            {"key": "invitedByName", "type": "string", "size": 255, "required": False},
            {"key": "documentTitle", "type": "string", "size": 255, "required": False},
            {"key": "respondedAt", "type": "datetime", "required": False},
        ]
    },
    {
        "id": "document-presence", "name": "document-presence",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "attributes": [
            {"key": "documentId", "type": "string", "size": 255, "required": True},
            {"key": "userEmail", "type": "string", "size": 255, "required": False},
            {"key": "color", "type": "string", "size": 255, "required": True},
            {"key": "lastSeen", "type": "datetime", "required": True},
            {"key": "isActive", "type": "boolean", "required": True},
        ]
    },
    {
        "id": "whiteboards", "name": "whiteboards",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "attributes": [
            {"key": "title", "type": "string", "size": 255, "required": True},
            {"key": "content", "type": "string", "size": 20000, "required": False},
            {"key": "createdBy", "type": "email", "required": True},
            {"key": "createdAt", "type": "datetime", "required": True},
            {"key": "updatedAt", "type": "datetime", "required": True},
            {"key": "collaborators", "type": "email", "required": False, "array": True},
            {"key": "isPublic", "type": "boolean", "required": True},
        ]
    },
    {
        "id": "whiteboard-invites", "name": "whiteboard-invites",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "attributes": [
            {"key": "whiteboardId", "type": "string", "size": 255, "required": True},
            {"key": "email", "type": "email", "required": True},
            {"key": "invitedBy", "type": "email", "required": True},
            {"key": "status", "type": "enum", "elements": ["pending", "accepted", "rejected"], "required": True},
            {"key": "token", "type": "string", "size": 255, "required": False},
            {"key": "createdAt", "type": "datetime", "required": True},
            {"key": "expiresAt", "type": "datetime", "required": False},
        ]
    },
    {
        "id": "whiteboard-presence", "name": "whiteboard-presence",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "attributes": [
            {"key": "whiteboardId", "type": "string", "size": 255, "required": True},
            {"key": "userEmail", "type": "email", "required": True},
            {"key": "color", "type": "string", "size": 7, "required": False, "default": "#3B82F6"},
            {"key": "lastSeen", "type": "datetime", "required": True},
            {"key": "isActive", "type": "boolean", "required": False, "default": True},
        ]
    },
    {
        "id": "conversations", "name": "conversations",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "type_index", "type": "key", "attributes": ["type"]},
            {"key": "createdBy_index", "type": "key", "attributes": ["createdBy"]}
        ],
        "attributes": [
            {"key": "type", "type": "enum", "elements": ["dm", "group"], "required": True},
            {"key": "name", "type": "string", "size": 255, "required": False},
            {"key": "description", "type": "string", "size": 1000, "required": False},
            {"key": "avatarUrl", "type": "url", "required": False},
            {"key": "participants", "type": "string", "size": 255, "required": False, "array": True},
            {"key": "participantNames", "type": "string", "size": 255, "required": False, "array": True},
            {"key": "participantAvatars", "type": "string", "size": 512, "required": False, "array": True},
            {"key": "createdBy", "type": "email", "required": True},
            {"key": "createdAt", "type": "datetime", "required": True},
            {"key": "updatedAt", "type": "datetime", "required": True},
            {"key": "lastMessage", "type": "string", "size": 1000, "required": False},
            {"key": "lastMessageBy", "type": "email", "required": False},
            {"key": "lastMessageAt", "type": "datetime", "required": False},
            {"key": "unreadCounts", "type": "string", "size": 1000, "required": False, "default": "{}"},
        ]
    },
    {
        "id": "messages", "name": "messages",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "conversationId_index", "type": "key", "attributes": ["conversationId"]},
            {"key": "senderId_index", "type": "key", "attributes": ["senderId"]}
        ],
        "attributes": [
            {"key": "conversationId", "type": "string", "size": 255, "required": True},
            {"key": "senderId", "type": "email", "required": True},
            {"key": "senderName", "type": "string", "size": 255, "required": True},
            {"key": "senderAvatar", "type": "string", "size": 512, "required": True},
            {"key": "content", "type": "string", "size": 10000, "required": True},
            {"key": "type", "type": "enum", "elements": ["text", "image", "video", "file"], "required": True},
            {"key": "attachmentSize", "type": "integer", "required": False, "default": 0},
            {"key": "createdAt", "type": "datetime", "required": True},
            {"key": "updatedAt", "type": "datetime", "required": False},
            {"key": "isEdited", "type": "boolean", "required": True},
            {"key": "readBy", "type": "string", "size": 255, "required": False, "array": True},
            {"key": "replyTo", "type": "string", "size": 255, "required": False},
            {"key": "attachmentName", "type": "string", "size": 255, "required": False},
            {"key": "attachmentUrl", "type": "url", "required": False},
        ]
    },
    {
        "id": "user-presence", "name": "user-presence",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "attributes": [
            {"key": "userEmail", "type": "string", "size": 255, "required": True},
            {"key": "userName", "type": "string", "size": 255, "required": True},
            {"key": "status", "type": "string", "size": 50, "required": False, "default": "online"},
            {"key": "lastSeen", "type": "datetime", "required": False},
        ]
    },
    {
        "id": "notifications", "name": "notifications",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "userId_index", "type": "key", "attributes": ["userId"]}
        ],
        "attributes": [
            {"key": "userId", "type": "string", "size": 255, "required": True},
            {"key": "title", "type": "string", "size": 255, "required": True},
            {"key": "message", "type": "string", "size": 1000, "required": True},
            {"key": "data", "type": "string", "size": 5000, "required": False},
            {"key": "actionUrl", "type": "url", "required": False},
            {"key": "read", "type": "boolean", "required": False, "default": False},
            {"key": "createdAt", "type": "datetime", "required": True},
            {"key": "type", "type": "enum", "elements": ["info", "alert", "success", "error"], "required": True},
        ]
    },
    {
        "id": "withdrawals", "name": "withdrawals",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "user_email_index", "type": "key", "attributes": ["user_email"]}
        ],
        "attributes": [
            {"key": "user_email", "type": "email", "required": True},
            {"key": "event_id", "type": "string", "size": 255, "required": True},
            {"key": "gross_amount", "type": "float", "required": True},
            {"key": "platform_fee", "type": "float", "required": True},
            {"key": "net_amount", "type": "float", "required": True},
            {"key": "status", "type": "string", "size": 50, "required": True, "default": "pending"},
            {"key": "transfer_reference", "type": "string", "size": 255, "required": True},
            {"key": "bank_details", "type": "string", "size": 500, "required": True},
            {"key": "withdrawn_at", "type": "datetime", "required": True},
        ]
    },
    {
        "id": "refunds", "name": "refunds",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "attendee_email_index", "type": "key", "attributes": ["attendee_email"]},
            {"key": "event_id_index", "type": "key", "attributes": ["event_id"]},
            {"key": "host_email_index", "type": "key", "attributes": ["host_email"]},
            {"key": "status_index", "type": "key", "attributes": ["status"]}
        ],
        "attributes": [
            {"key": "attendee_email", "type": "email", "required": True},
            {"key": "attendee_id", "type": "string", "size": 255, "required": True},
            {"key": "event_id", "type": "string", "size": 255, "required": True},
            {"key": "event_name", "type": "string", "size": 500, "required": True},
            {"key": "host_email", "type": "email", "required": True},
            {"key": "ticket_price", "type": "float", "required": True},
            {"key": "refund_amount", "type": "float", "required": True},
            {"key": "fee_deducted", "type": "float", "required": False},
            {"key": "reason", "type": "string", "size": 1000, "required": False, "default": ""},
            {"key": "status", "type": "string", "size": 50, "required": True, "default": "pending"},
            {"key": "requested_at", "type": "datetime", "required": True},
            {"key": "resolved_at", "type": "datetime", "required": False},
            {"key": "admin_email", "type": "string", "size": 255, "required": False, "default": ""},
            {"key": "admin_note", "type": "string", "size": 1000, "required": False, "default": ""},
        ]
    },
    {
        "id": "certificates", "name": "certificates",
        "permissions": ["read(\"any\")", "write(\"users\")"],
        "indexes": [
            {"key": "certificate_id_index", "type": "unique", "attributes": ["certificate_id"]},
            {"key": "event_name_index", "type": "key", "attributes": ["event_name"]},
            {"key": "recipient_email_index", "type": "key", "attributes": ["recipient_email"]}
        ],
        "attributes": [
            {"key": "certificate_id", "type": "string", "size": 255, "required": True},
            {"key": "recipient_name", "type": "string", "size": 255, "required": True},
            {"key": "recipient_email", "type": "email", "required": True},
            {"key": "event_name", "type": "string", "size": 255, "required": True},
            {"key": "event_date", "type": "string", "size": 255, "required": True},
            {"key": "issued_at", "type": "datetime", "required": True},
            {"key": "issued_by", "type": "string", "size": 255, "required": False},
            {"key": "event_id", "type": "string", "size": 255, "required": False},
        ]
    },
    {
        "id": "newsletter-subscribers", "name": "newsletter-subscribers",
        "permissions": ["read(\"any\")", "write(\"any\")"],
        "indexes": [
            {"key": "email_index", "type": "unique", "attributes": ["email"]},
            {"key": "subscribed_index", "type": "key", "attributes": ["subscribed"]}
        ],
        "attributes": [
            {"key": "first_name", "type": "string", "size": 255, "required": True},
            {"key": "last_name", "type": "string", "size": 255, "required": False, "default": ""},
            {"key": "email", "type": "email", "required": True},
            {"key": "subscribed", "type": "boolean", "required": False, "default": True},
            {"key": "subscribed_at", "type": "datetime", "required": True},
            {"key": "unsubscribed_at", "type": "datetime", "required": False},
        ]
    },
    {
        "id": "unsubscribe-feedback", "name": "unsubscribe-feedback",
        "permissions": ["read(\"users\")", "write(\"any\")"],
        "indexes": [
            {"key": "email_index", "type": "key", "attributes": ["email"]}
        ],
        "attributes": [
            {"key": "email", "type": "email", "required": True},
            {"key": "reason", "type": "string", "size": 255, "required": True},
            {"key": "details", "type": "string", "size": 2000, "required": False, "default": ""},
            {"key": "submitted_at", "type": "datetime", "required": True},
        ]
    },
    {
        "id": "contact-messages", "name": "contact-messages",
        "permissions": ["read(\"users\")", "write(\"any\")"],
        "indexes": [
            {"key": "email_index", "type": "key", "attributes": ["email"]},
            {"key": "type_index", "type": "key", "attributes": ["type"]},
            {"key": "created_at_index", "type": "key", "attributes": ["created_at"]}
        ],
        "attributes": [
            {"key": "name", "type": "string", "size": 255, "required": True},
            {"key": "email", "type": "email", "required": True},
            {"key": "subject", "type": "string", "size": 500, "required": True},
            {"key": "message", "type": "string", "size": 5000, "required": True},
            {"key": "type", "type": "string", "size": 100, "required": False, "default": "contact"},
            {"key": "event_id", "type": "string", "size": 255, "required": False},
            {"key": "reason", "type": "string", "size": 1000, "required": False},
            {"key": "created_at", "type": "datetime", "required": True},
        ]
    },
    # ========================================================================
    # FORMS
    # ========================================================================
    {
        "id": "forms", "name": "forms",
        "permissions": ["read(\"any\")", "write(\"users\")"],
        "indexes": [
            {"key": "created_by_index", "type": "key", "attributes": ["created_by"]},
            {"key": "status_index", "type": "key", "attributes": ["status"]},
            {"key": "event_id_index", "type": "key", "attributes": ["event_id"]}
        ],
        "attributes": [
            {"key": "title", "type": "string", "size": 500, "required": True},
            {"key": "description", "type": "string", "size": 2000, "required": False, "default": ""},
            {"key": "questions", "type": "string", "size": 50000, "required": True},
            {"key": "created_by", "type": "email", "required": True},
            {"key": "status", "type": "enum", "elements": ["draft", "active", "closed"], "required": False, "default": "active"},
            {"key": "is_public", "type": "boolean", "required": False, "default": True},
            {"key": "event_id", "type": "string", "size": 255, "required": False},
            {"key": "response_count", "type": "integer", "required": False, "default": 0},
            {"key": "created_at", "type": "datetime", "required": True},
            {"key": "updated_at", "type": "datetime", "required": True},
        ]
    },
    {
        "id": "form-responses", "name": "form-responses",
        "permissions": ["read(\"users\")", "write(\"any\")"],
        "indexes": [
            {"key": "form_id_index", "type": "key", "attributes": ["form_id"]},
            {"key": "respondent_email_index", "type": "key", "attributes": ["respondent_email"]}
        ],
        "attributes": [
            {"key": "form_id", "type": "string", "size": 255, "required": True},
            {"key": "respondent_email", "type": "email", "required": False},
            {"key": "respondent_name", "type": "string", "size": 255, "required": False, "default": "Anonymous"},
            {"key": "answers", "type": "string", "size": 50000, "required": True},
            {"key": "submitted_at", "type": "datetime", "required": True},
        ]
    },
    # ========================================================================
    # QUIZZES
    # ========================================================================
    {
        "id": "quizzes", "name": "quizzes",
        "permissions": ["read(\"any\")", "write(\"users\")"],
        "indexes": [
            {"key": "created_by_index", "type": "key", "attributes": ["created_by"]},
            {"key": "status_index", "type": "key", "attributes": ["status"]},
            {"key": "is_public_index", "type": "key", "attributes": ["is_public"]},
            {"key": "city_index", "type": "key", "attributes": ["city"]},
            {"key": "country_index", "type": "key", "attributes": ["country"]}
        ],
        "attributes": [
            {"key": "title", "type": "string", "size": 500, "required": True},
            {"key": "description", "type": "string", "size": 2000, "required": False, "default": ""},
            {"key": "questions", "type": "string", "size": 50000, "required": True},
            {"key": "created_by", "type": "email", "required": True},
            {"key": "status", "type": "enum", "elements": ["draft", "active", "closed"], "required": False, "default": "active"},
            {"key": "is_public", "type": "boolean", "required": False, "default": False},
            {"key": "time_limit_seconds", "type": "integer", "required": False, "default": 0},
            {"key": "city", "type": "string", "size": 255, "required": False},
            {"key": "country", "type": "string", "size": 255, "required": False},
            {"key": "response_count", "type": "integer", "required": False, "default": 0},
            {"key": "created_at", "type": "datetime", "required": True},
            {"key": "updated_at", "type": "datetime", "required": True},
        ]
    },
    {
        "id": "quiz-responses", "name": "quiz-responses",
        "permissions": ["read(\"users\")", "write(\"any\")"],
        "indexes": [
            {"key": "quiz_id_index", "type": "key", "attributes": ["quiz_id"]},
            {"key": "respondent_email_index", "type": "key", "attributes": ["respondent_email"]},
            {"key": "score_index", "type": "key", "attributes": ["score"]}
        ],
        "attributes": [
            {"key": "quiz_id", "type": "string", "size": 255, "required": True},
            {"key": "respondent_email", "type": "email", "required": False},
            {"key": "respondent_name", "type": "string", "size": 255, "required": False, "default": "Anonymous"},
            {"key": "answers", "type": "string", "size": 50000, "required": True},
            {"key": "score", "type": "integer", "required": False, "default": 0},
            {"key": "total_questions", "type": "integer", "required": False, "default": 0},
            {"key": "correct_answers", "type": "integer", "required": False, "default": 0},
            {"key": "time_taken_seconds", "type": "integer", "required": False, "default": 0},
            {"key": "city", "type": "string", "size": 255, "required": False},
            {"key": "country", "type": "string", "size": 255, "required": False},
            {"key": "submitted_at", "type": "datetime", "required": True},
        ]
    },
    # ========================================================================
    # USER MAILING LISTS (separate from Sinod main newsletter)
    # ========================================================================
    {
        "id": "user-mailing-lists", "name": "user-mailing-lists",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "owner_email_index", "type": "key", "attributes": ["owner_email"]},
            {"key": "name_index", "type": "key", "attributes": ["name"]}
        ],
        "attributes": [
            {"key": "name", "type": "string", "size": 255, "required": True},
            {"key": "description", "type": "string", "size": 1000, "required": False, "default": ""},
            {"key": "owner_email", "type": "email", "required": True},
            {"key": "subscriber_count", "type": "integer", "required": False, "default": 0},
            {"key": "created_at", "type": "datetime", "required": True},
            {"key": "updated_at", "type": "datetime", "required": True},
        ]
    },
    {
        "id": "user-mailing-list-subscribers", "name": "user-mailing-list-subscribers",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "list_id_index", "type": "key", "attributes": ["list_id"]},
            {"key": "email_index", "type": "key", "attributes": ["email"]},
            {"key": "subscribed_index", "type": "key", "attributes": ["subscribed"]}
        ],
        "attributes": [
            {"key": "list_id", "type": "string", "size": 255, "required": True},
            {"key": "name", "type": "string", "size": 255, "required": False, "default": ""},
            {"key": "email", "type": "email", "required": True},
            {"key": "subscribed", "type": "boolean", "required": False, "default": True},
            {"key": "source", "type": "string", "size": 50, "required": False, "default": "manual"},
            {"key": "event_ids", "type": "string", "size": 5000, "required": False, "default": ""},
            {"key": "subscribed_at", "type": "datetime", "required": True},
            {"key": "unsubscribed_at", "type": "datetime", "required": False},
            {"key": "unsubscribe_reason", "type": "string", "size": 500, "required": False, "default": ""},
        ]
    },
    {
        "id": "newsletter-campaigns", "name": "newsletter-campaigns",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "owner_email_index", "type": "key", "attributes": ["owner_email"]},
            {"key": "status_index", "type": "key", "attributes": ["status"]},
            {"key": "scheduled_at_index", "type": "key", "attributes": ["scheduled_at"]}
        ],
        "attributes": [
            {"key": "title", "type": "string", "size": 500, "required": True},
            {"key": "subject", "type": "string", "size": 500, "required": True},
            {"key": "sender_name", "type": "string", "size": 255, "required": True},
            {"key": "sender_logo_url", "type": "string", "size": 2000, "required": False, "default": ""},
            {"key": "reply_to_email", "type": "string", "size": 500, "required": False, "default": ""},
            {"key": "content_json", "type": "string", "size": 100000, "required": False, "default": ""},
            {"key": "content_html", "type": "string", "size": 200000, "required": True},
            {"key": "owner_email", "type": "email", "required": True},
            {"key": "status", "type": "enum", "elements": ["draft", "scheduled", "sending", "sent", "failed"], "required": False, "default": "draft"},
            {"key": "recipient_list_ids", "type": "string", "size": 5000, "required": False, "default": ""},
            {"key": "recipient_event_ids", "type": "string", "size": 5000, "required": False, "default": ""},
            {"key": "recipient_filter", "type": "string", "size": 100, "required": False, "default": "all"},
            {"key": "total_recipients", "type": "integer", "required": False, "default": 0},
            {"key": "sent_count", "type": "integer", "required": False, "default": 0},
            {"key": "failed_count", "type": "integer", "required": False, "default": 0},
            {"key": "open_count", "type": "integer", "required": False, "default": 0},
            {"key": "click_count", "type": "integer", "required": False, "default": 0},
            {"key": "unsubscribe_count", "type": "integer", "required": False, "default": 0},
            {"key": "bounce_count", "type": "integer", "required": False, "default": 0},
            {"key": "scheduled_at", "type": "datetime", "required": False},
            {"key": "sent_at", "type": "datetime", "required": False},
            {"key": "created_at", "type": "datetime", "required": True},
            {"key": "updated_at", "type": "datetime", "required": True},
        ]
    },
    {
        "id": "newsletter-recipients", "name": "newsletter-recipients",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "campaign_id_index", "type": "key", "attributes": ["campaign_id"]},
            {"key": "email_index", "type": "key", "attributes": ["email"]},
            {"key": "status_index", "type": "key", "attributes": ["status"]}
        ],
        "attributes": [
            {"key": "campaign_id", "type": "string", "size": 255, "required": True},
            {"key": "email", "type": "email", "required": True},
            {"key": "name", "type": "string", "size": 255, "required": False, "default": ""},
            {"key": "status", "type": "enum", "elements": ["pending", "sent", "failed", "delivered", "opened", "clicked", "bounced", "unsubscribed"], "required": False, "default": "pending"},
            {"key": "sent_at", "type": "datetime", "required": False},
            {"key": "delivered_at", "type": "datetime", "required": False},
            {"key": "opened_at", "type": "datetime", "required": False},
            {"key": "open_count", "type": "integer", "required": False, "default": 0},
            {"key": "clicked_at", "type": "datetime", "required": False},
            {"key": "click_count", "type": "integer", "required": False, "default": 0},
            {"key": "bounced_at", "type": "datetime", "required": False},
            {"key": "bounce_reason", "type": "string", "size": 1000, "required": False, "default": ""},
            {"key": "unsubscribed_at", "type": "datetime", "required": False},
            {"key": "error_message", "type": "string", "size": 1000, "required": False, "default": ""},
        ]
    },
    {
        "id": "newsletter-link-clicks", "name": "newsletter-link-clicks",
        "permissions": ["read(\"users\")", "write(\"any\")"],
        "indexes": [
            {"key": "campaign_id_index", "type": "key", "attributes": ["campaign_id"]},
            {"key": "recipient_email_index", "type": "key", "attributes": ["recipient_email"]},
            {"key": "event_type_index", "type": "key", "attributes": ["event_type"]}
        ],
        "attributes": [
            {"key": "campaign_id", "type": "string", "size": 255, "required": True},
            {"key": "recipient_email", "type": "email", "required": True},
            {"key": "event_type", "type": "enum", "elements": ["opened", "clicked", "bounced", "unsubscribed"], "required": True},
            {"key": "link_url", "type": "string", "size": 2000, "required": False, "default": ""},
            {"key": "user_agent", "type": "string", "size": 500, "required": False, "default": ""},
            {"key": "ip_address", "type": "string", "size": 50, "required": False, "default": ""},
            {"key": "created_at", "type": "datetime", "required": True},
        ]
    },
    {
        "id": "newsletter-unsubscribe-log", "name": "newsletter-unsubscribe-log",
        "permissions": ["read(\"users\")", "write(\"any\")"],
        "indexes": [
            {"key": "campaign_id_index", "type": "key", "attributes": ["campaign_id"]},
            {"key": "list_id_index", "type": "key", "attributes": ["list_id"]},
            {"key": "email_index", "type": "key", "attributes": ["email"]}
        ],
        "attributes": [
            {"key": "campaign_id", "type": "string", "size": 255, "required": False, "default": ""},
            {"key": "list_id", "type": "string", "size": 255, "required": True},
            {"key": "owner_email", "type": "email", "required": True},
            {"key": "email", "type": "email", "required": True},
            {"key": "name", "type": "string", "size": 255, "required": False, "default": ""},
            {"key": "reason", "type": "string", "size": 500, "required": False, "default": ""},
            {"key": "unsubscribed_at", "type": "datetime", "required": True},
        ]
    },
    # CAMPAIGN TEMPLATES
    {
        "id": "campaign-templates", "name": "campaign-templates",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "owner_email_index", "type": "key", "attributes": ["owner_email"]},
            {"key": "is_public_index", "type": "key", "attributes": ["is_public"]}
        ],
        "attributes": [
            {"key": "owner_email", "type": "email", "required": True},
            {"key": "name", "type": "string", "size": 255, "required": True},
            {"key": "description", "type": "string", "size": 1000, "required": False, "default": ""},
            {"key": "content_json", "type": "string", "size": 100000, "required": True},
            {"key": "content_html", "type": "string", "size": 200000, "required": True},
            {"key": "thumbnail_url", "type": "url", "required": False},
            {"key": "is_public", "type": "boolean", "required": False, "default": False},
            {"key": "created_at", "type": "datetime", "required": True},
            {"key": "updated_at", "type": "datetime", "required": True},
        ]
    },
    # SCHEDULED CAMPAIGNS
    {
        "id": "scheduled-campaigns", "name": "scheduled-campaigns",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "campaign_id_index", "type": "key", "attributes": ["campaign_id"]},
            {"key": "scheduled_at_index", "type": "key", "attributes": ["scheduled_at"]},
            {"key": "status_index", "type": "key", "attributes": ["status"]}
        ],
        "attributes": [
            {"key": "campaign_id", "type": "string", "size": 255, "required": True},
            {"key": "owner_email", "type": "email", "required": True},
            {"key": "scheduled_at", "type": "datetime", "required": True},
            {"key": "status", "type": "enum", "elements": ["pending", "processing", "completed", "failed", "cancelled"], "required": False, "default": "pending"},
            {"key": "created_at", "type": "datetime", "required": True},
            {"key": "processed_at", "type": "datetime", "required": False},
        ]
    },
    # CAMPAIGN ANALYTICS
    {
        "id": "campaign-analytics", "name": "campaign-analytics",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "campaign_id_index", "type": "unique", "attributes": ["campaign_id"]}
        ],
        "attributes": [
            {"key": "campaign_id", "type": "string", "size": 255, "required": True},
            {"key": "total_recipients", "type": "integer", "required": False, "default": 0},
            {"key": "sent_count", "type": "integer", "required": False, "default": 0},
            {"key": "delivered_count", "type": "integer", "required": False, "default": 0},
            {"key": "opened_count", "type": "integer", "required": False, "default": 0},
            {"key": "unique_opens", "type": "integer", "required": False, "default": 0},
            {"key": "clicked_count", "type": "integer", "required": False, "default": 0},
            {"key": "unique_clicks", "type": "integer", "required": False, "default": 0},
            {"key": "bounced_count", "type": "integer", "required": False, "default": 0},
            {"key": "unsubscribed_count", "type": "integer", "required": False, "default": 0},
            {"key": "open_rate", "type": "float", "required": False, "default": 0},
            {"key": "click_rate", "type": "float", "required": False, "default": 0},
            {"key": "bounce_rate", "type": "float", "required": False, "default": 0},
            {"key": "last_updated", "type": "datetime", "required": True},
        ]
    },
    # ========================================================================
    # EVENT REMINDERS (used by newsletter microservice)
    # ========================================================================
    {
        "id": "event-reminders", "name": "event-reminders",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "event_id_index", "type": "key", "attributes": ["event_id"]},
            {"key": "status_index", "type": "key", "attributes": ["status"]},
            {"key": "remind_at_index", "type": "key", "attributes": ["remind_at"]},
            {"key": "created_by_index", "type": "key", "attributes": ["created_by"]}
        ],
        "attributes": [
            {"key": "event_id", "type": "string", "size": 255, "required": True},
            {"key": "created_by", "type": "email", "required": True},
            {"key": "offset_type", "type": "enum", "elements": ["before_start", "custom"], "required": False, "default": "before_start"},
            {"key": "offset_minutes", "type": "integer", "required": False, "default": 60},
            {"key": "remind_at", "type": "datetime", "required": True},
            {"key": "subject", "type": "string", "size": 500, "required": False},
            {"key": "message", "type": "string", "size": 5000, "required": False},
            {"key": "status", "type": "enum", "elements": ["pending", "processing", "sent", "failed", "cancelled"], "required": False, "default": "pending"},
            {"key": "sent_at", "type": "datetime", "required": False},
            {"key": "sent_count", "type": "integer", "required": False, "default": 0},
            {"key": "failed_count", "type": "integer", "required": False, "default": 0},
        ]
    },
    # ========================================================================
    # ADMIN PANEL COLLECTIONS
    # ========================================================================
    {
        "id": "admin-blog-posts", "name": "admin-blog-posts",
        "permissions": ["read(\"any\")", "write(\"users\")"],
        "indexes": [
            {"key": "slug_index", "type": "unique", "attributes": ["slug"]},
            {"key": "status_index", "type": "key", "attributes": ["status"]},
            {"key": "created_at_index", "type": "key", "attributes": ["created_at"]}
        ],
        "attributes": [
            {"key": "title", "type": "string", "size": 500, "required": True},
            {"key": "slug", "type": "string", "size": 500, "required": True},
            {"key": "content_html", "type": "string", "size": 100000, "required": False, "default": ""},
            {"key": "excerpt", "type": "string", "size": 1000, "required": False, "default": ""},
            {"key": "author", "type": "string", "size": 255, "required": False, "default": "Admin"},
            {"key": "status", "type": "enum", "elements": ["draft", "published"], "required": False, "default": "draft"},
            {"key": "featured_image", "type": "url", "required": False},
            {"key": "tags", "type": "string", "size": 255, "required": False, "array": True},
            {"key": "created_at", "type": "datetime", "required": True},
            {"key": "updated_at", "type": "datetime", "required": True},
            {"key": "published_at", "type": "datetime", "required": False},
        ]
    },
    {
        "id": "admin-media", "name": "admin-media",
        "permissions": ["read(\"any\")", "write(\"users\")"],
        "indexes": [
            {"key": "created_at_index", "type": "key", "attributes": ["created_at"]}
        ],
        "attributes": [
            {"key": "file_id", "type": "string", "size": 255, "required": True},
            {"key": "url", "type": "url", "required": True},
            {"key": "alt_text", "type": "string", "size": 500, "required": False, "default": ""},
            {"key": "uploaded_by", "type": "string", "size": 255, "required": False, "default": "admin"},
            {"key": "file_size", "type": "integer", "required": False, "default": 0},
            {"key": "mime_type", "type": "string", "size": 100, "required": False, "default": "image/png"},
            {"key": "created_at", "type": "datetime", "required": True},
        ]
    },
    {
        "id": "admin-videos", "name": "admin-videos",
        "permissions": ["read(\"any\")", "write(\"users\")"],
        "indexes": [
            {"key": "created_at_index", "type": "key", "attributes": ["created_at"]}
        ],
        "attributes": [
            {"key": "title", "type": "string", "size": 500, "required": True},
            {"key": "youtube_url", "type": "url", "required": True},
            {"key": "description", "type": "string", "size": 2000, "required": False, "default": ""},
            {"key": "thumbnail_url", "type": "url", "required": False},
            {"key": "added_by", "type": "string", "size": 255, "required": False, "default": "admin"},
            {"key": "created_at", "type": "datetime", "required": True},
        ]
    },
    {
        "id": "admin-expenses", "name": "admin-expenses",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "created_at_index", "type": "key", "attributes": ["created_at"]}
        ],
        "attributes": [
            {"key": "name", "type": "string", "size": 255, "required": True},
            {"key": "cost", "type": "float", "required": True},
            {"key": "frequency", "type": "enum", "elements": ["monthly", "yearly", "one-time"], "required": False, "default": "monthly"},
            {"key": "category", "type": "string", "size": 255, "required": False, "default": ""},
            {"key": "notes", "type": "string", "size": 1000, "required": False, "default": ""},
            {"key": "created_at", "type": "datetime", "required": True},
        ]
    },
    {
        "id": "admin-ban-reports", "name": "admin-ban-reports",
        "permissions": ["read(\"users\")", "write(\"users\")"],
        "indexes": [
            {"key": "status_index", "type": "key", "attributes": ["status"]},
            {"key": "created_at_index", "type": "key", "attributes": ["created_at"]}
        ],
        "attributes": [
            {"key": "user_email", "type": "email", "required": True},
            {"key": "user_id", "type": "string", "size": 255, "required": True},
            {"key": "reason", "type": "string", "size": 2000, "required": True},
            {"key": "evidence", "type": "string", "size": 5000, "required": False, "default": ""},
            {"key": "auto_generated", "type": "boolean", "required": False, "default": True},
            {"key": "status", "type": "enum", "elements": ["pending", "confirmed", "reversed"], "required": False, "default": "pending"},
            {"key": "created_at", "type": "datetime", "required": True},
            {"key": "reviewed_at", "type": "datetime", "required": False},
            {"key": "reviewed_by", "type": "string", "size": 255, "required": False, "default": ""},
        ]
    },
]

def setup_appwrite_database():
    """
    Initializes the Appwrite client and sets up the database, collections,
    and attributes based on the defined structures.
    Checks for existence before creating to avoid errors on existing databases.
    """
    # Initialize the Appwrite client
    client = Client()
    (client
     .set_endpoint(APPWRITE_ENDPOINT)
     .set_project(APPWRITE_PROJECT_ID)
     .set_key(APPWRITE_API_KEY)
     )

    databases = Databases(client)
    db_id = DATABASE_INFO["id"]

    # --- 1. Create the Database if it doesn't exist ---
    try:
        databases_list = databases.list()
        db_exists = db_id in [db['$id'] for db in databases_list['databases']]
        if not db_exists:
            databases.create(db_id, DATABASE_INFO["name"])
            print(f"Database '{DATABASE_INFO['name']}' created successfully.")
        else:
            print(f"Database '{DATABASE_INFO['name']}' already exists.")
    except Exception as e:
        print(f"Error checking or creating database: {e}")
        return # Stop if database issues

    # --- 2. Loop Through Collections and Attributes ---
    for collection_def in COLLECTIONS_DEFINITIONS:
        coll_id = collection_def["id"]
        coll_name = collection_def["name"]

        # Create the collection if it doesn't exist, and set/update permissions
        perms = collection_def.get("permissions", [])
        try:
            # Try to get the specific collection first
            try:
                databases.get_collection(db_id, coll_id)
                databases.update_collection(db_id, coll_id, coll_name, permissions=perms)
                print(f"\nCollection '{coll_name}' already exists. Permissions updated.")
            except Exception:
                # Collection doesn't exist, create it
                databases.create_collection(db_id, coll_id, coll_name, permissions=perms)
                print(f"\nCollection '{coll_name}' created successfully.")
        except Exception as e:
            print(f"\nError checking or creating/updating collection '{coll_name}': {e}")
            continue # Skip to the next collection if issues

        # Create attributes for the collection if they don't exist
        try:
            attr_list = databases.list_attributes(db_id, coll_id)
            existing_attr_keys = [a['key'] for a in attr_list['attributes']]
        except Exception as e:
            print(f"  Error listing attributes for '{coll_name}': {e}")
            continue

        for attr in collection_def["attributes"]:
            if attr['key'] in existing_attr_keys:
                print(f"  - Attribute '{attr['key']}' already exists.")
                continue

            try:
                # Use a dictionary to pass keyword arguments dynamically
                params = {
                    "database_id": db_id,
                    "collection_id": coll_id,
                    "key": attr["key"],
                    "required": attr["required"],
                }

                # Add optional parameters
                if attr.get("size"):
                    params["size"] = attr["size"]
                if attr.get("default") is not None:
                    params["default"] = attr["default"]
                if attr.get("array"):
                    params["array"] = attr["array"]
                if attr.get("elements"):
                    params["elements"] = attr["elements"]

                # Call the appropriate SDK method based on the type
                if attr["type"] == "string":
                    databases.create_string_attribute(**params)
                elif attr["type"] == "integer":
                    databases.create_integer_attribute(**params)
                elif attr["type"] == "float":
                    databases.create_float_attribute(**params)
                elif attr["type"] == "boolean":
                    databases.create_boolean_attribute(**params)
                elif attr["type"] == "datetime":
                    databases.create_datetime_attribute(**params)
                elif attr["type"] == "email":
                    databases.create_email_attribute(**params)
                elif attr["type"] == "url":
                    databases.create_url_attribute(**params)
                elif attr["type"] == "enum":
                    databases.create_enum_attribute(**params)

                print(f"  - Attribute '{attr['key']}' created.")
            except Exception as e:
                print(f"  - Error creating attribute '{attr['key']}': {e}")

        # Create indexes for the collection if they don't exist
        try:
            index_list = databases.list_indexes(db_id, coll_id)
            existing_index_keys = [i['key'] for i in index_list['indexes']]
        except Exception as e:
            print(f"  Error listing indexes for '{coll_name}': {e}")
            continue

        for idx in collection_def.get("indexes", []):
            if idx['key'] in existing_index_keys:
                print(f"  - Index '{idx['key']}' already exists.")
                continue

            try:
                databases.create_index(db_id, coll_id, idx['key'], idx['type'], idx['attributes'])
                print(f"  - Index '{idx['key']}' created.")
            except Exception as e:
                print(f"  - Error creating index '{idx['key']}': {e}")


def check_and_fix_attributes():
    """
    Check and fix attribute definitions across all collections.
    Merged from check_attributes.py and fix_attributes.py.
    Ensures enum attributes have all required values and cleans up old fields.
    """
    import time

    client = Client()
    (client
     .set_endpoint(APPWRITE_ENDPOINT)
     .set_project(APPWRITE_PROJECT_ID)
     .set_key(APPWRITE_API_KEY)
     )
    databases = Databases(client)
    db_id = DATABASE_INFO["id"]

    def list_attrs(collection_id):
        """List all attributes for a collection."""
        try:
            result = databases.list_attributes(db_id, collection_id)
            return result['attributes']
        except Exception as e:
            print(f"  Error listing attributes for '{collection_id}': {e}")
            return []

    def fix_enum_attribute(collection_id, attr_key, required_elements, default_val=None):
        """Check and fix an enum attribute to have all required elements."""
        attrs = list_attrs(collection_id)
        attr = next((a for a in attrs if a['key'] == attr_key), None)

        if not attr:
            print(f"  No '{attr_key}' attribute found in {collection_id}")
            return

        current_elements = attr.get('elements', [])
        if set(current_elements) == set(required_elements):
            print(f"  ✅ {collection_id}.{attr_key} already has all required values")
            return

        missing = set(required_elements) - set(current_elements)
        print(f"  ⚠️  {collection_id}.{attr_key} missing values: {missing}")
        print(f"  Deleting and recreating...")

        try:
            databases.delete_attribute(db_id, collection_id, attr_key)
            print(f"  ✅ Deleted old {attr_key}")
            time.sleep(3)

            params = {
                "database_id": db_id,
                "collection_id": collection_id,
                "key": attr_key,
                "elements": required_elements,
                "required": False,
            }
            if default_val is not None:
                params["default"] = default_val
            databases.create_enum_attribute(**params)
            print(f"  ✅ Recreated {attr_key} with elements: {required_elements}")
        except Exception as e:
            print(f"  Error fixing {attr_key}: {e}")

    def delete_old_fields(collection_id, fields):
        """Delete old/deprecated fields from a collection."""
        for field in fields:
            try:
                databases.delete_attribute(db_id, collection_id, field)
                print(f"  ✅ Deleted old field '{field}' from {collection_id}")
                time.sleep(2)
            except Exception as e:
                print(f"  ⚠️  Could not delete '{field}' from {collection_id}: {e}")

    # --- Fix newsletter-recipients status enum ---
    print("\n--- Checking newsletter-recipients status enum ---")
    fix_enum_attribute(
        "newsletter-recipients", "status",
        ["pending", "sent", "failed", "delivered", "opened", "clicked", "bounced", "unsubscribed"],
        "pending"
    )

    # --- Fix newsletter-link-clicks event_type enum ---
    print("\n--- Checking newsletter-link-clicks event_type enum ---")
    fix_enum_attribute(
        "newsletter-link-clicks", "event_type",
        ["opened", "clicked", "bounced", "unsubscribed"]
    )

    print("\n✅ Attribute checks complete.")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        check_and_fix_attributes()
    else:
        setup_appwrite_database()
        print("\n\nRunning attribute checks and fixes...")
        check_and_fix_attributes()
        print("\n✅ Setup complete!")