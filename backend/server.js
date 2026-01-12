// backend/server.js
require('dotenv').config();

// 验证环境变量是否已解密
console.log('=== 环境变量加载状态 ===')
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY || '❌ 未加载')
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL || '❌ 未加载')
console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY || '❌ 未加载')
console.log('PINECONE_INDEX_NAME:', process.env.PINECONE_INDEX_NAME || '❌ 未加载')

// 显示前几个字符（调试用，不要显示完整密钥）
if (process.env.OPENAI_API_KEY) {
  console.log('OPENAI_API_KEY 前10位:', process.env.OPENAI_API_KEY.substring(0, 10) + '...')
}

console.log('========================\n')


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