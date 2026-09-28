# Pravi — Cloud Deployment Guide

This guide walks you through deploying **Pravi (Infrastructure Asset Lifecycle Management)** to production using **Vercel** (Frontend) + **Render** (Backend) + **MongoDB Atlas** (Cloud Database).

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────┐
│     Client (React 19 + Vite)    │  ➔ Hosted on Vercel / Netlify
│   https://pravi.vercel.app      │
└────────────────┬────────────────┘
                 │ API Requests (Bearer Token / Cookie)
                 ▼
┌─────────────────────────────────┐
│     Server (Node.js + Express)  │  ➔ Hosted on Render / Railway
│  https://pravi-api.onrender.com │
└────────────────┬────────────────┘
                 │ Mongoose Connection
                 ▼
┌─────────────────────────────────┐
│       MongoDB Atlas (M0 Free)   │  ➔ Managed Cloud Database
│   mongodb+srv://cluster0...     │
└─────────────────────────────────┘
```

---

## 1️⃣ Step 1: Create Free MongoDB Atlas Database

1. Sign up or log in at **[mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)**.
2. Click **Create a Deployment** ➔ choose **M0 (Free)**.
3. Select a region close to your users (e.g. **AWS Mumbai `ap-south-1`**).
4. Go to **Security ➔ Database Access**:
   - Add new database user (e.g., username `pravi_admin`, choose a strong password).
5. Go to **Security ➔ Network Access**:
   - Click **Add IP Address** ➔ Select **Allow Access from Anywhere (`0.0.0.0/0`)** ➔ Confirm.
6. Go to **Database ➔ Connect ➔ Drivers**:
   - Copy your connection string:
     ```
     mongodb+srv://pravi_admin:<password>@cluster0.xxxxx.mongodb.net/pravi?retryWrites=true&w=majority
     ```
7. *(Optional)* Seed your cloud database with all government assets, divisions, and demo accounts:
   ```bash
   cd server
   $env:MONGO_URI="mongodb+srv://pravi_admin:<password>@cluster0.xxxxx.mongodb.net/pravi?retryWrites=true&w=majority"
   npm run seed
   ```

---

## 2️⃣ Step 2: Deploy Backend to Render (Free Web Service)

1. Push your code to **GitHub**.
2. Log in to **[render.com](https://render.com)**.
3. Click **New + ➔ Web Service**.
4. Connect your GitHub repository.
5. Configure the service settings:
   - **Name**: `pravi-server`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
6. Add the following **Environment Variables** in Render:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production optimizations |
   | `PORT` | `5000` | Server listening port |
   | `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | `generate-a-strong-random-secret-key-32-chars` | Used to sign session tokens |
   | `JWT_EXPIRE` | `7d` | Token lifetime |
   | `JWT_COOKIE_EXPIRE` | `7` | Cookie lifetime in days |
   | `CLIENT_URL` | `https://your-frontend.vercel.app` | (Update after deploying frontend) |
7. Click **Create Web Service**.
8. Once deployed, copy your backend URL:
   `https://pravi-server.onrender.com`

---

## 3️⃣ Step 3: Deploy Frontend to Vercel (Free)

1. Log in to **[vercel.com](https://vercel.com)**.
2. Click **Add New… ➔ Project**.
3. Import your GitHub repository.
4. Configure the project:
   - **Root Directory**: Click edit and select `client`.
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://pravi-server.onrender.com/api` |
6. Click **Deploy**.
7. Once deployed, Vercel will assign a live URL (e.g., `https://pravi-client.vercel.app`).
8. Return to **Render** and update the `CLIENT_URL` variable to your Vercel URL.

---

## 4️⃣ Alternative: Deploy Frontend to Netlify

1. Log in to **[netlify.com](https://netlify.com)**.
2. Click **Add new site ➔ Import an existing project**.
3. Choose your GitHub repo.
4. Settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
5. Under **Environment variables**, add:
   - `VITE_API_URL` = `https://pravi-server.onrender.com/api`
6. Click **Deploy site**.

---

## 👥 Demo Logins for Production Verification

Once deployed, click any of the **Demo Accounts** buttons on the login screen:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| 🛡️ **Super Admin** | `admin@pravi.gov.in` | `Admin@123456` | Full system control & personnel management |
| 👷 **Executive Engr** | `manager@pravi.gov.in` | `Admin@123456` | Asset gate passes, work orders, approval sign-off |
| 🔧 **Technician** | `tech@pravi.gov.in` | `Admin@123456` | Maintenance execution, parts logging, resolutions |
| 👤 **Field Custodian** | `employee@pravi.gov.in` | `Admin@123456` | Issue reporting & breakdown alerts |
