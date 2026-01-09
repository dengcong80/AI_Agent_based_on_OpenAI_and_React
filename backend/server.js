// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// load routes
const chatRoutes = require('./routes/chat');
const knowledgeRoutes = require('./routes/knowledge');
const agentRoutes = require('./routes/agent');
const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(helmet());
// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// request body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// request rate limiting: max 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/',limiter);

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/agent', agentRoutes);

// health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
     status: 'OK', message: 'Server is healthy',
     timestamp: new Date().toISOString(),
     environment: process.env.NODE_ENV || 'development'
    });
});

// middleware for handling errors
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  }
 });
});

// 404 handler
app.use((req,res)=>{
  res.status(404).json({ error: 'interface not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API available at http://localhost:${PORT}/api/`);
});

// close the server gracefully
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received: closing http server');
  console.log('Closing http server.');
  server.close(() => {
    console.log('Http server closed.');
    });
});