// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const fileUploadRoutes=require('./routes/files');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;
app.use(cookieParser());

// Session setup
app.use(session({
    secret: 'your_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'Strict', // Prevents CSRF
    },
}));

// Connect to MongoDB
connectDB();

// Middleware
// CORS Configuration
app.use(cors({
    origin: 'http://localhost:3000', // Change this to your frontend URL
  }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    },
}));

// Routes
app.use('/api/auth', authRoutes);
// Use the file upload routes
app.use('/api/files', fileUploadRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
