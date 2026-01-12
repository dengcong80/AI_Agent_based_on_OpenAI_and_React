import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';


console.log('=== 前端环境变量检查 ===')
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL)
console.log('REACT_APP_NAME:', process.env.REACT_APP_NAME)
console.log('是否以 encrypted: 开头?', 
  process.env.REACT_APP_API_URL?.startsWith('encrypted:') ? '❌ 未解密' : '✅ 已解密'
)
console.log('========================\n')

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);