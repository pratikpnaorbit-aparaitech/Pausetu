# PashuSetu

PashuSetu is a company-level platform designed to bridge connections and services within the animal farming/husbandry ecosystem.

## Tech Stack
- **Mobile Client**: React Native with Expo
- **Backend API**: Node.js + Express.js
- **Database**: MongoDB (Mongoose ODM)

## Project Structure

```
PashuSetu/
├── backend/          # Node.js & Express server with MongoDB integration
│   ├── config/       # Configuration helper (database connection, etc.)
│   ├── controllers/  # Controllers to handle API request logic
│   ├── middleware/   # Express middleware definitions
│   ├── models/       # Mongoose schemas/models
│   ├── routes/       # API router endpoints
│   ├── services/     # Business logic layer
│   ├── utils/        # Helper functions
│   ├── .env.example  # Template for environment variables
│   ├── server.js     # Entry point for backend server
│   └── package.json  # NPM dependencies & scripts
├── mobile/           # React Native client developed using Expo
│   ├── assets/       # Media assets (images, icons, etc.)
│   ├── App.js        # Entry component of React Native application
│   ├── app.json      # Expo configuration configuration
│   └── package.json  # Expo dependencies & scripts
├── docs/             # Documentation folder
├── .gitignore        # Root gitignore file
└── README.md         # Project documentation (this file)
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/client) app installed on your physical device (optional, for mobile preview)
- [MongoDB](https://www.mongodb.com/) instance (local or Atlas cloud database)

### Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the template environment variables file and configure it:
   ```bash
   cp .env.example .env
   ```
   Modify `.env` to set your custom ports and MongoDB connection string.
4. Run the development server (uses `nodemon` for auto-reloading):
   ```bash
   npm run dev
   ```
5. The API will run at `http://localhost:5000` (or your configured port). You can verify it works by accessing the health check endpoint:
   `http://localhost:5000/api/health`

### Mobile Setup
1. Navigate to the `mobile` folder:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm start
   ```
4. Follow the terminal prompts to open the app on:
   - Expo Go app on your phone (scan the QR code)
   - iOS Simulator (press `i`)
   - Android Emulator (press `a`)
   - Web browser (press `w`)

## Verification
- Root health checks can be validated by ensuring both modules install their respective dependencies and boot successfully.
# Pausetu
