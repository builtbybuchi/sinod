# Newsletter Service — Deployment Guide

> Deploy the Newsletter Service on a DigitalOcean Droplet using Docker, Nginx, and Let's Encrypt.

---

## Table of Contents

- [Initial Setup](#initial-setup)
  - [1. Create a DigitalOcean Droplet](#1-create-a-digitalocean-droplet)
  - [2. SSH into the Droplet](#2-ssh-into-the-droplet)
  - [3. Install Docker](#3-install-docker)
  - [4. Transfer the Newsletter Service](#4-transfer-the-newsletter-service)
  - [5. Configure Production Environment Variables](#5-configure-production-environment-variables)
  - [6. Build and Run the Docker Container](#6-build-and-run-the-docker-container)
  - [7. Set Up Nginx as a Reverse Proxy](#7-set-up-nginx-as-a-reverse-proxy)
  - [8. Enable HTTPS with Let's Encrypt](#8-enable-https-with-lets-encrypt)
  - [9. Point DNS to the Droplet](#9-point-dns-to-the-droplet)
  - [10. Update the Main Backend Config](#10-update-the-main-backend-config)
  - [11. Verify the Deployment](#11-verify-the-deployment)
- [Deploying Updates](#deploying-updates)
  - [Option A: Manual Deploy via SCP](#option-a-manual-deploy-via-scp)
  - [Option B: Deploy via Git](#option-b-deploy-via-git)
- [Maintenance Commands](#maintenance-commands)
- [Troubleshooting](#troubleshooting)

---

## Initial Setup

### 1. Create a DigitalOcean Droplet

1. Log in to [DigitalOcean](https://cloud.digitalocean.com/).
2. Click **Create → Droplets**.
3. Choose **Ubuntu 22.04 LTS** (or 24.04).
4. Select a plan — **Basic $6/mo (1 GB RAM, 1 vCPU)** is sufficient.
5. Choose a datacenter region close to your users.
6. Add your **SSH key** for authentication.
7. Click **Create Droplet**.

### 2. SSH into the Droplet

```sh
ssh root@YOUR_DROPLET_IP
```

### 3. Install Docker

```sh
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify installation
docker --version
```

### 4. Transfer the Newsletter Service

From your **local machine**, copy the newsletter folder to the droplet:

```sh
scp -r /home/buchi/projects/sinod/newsletter root@YOUR_DROPLET_IP:/opt/newsletter
```

### 5. Configure Production Environment Variables

On the droplet, edit `.env.production` with the correct secrets:

```sh
cd /opt/newsletter
nano .env.production
```

Ensure these values are set correctly:

```env
ENVIRONMENT=production
PORT=8002
SERVICE_SECRET=<your-strong-secret>
MAIN_BACKEND_URL=https://sinod.leapcell.app
NEWSLETTER_SERVICE_URL=https://newsletter.sinod.app
FRONTEND_URL=https://sinod.app
SMTP_HOST=smtpdm-ap-southeast-1.aliyun.com
SMTP_PORT=80
SMTP_USERNAME=no-reply@mail.sinod.app
SMTP_PASSWORD=<your-smtp-password>
EMAIL_NEWSLETTER_SENDER=news@mail.sinod.app
APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=sinod
APPWRITE_API_KEY=<your-appwrite-api-key>
APPWRITE_DATABASE_ID=sinod-db
```

> ⚠️ **Important:** The `SERVICE_SECRET` must match `NEWSLETTER_SERVICE_SECRET` in your main backend's `.env.production`.

### 6. Build and Run the Docker Container

```sh
cd /opt/newsletter

# Build the image
docker build -t sinod-newsletter:latest .

# Run the container
docker run -d \
  --name sinod-newsletter \
  -p 8002:8002 \
  --env-file .env.production \
  --restart unless-stopped \
  sinod-newsletter:latest
```

Verify it's running:

```sh
docker ps
docker logs -f sinod-newsletter
curl http://localhost:8002/health
```

### 7. Set Up Nginx as a Reverse Proxy

Install Nginx:

```sh
apt install nginx -y
```

Create the site config:

```sh
nano /etc/nginx/sites-available/newsletter
```

Paste the following:

```nginx
server {
    listen 80;
    server_name newsletter.sinod.app;

    location / {
        proxy_pass http://127.0.0.1:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Long timeout for campaign sending
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

Enable the site and reload Nginx:

```sh
ln -s /etc/nginx/sites-available/newsletter /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 8. Enable HTTPS with Let's Encrypt

```sh
apt install certbot python3-certbot-nginx -y
certbot --nginx -d newsletter.sinod.app
```

Follow the prompts. Certbot will auto-configure SSL and set up auto-renewal via a cron job.

### 9. Point DNS to the Droplet

In your DNS provider (wherever `sinod.app` is managed), add an **A record**:

| Type | Name         | Value             |
| ---- | ------------ | ----------------- |
| A    | `newsletter` | `YOUR_DROPLET_IP` |

> DNS propagation may take a few minutes.

### 10. Update the Main Backend Config

In your main backend's `.env.production`, ensure the newsletter URL and secret are configured:

```env
NEWSLETTER_SERVICE_URL=https://newsletter.sinod.app
NEWSLETTER_SERVICE_SECRET=<same-secret-from-step-5>
```

### 11. Verify the Deployment

```sh
curl https://newsletter.sinod.app/health
```

Expected response:

```json
{ "status": "healthy", "environment": "production" }
```

---

## Deploying Updates

After making code changes locally, use one of the following methods to deploy.

### Option A: Manual Deploy via SCP

This is the simplest approach — copy updated files and rebuild.

**Step 1: Push your changes to Git (for version control)**

```sh
# On your local machine
cd /home/buchi/projects/sinod
git add newsletter/
git commit -m "newsletter: describe your changes"
git push
```

**Step 2: Copy updated files to the droplet**

```sh
# On your local machine
scp -r /home/buchi/projects/sinod/newsletter/src root@YOUR_DROPLET_IP:/opt/newsletter/src
scp /home/buchi/projects/sinod/newsletter/requirements.txt root@YOUR_DROPLET_IP:/opt/newsletter/requirements.txt
```

> If you changed the `Dockerfile`, copy that too:
>
> ```sh
> scp /home/buchi/projects/sinod/newsletter/Dockerfile root@YOUR_DROPLET_IP:/opt/newsletter/Dockerfile
> ```

**Step 3: Rebuild and restart on the droplet**

```sh
# SSH into the droplet
ssh root@YOUR_DROPLET_IP

cd /opt/newsletter

# Rebuild the Docker image
docker build -t sinod-newsletter:latest .

# Stop and remove the old container
docker stop sinod-newsletter
docker rm sinod-newsletter

# Start the new container
docker run -d \
  --name sinod-newsletter \
  -p 8002:8002 \
  --env-file .env.production \
  --restart unless-stopped \
  sinod-newsletter:latest

# Verify
docker logs -f sinod-newsletter
```

### Option B: Deploy via Git

This approach pulls changes directly from your Git repository on the droplet.

**One-time setup on the droplet:**

```sh
cd /opt
rm -rf newsletter
git clone https://github.com/mconah/sinod.git --sparse --no-checkout sinod-repo
cd sinod-repo
git sparse-checkout set newsletter
git checkout main

# Copy your .env.production into the newsletter folder
cp /root/.env.newsletter.production /opt/sinod-repo/newsletter/.env.production
```

> Save a backup of `.env.production` at `/root/.env.newsletter.production` so it persists across pulls.

**To deploy updates:**

```sh
# On your local machine — push changes
cd /home/buchi/projects/sinod
git add newsletter/
git commit -m "newsletter: describe your changes"
git push

# On the droplet
ssh root@YOUR_DROPLET_IP

cd /opt/sinod-repo
git pull origin main

cd newsletter

# Restore env file (git pull won't overwrite .gitignored files, but just in case)
cp /root/.env.newsletter.production .env.production

# Rebuild and restart
docker build -t sinod-newsletter:latest .
docker stop sinod-newsletter
docker rm sinod-newsletter
docker run -d \
  --name sinod-newsletter \
  -p 8002:8002 \
  --env-file .env.production \
  --restart unless-stopped \
  sinod-newsletter:latest

# Verify
docker logs -f sinod-newsletter
```

### Quick Deploy Script (Optional)

Create a deploy script on the droplet for convenience:

```sh
nano /opt/deploy-newsletter.sh
```

Paste:

```bash
#!/bin/bash
set -e

echo "=== Deploying Newsletter Service ==="

cd /opt/sinod-repo
echo "Pulling latest changes..."
git pull origin main

cd newsletter
cp /root/.env.newsletter.production .env.production

echo "Building Docker image..."
docker build -t sinod-newsletter:latest .

echo "Restarting container..."
docker stop sinod-newsletter 2>/dev/null || true
docker rm sinod-newsletter 2>/dev/null || true
docker run -d \
  --name sinod-newsletter \
  -p 8002:8002 \
  --env-file .env.production \
  --restart unless-stopped \
  sinod-newsletter:latest

echo "Cleaning up old images..."
docker image prune -f

echo "=== Deployment complete ==="
docker ps | grep sinod-newsletter
```

Make it executable:

```sh
chmod +x /opt/deploy-newsletter.sh
```

Now deploying is a single command:

```sh
ssh root@YOUR_DROPLET_IP '/opt/deploy-newsletter.sh'
```

---

## Maintenance Commands

```sh
# View live logs
docker logs -f sinod-newsletter

# Restart the container (without rebuilding)
docker restart sinod-newsletter

# Stop the service
docker stop sinod-newsletter

# Start the service
docker start sinod-newsletter

# Check container resource usage
docker stats sinod-newsletter

# Clean up unused Docker images
docker image prune -f

# Renew SSL certificate (usually auto, but manual if needed)
certbot renew

# Check Nginx status
systemctl status nginx
```

---

## Troubleshooting

| Issue                          | Solution                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------- |
| Container won't start          | Check logs: `docker logs sinod-newsletter`                                   |
| Port 8002 already in use       | Find process: `lsof -i :8002` and kill it, or remove old container           |
| Nginx 502 Bad Gateway          | Ensure the container is running: `docker ps`                                 |
| SSL certificate expired        | Run `certbot renew && systemctl reload nginx`                                |
| Environment variables missing  | Verify `.env.production` exists and is passed via `--env-file`               |
| DNS not resolving              | Check A record in DNS provider; wait for propagation                         |
| Out of disk space              | Run `docker system prune -a` to clean up unused images/containers            |
