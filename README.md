# Plug-It: E-commerce Platform

Plug-It is a modern e-commerce platform built with React for the frontend and Node.js for the backend. It allows users to create and manage online shops, list products, and process orders.

## Project Structure

The project is divided into two main directories:

- `frontend/`: Contains the React application
- `backend/`: Contains the Node.js server

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or later)
- npm (v6 or later)
- MongoDB (v4 or later)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   PORT=5000
   ENCRYPTION_SECRET=your_encryption_secret
   ```

   Replace `your_mongodb_connection_string` with your MongoDB connection string.

4. Generate secret tokens for JWT_SECRET, REFRESH_TOKEN_SECRET, and ENCRYPTION_SECRET:
   - You can use the following command in your terminal to generate random strings:
     ```
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```
   - Run this command three times to generate three different secrets for JWT_SECRET, REFRESH_TOKEN_SECRET, and ENCRYPTION_SECRET.

5. Start the backend server:
   ```
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm start
   ```

## Running the Application

1. Ensure MongoDB is running on your system or that your MONGODB_URI is in your .env file.
2. Start the backend server (from the backend directory):
   ```
   npm start
   ```
3. In a new terminal, start the frontend development server (from the frontend directory):
   ```
   npm start
   ```
4. Open your browser and navigate to `http://localhost:3000` to view the application.

