# Environment Setup Guide

## Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/JituG22/GenStack.git
   cd GenStack
   ```

2. **Setup Backend Environment**
   ```bash
   cd backend
   cp .env.example .env.development
   ```

3. **Configure your environment variables in `.env.development`:**
   ```bash
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/genstack-dev
   MONGODB_TEST_URI=mongodb://localhost:27017/genstack-test

   # JWT Configuration  
   JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
   JWT_EXPIRES_IN=7d

   # Server Configuration
   NODE_ENV=development
   PORT=5000
   FRONTEND_URL=http://localhost:3000,http://localhost:3001,http://localhost:3002

   # Authentication
   BCRYPT_ROUNDS=12

   # GitHub Integration (required for project-GitHub sync)
   GITHUB_TOKEN=your-github-personal-access-token-here
   GITHUB_USERNAME=your-github-username
   GITHUB_ORG=
   GITHUB_ENABLED=true
   ```

4. **Install dependencies and start servers**
   ```bash
   # Backend
   cd backend
   npm install
   npm run dev

   # Frontend (in new terminal)
   cd frontend
   npm install
   npm run dev
   ```

## GitHub Integration Setup

To enable GitHub integration for automatic repository creation:

1. **Create a GitHub Personal Access Token:**
   - Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
   - Generate a new token with full repo permissions
   - Copy the token

2. **Configure environment variables:**
   ```bash
   GITHUB_TOKEN=ghp_your_token_here
   GITHUB_USERNAME=your-github-username
   GITHUB_ENABLED=true
   ```

3. **Test the integration:**
   ```bash
   curl -X GET "http://localhost:5000/api/projects-github/health"
   ```

## Security Notes

- **Never commit `.env.development` or any file containing tokens**
- The `.gitignore` file is configured to exclude all `.env.*` files except `.env.example`
- Always use `.env.example` as a template for new environment files
- Rotate tokens regularly and update your environment files accordingly

## Available Servers

- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:3000  
- **API Documentation**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

## Environment Files

- ✅ `.env.example` - Template file (safe to commit)
- ❌ `.env.development` - Your local config (never commit)
- ❌ `.env.production` - Production config (never commit) 
- ❌ `.env.local` - Local overrides (never commit)
