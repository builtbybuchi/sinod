# Lyperos Python Backend

Secure backend API for handling email, payment, and AI services for the Lyperos event platform.

## 🚀 Features

- **Email Service**: Send registration confirmation emails with QR codes using Resend
- **Payment Service**: Process payments via Squadco (Nigerian Naira)
- **AI Service**: Generate city descriptions and enhance prompts using Google Gemini
- **Security**: API keys stored server-side, CORS protection
- **Documentation**: Auto-generated API docs with FastAPI

## 📋 Prerequisites

- Python 3.11 or higher
- pip (Python package manager)
- Virtual environment (recommended)

## 🛠️ Installation

### Quick Setup (Recommended)

```bash
chmod +x setup.sh
./setup.sh
```

### Manual Setup

1. **Create virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
   ```

## 🔑 Environment Variables

Update `.env` with your actual credentials:

```env
# Resend Email
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=Lyperos Events <noreply@yourdomain.com>

# Squadco Payment
SQUADCO_SECRET_KEY=your_squadco_secret_key
SQUADCO_PUBLIC_KEY=your_squadco_public_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

## 🏃 Running the Server

### Development Mode
```bash
source venv/bin/activate  # Activate virtual environment
uvicorn main:app --reload --port 8001
```

### Production Mode
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
```

### Using Docker
```bash
docker build -t lyperos-backend .
docker run -p 8001:8001 --env-file .env lyperos-backend
```

## 📚 API Documentation

Once the server is running, visit:

- **Interactive Docs**: http://localhost:8001/docs
- **Alternative Docs**: http://localhost:8001/redoc
- **Health Check**: http://localhost:8001/health

## 🔌 API Endpoints

### Email Service

#### POST `/api/email/send-registration`
Send registration confirmation email with QR code.

**Request Body**:
```json
{
  "to_email": "user@example.com",
  "attendee_name": "John Doe",
  "event_name": "Tech Conference 2024",
  "event_time": "2024-03-15 10:00 AM",
  "event_location": "Lagos Convention Center",
  "registration_id": "REG-ABC123XYZ",
  "event_page_url": "jqt-wm4-cdd"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email sent successfully",
  "email_id": "re_abc123xyz"
}
```

### Payment Service

#### POST `/api/payment/initiate`
Initiate payment with Squadco.

**Request Body**:
```json
{
  "amount": 5000.00,
  "email": "user@example.com",
  "currency": "NGN",
  "attendee_id": "68e7abc123def",
  "event_id": "jqt-wm4-cdd"
}
```

**Response**:
```json
{
  "success": true,
  "checkout_url": "https://checkout.squadco.com/abc123",
  "transaction_ref": "SQCO_TXN_ABC123"
}
```

#### POST `/api/payment/verify`
Verify payment status.

**Request Body**:
```json
{
  "transaction_ref": "SQCO_TXN_ABC123",
  "attendee_id": "68e7abc123def"
}
```

**Response**:
```json
{
  "success": true,
  "paid": true,
  "transaction_status": "success",
  "amount": 5000.00
}
```

### AI Service

#### POST `/api/ai/city-description`
Generate AI-powered city description.

**Request Body**:
```json
{
  "city_name": "Lagos",
  "country": "Nigeria",
  "max_words": 150
}
```

**Response**:
```json
{
  "success": true,
  "description": "Lagos is the largest city in Nigeria..."
}
```

## 🏗️ Project Structure

```
python-backend/
├── main.py                 # FastAPI application
├── config.py              # Configuration management
├── requirements.txt       # Python dependencies
├── Dockerfile            # Container configuration
├── setup.sh             # Setup script
├── .env                 # Environment variables (not in git)
├── .env.example        # Environment template
├── models/             # Pydantic models
│   ├── __init__.py
│   ├── email_models.py
│   ├── payment_models.py
│   └── ai_models.py
├── routes/             # API routes
│   ├── __init__.py
│   ├── email_routes.py
│   ├── payment_routes.py
│   └── ai_routes.py
└── services/          # Business logic
    ├── __init__.py
    ├── email_service.py
    ├── payment_service.py
    └── ai_service.py
```

## 🔒 Security Features

- API keys stored server-side only
- CORS protection configured
- Input validation with Pydantic
- Secure environment variable management
- Request/response logging
- Error handling and sanitization

## 🧪 Testing

Test endpoints using the interactive docs at `/docs` or with curl:

```bash
# Health check
curl http://localhost:8001/health

# Test email service
curl -X POST http://localhost:8001/api/email/send-registration \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "test@example.com",
    "attendee_name": "Test User",
    "event_name": "Test Event",
    "event_time": "2024-03-15 10:00 AM",
    "event_location": "Test Location",
    "registration_id": "REG-TEST123",
    "event_page_url": "test-event"
  }'
```

## 📝 Logging

Logs are output to console with the following format:
```
2024-01-15 10:30:45 - service_name - INFO - Message
```

Adjust log level in `.env`:
```env
LOG_LEVEL=INFO  # Options: DEBUG, INFO, WARNING, ERROR
```

## 🚢 Deployment

### Using Docker

1. Build image:
   ```bash
   docker build -t lyperos-backend .
   ```

2. Run container:
   ```bash
   docker run -d -p 8001:8001 --env-file .env lyperos-backend
   ```

### Manual Deployment

1. Install dependencies on server
2. Configure environment variables
3. Use a process manager like systemd or supervisor
4. Set up reverse proxy (nginx/caddy)
5. Enable HTTPS

Example systemd service (`/etc/systemd/system/lyperos-backend.service`):
```ini
[Unit]
Description=Lyperos Python Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/python-backend
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

## 🤝 Integration with Frontend

See `FRONTEND_INTEGRATION.md` for detailed frontend integration guide.

## 📄 License

Part of the Lyperos event platform.

## 🆘 Support

For issues or questions:
1. Check the API documentation at `/docs`
2. Review logs for error messages
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed

## 🔄 Updates

To update dependencies:
```bash
pip install --upgrade -r requirements.txt
```

## 🌟 Features Coming Soon

- Rate limiting
- API key authentication
- Webhook handlers
- Advanced analytics
- Batch operations
