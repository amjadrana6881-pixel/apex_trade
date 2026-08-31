# 🚀 ApexTrade: Institutional Option Trading & Signals Platform

ApexTrade is a high-probability institutional CFD/Option trading and daily signals platform built with React, Node.js Express, WebSockets, and Netlify Serverless Functions.

## 🌟 Key Features
- **Daily 7:00 PM PST Signals Hub**: Automated 180s duration binary trades with algorithmic verification.
- **Dedicated USDT Treasury**: Withdrawals in USDT (`TRC-20`, `BEP-20`, `ERC-20`) with 1-click saved address and separate withdrawal security password.
- **WhatsApp-Style Live Chat Desk**: Real-time two-way messaging with image/screenshot uploads, seen double-ticks receipts, edit, and delete for everyone/me.
- **2-Step OTP Authentication**: 6-digit OTP email verification and forgot password recovery.
- **Master Admin Control Panel**: 100% full control over users, trade outcomes, balances, deposit verifications, withdrawal approvals, signals, and platform settings.
- **Native Android APK Ready**: Includes complete Capacitor / Gradle configuration.

## 🚀 1-Click Netlify Deployment
1. Connect this repository to **Netlify**.
2. Netlify will auto-detect settings from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
   - **Functions directory**: `netlify/functions`
3. Click **Deploy Site**!

## 💻 Local Development
```bash
# Install dependencies & run backend
cd server && npm install && node server.js

# In another terminal, run frontend
cd client && npm install && npm run dev
```
