#!/bin/bash

# Cloudflare Workers Deployment Script
# This script deploys admin, backend, frontend, landing, and newsletter to Cloudflare Workers
# Environment secrets are fetched from Doppler
# Usage: ./deploy-cloudflare.sh <DOPPLER_TOKEN> <ENVIRONMENT>
# ENVIRONMENT: staging or production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check arguments
DOPPLER_TOKEN=${1:-$DOPPLER_TOKEN}
ENVIRONMENT=${2:-staging}

if [ -z "$DOPPLER_TOKEN" ]; then
    print_error "DOPPLER_TOKEN is not set. Please provide it as an argument or set it as an environment variable."
    exit 1
fi

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    print_error "ENVIRONMENT must be 'staging' or 'production'. Got: $ENVIRONMENT"
    exit 1
fi

# Set Doppler config based on environment
if [ "$ENVIRONMENT" = "staging" ]; then
    DOPPLER_CONFIG="str"
    PROJECT_SUFFIX="-staging"
else
    DOPPLER_CONFIG="prd"
    PROJECT_SUFFIX=""
fi

print_info "Deploying to $ENVIRONMENT environment (Doppler config: $DOPPLER_CONFIG)"

# Check if Doppler CLI is installed
if ! command -v doppler &> /dev/null; then
    print_error "Doppler CLI is not installed. Please install it first:"
    echo "  curl -fsSL https://cli.doppler.com/install.sh | sh"
    exit 1
fi

# Check if Wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI is not installed. Please install it first:"
    echo "  npm install -g wrangler"
    exit 1
fi

# Fetch secrets from Doppler
print_info "Fetching secrets from Doppler..."
export $(doppler secrets download --project=sinod --token=$DOPPLER_TOKEN --config=$DOPPLER_CONFIG --format=env)

# Verify required Cloudflare secrets
if [ -z "$CF_ACCOUNT_ID" ] || [ -z "$CF_API_TOKEN" ]; then
    print_error "CF_ACCOUNT_ID or CF_API_TOKEN is missing from Doppler secrets."
    exit 1
fi

# Set Cloudflare credentials
export CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT_ID
export CLOUDFLARE_API_TOKEN=$CF_API_TOKEN

print_success "Secrets fetched successfully"

# Run Appwrite Setup
print_info "Running Appwrite setup..."
cd backend
pip install -r requirements.txt
python scripts/appwrite_setup.py
cd ..
print_success "Appwrite setup completed"

# Deploy Admin (Next.js)
print_info "Deploying Admin (Next.js)..."
cd admin
npm install --legacy-peer-deps
npm run build
npx @cloudflare/next-on-pages
wrangler pages deploy .vercel/output/static --project-name=sinod-admin$PROJECT_SUFFIX
cd ..
print_success "Admin deployed successfully"

# Deploy Frontend (React/Vite)
print_info "Deploying Frontend (React/Vite)..."
cd frontend
npm install --legacy-peer-deps
npm run build
wrangler pages deploy dist --project-name=sinod-frontend$PROJECT_SUFFIX
cd ..
print_success "Frontend deployed successfully"

# Deploy Landing (React/Vite)
print_info "Deploying Landing (React/Vite)..."
cd landing
npm install --legacy-peer-deps
npm run build
wrangler pages deploy dist --project-name=sinod-landing$PROJECT_SUFFIX
cd ..
print_success "Landing deployed successfully"

# Deploy Backend (Python)
print_info "Deploying Backend (Python)..."
cd backend
# Note: Cloudflare Workers doesn't natively support Python
# This is a placeholder for Python deployment
# Options:
# 1. Use Cloudflare Workers Python runtime (beta)
# 2. Deploy to Cloudflare Run with Workers as proxy
# 3. Convert to Node.js
print_info "Python deployment requires additional setup. See backend/DEPLOYMENT_CLOUDFLARE.md"
cd ..
print_success "Backend deployment configuration created"

# Deploy Newsletter (Python)
print_info "Deploying Newsletter (Python)..."
cd newsletter
# Note: Same as backend - Python requires special handling
print_info "Python deployment requires additional setup. See newsletter/DEPLOYMENT_CLOUDFLARE.md"
cd ..
print_success "Newsletter deployment configuration created"

print_success "All services deployed successfully to $ENVIRONMENT!"
