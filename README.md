# ClientHub — Premium Client Portal SaaS

ClientHub is a high-fidelity, transactional MERN SaaS portal built for creative agencies and client partnerships. Designed upon the principles of **Architectural Minimalism**, it provides uncompromising transparency, direct billing, secure file vaulting, and real-time communication scopes.

---

## 🏗️ Monorepo Architecture

The repository is structured as a clean monorepo containing decoupled services:

```text
clienthub/
├── client/          # Vite + React 18 frontend with Tailwind v4
└── server/          # Node.js + Express backend with Mongoose & Socket.io
```

---

## ⚡ Key Features

* **Architectural Minimalism UI**: Clean, grid-based aesthetic emphasizing flat, planar layering, 1px structural borders, and generous white space. Built with high-contrast serifs (`Bodoni Moda`) and precise technical sans-serif typography (`Hanken Grotesk`).
* **Real-time Synchronization**: Interactive live timeline updates, real-time message comments, and event dispatches using **Socket.io** integration.
* **Direct Billing & Subscriptions**: Dynamic PDF generation utilizing **PDFKit** and automated transactional checkout flows powered by **Stripe**.
* **AI-Assisted Command Center**: Generates contextual workspace logs and automated invoice insights using the **Google Gemini API**.
* **Secure Deliverables Vault**: Multi-layered, encrypted file hosting powered by **Cloudinary** and custom Express file-upload middlewares.
* **Transactional Mailers**: Automated status dispatches and invoice alerts sent directly using **Resend**.

---

## 🛠️ Technology Stack

### Frontend (`client/`)
* **Core**: React 18, React Router DOM v6
* **Build System**: Vite 5
* **Styling**: Tailwind CSS v4, Geist Fonts, Material Symbols
* **Data Fetching**: TanStack React Query v5, Axios

### Backend (`server/`)
* **Core**: Node.js (ES Modules), Express 4
* **Database**: MongoDB Atlas, Mongoose 8
* **Real-Time**: Socket.io 4
* **Integrations**: Stripe SDK, Resend SDK, Cloudinary SDK, Google Gemini AI SDK
* **Utilities**: PDFKit, Zod (Schema Validation), Express Rate Limit, Helmet

---

## 🚀 Local Development Setup

### 1. Environment Variable Setup
Create a `.env` file in the `server/` directory from the template and paste your credentials:

```env
PORT=5001
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
RESEND_API_KEY=your_resend_api_key
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Start the Backend API
Navigate to the server directory, install dependencies, and run in dev mode:
```bash
cd server
npm install
npm run dev
```
The server will run on `http://localhost:5001` and establish connection to MongoDB.

### 3. Start the Frontend Client
Navigate to the client directory, install dependencies, and run the Vite dev server:
```bash
cd client
npm install
npm run dev
```
The client will launch on `http://localhost:5173`.

### 4. Setup Stripe Webhook Forwarding (Optional)
To test invoice payments locally, forward Stripe events to the server:
```bash
stripe login
stripe listen --forward-to localhost:5001/api/webhooks/stripe
```

---

## 📐 Design Guidelines (DESIGN.md)

* **Planar Layering**: Shadows are prohibited. Structural hierarchy is defined strictly by HSL tonal shifts (Neutral and Tertiary background blocks) and clean `1px border-outline-variant` geometric borders.
* **Color Priority**: High-contrast relationship between deep charcoal (`#000101`) and organic muted sage accents (`#53625c`).
* **Interactive Geometry**: rectangular shapes are strictly prioritized. Pill buttons are disabled; standard rounded boundaries sit at a subtle `0.25rem` radius.
