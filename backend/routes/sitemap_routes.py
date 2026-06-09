"""
Sitemap generation endpoint.
Dynamically builds an XML sitemap with all static pages and published blog posts.
"""

from fastapi import APIRouter
from fastapi.responses import Response
from datetime import datetime, timezone
import logging

from config import settings

try:
    from appwrite.client import Client
    from appwrite.services.databases import Databases
    from appwrite.query import Query
except ImportError:
    Client = None
    Databases = None
    Query = None

router = APIRouter()
logger = logging.getLogger(__name__)

SITE_URL = "https://sinod.app"

# All static pages with their priority and change frequency
STATIC_PAGES = [
    # Homepage
    {"path": "/", "priority": "1.0", "changefreq": "daily"},

    # Product pages
    {"path": "/events", "priority": "0.8", "changefreq": "weekly"},
    {"path": "/newsletter", "priority": "0.8", "changefreq": "weekly"},
    {"path": "/forms", "priority": "0.8", "changefreq": "weekly"},
    {"path": "/documents", "priority": "0.8", "changefreq": "weekly"},
    {"path": "/quizzes", "priority": "0.8", "changefreq": "weekly"},
    {"path": "/certifications", "priority": "0.8", "changefreq": "weekly"},
    {"path": "/ai-assistant", "priority": "0.8", "changefreq": "weekly"},
    {"path": "/features", "priority": "0.8", "changefreq": "weekly"},
    {"path": "/pricing", "priority": "0.8", "changefreq": "weekly"},

    # Content & community pages
    {"path": "/blog", "priority": "0.6", "changefreq": "daily"},
    {"path": "/news", "priority": "0.6", "changefreq": "daily"},
    {"path": "/contact", "priority": "0.6", "changefreq": "monthly"},
    {"path": "/explore", "priority": "0.6", "changefreq": "weekly"},
    {"path": "/explore/events", "priority": "0.6", "changefreq": "weekly"},
    {"path": "/explore/quizzes", "priority": "0.6", "changefreq": "weekly"},
    {"path": "/leaderboard", "priority": "0.6", "changefreq": "weekly"},
    {"path": "/about", "priority": "0.6", "changefreq": "monthly"},
    {"path": "/careers", "priority": "0.6", "changefreq": "monthly"},
    {"path": "/support", "priority": "0.6", "changefreq": "monthly"},
    {"path": "/faq", "priority": "0.6", "changefreq": "monthly"},
    {"path": "/security", "priority": "0.6", "changefreq": "monthly"},

    # Legal pages
    {"path": "/terms", "priority": "0.3", "changefreq": "yearly"},
    {"path": "/privacy", "priority": "0.3", "changefreq": "yearly"},
    {"path": "/cookies", "priority": "0.3", "changefreq": "yearly"},
    {"path": "/user-agreement", "priority": "0.3", "changefreq": "yearly"},
    {"path": "/buyer-trust", "priority": "0.3", "changefreq": "yearly"},
    {"path": "/best-price", "priority": "0.3", "changefreq": "yearly"},
    {"path": "/unsubscribe", "priority": "0.3", "changefreq": "yearly"},
]


def _build_url_entry(loc: str, lastmod: str, changefreq: str, priority: str) -> str:
    return f"""  <url>
    <loc>{loc}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>"""


def _get_published_blog_posts() -> list:
    """Fetch all published blog posts from Appwrite."""
    if Client is None or Databases is None:
        logger.warning("Appwrite SDK not available, skipping dynamic blog posts in sitemap")
        return []

    try:
        client = Client()
        client.set_endpoint(settings.APPWRITE_ENDPOINT)
        client.set_project(settings.APPWRITE_PROJECT_ID)
        client.set_key(settings.APPWRITE_API_KEY)

        db = Databases(client)
        posts = []
        offset = 0
        limit = 100

        while True:
            response = db.list_documents(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id="admin-blog-posts",
                queries=[
                    Query.equal("status", "published"),
                    Query.order_desc("created_at"),
                    Query.limit(limit),
                    Query.offset(offset),
                ]
            )
            docs = response.get("documents", [])
            posts.extend(docs)
            if len(docs) < limit:
                break
            offset += limit

        return posts
    except Exception as e:
        logger.error(f"Failed to fetch blog posts for sitemap: {e}")
        return []


@router.get("/sitemap.xml", include_in_schema=False)
async def sitemap():
    """Generate a dynamic XML sitemap."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    entries = []

    # Static pages
    for page in STATIC_PAGES:
        entries.append(_build_url_entry(
            loc=f"{SITE_URL}{page['path']}",
            lastmod=today,
            changefreq=page["changefreq"],
            priority=page["priority"],
        ))

    # Dynamic blog posts
    blog_posts = _get_published_blog_posts()
    for post in blog_posts:
        slug = post.get("slug", "")
        if not slug:
            continue
        # Use updated_at or published_at or created_at for lastmod
        lastmod_raw = post.get("updated_at") or post.get("published_at") or post.get("created_at") or today
        try:
            lastmod = datetime.fromisoformat(lastmod_raw.replace("Z", "+00:00")).strftime("%Y-%m-%d")
        except (ValueError, AttributeError):
            lastmod = today

        entries.append(_build_url_entry(
            loc=f"{SITE_URL}/blog/{slug}",
            lastmod=lastmod,
            changefreq="weekly",
            priority="0.7",
        ))

    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(entries)}
</urlset>"""

    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={
            "Cache-Control": "public, max-age=3600",
        },
    )
