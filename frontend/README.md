# Sinod' Frontend

This is the frontend for **Sinod'**, a next-generation event and collaboration platform built with React, TypeScript, and Vite.

## Overview

This application communicates with dedicated backend services for all data operations, including authentication, chat, events, payments, and more. It features a rich user experience with real-time collaboration powered by WebSockets.

## Prerequisites

*   Node.js (v18 or higher recommended)
*   npm or yarn

## 🚀 Getting Started

### 1. Installation

Install the project dependencies:
```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root of the `frontend` directory by copying the example file:
```bash
cp .env.example .env
```

Update the `.env` file with the correct backend URL. For local development, this typically points to the Python backend server.

```env
# URL for the Python backend API
VITE_BACKEND_URL=http://localhost:8001

# Other environment variables if needed
# VITE_APPWRITE_... variables are being phased out but may be needed for legacy features.
```

### 3. Running the Development Server

Start the Vite development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## 🛠️ Build for Production

To create a production build of the app, run:
```bash
npm run build
```

The optimized static files will be generated in the `dist/` directory.
