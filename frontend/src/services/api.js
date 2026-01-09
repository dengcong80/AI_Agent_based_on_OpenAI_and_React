// frontend/src/services/api.js
import axios from 'axios';

// API foundation URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout:60000,
    headers:{
        'Content-Type':'application/json'
    }
});

// request interceptor
apiClient.interceptors.request.use(
    (config)=>{
        return config;
    },
    (error)=>{
        return Promise.reject(error);
    }
);

// response interceptor
apiClient.interceptors.response.use(
    (response)=>response.data,
    (error)=>{
        const message = error.response?.data?.error||error.message||'request failed';
        console.error('API Error:',message);
        return Promise.reject(new Error(message));
    }
);


// Chat API
/**
 * send chat messages
 */
export const sendChatMessage = async(message,sessionId,options={})=>{
    return apiClient.post('/chat/message',{
        message,
        sessionId,
        model:options.model,
        temperature:options.temperature
    });
};

/**
 * get history of chatting
 */
export const getChatHistory = async (sessionId)=>{
    return apiClient.get(`/chat/history/${sessionId}`);
};

/**
 * clear history of chat
 * 
 */
export const clearChatHistory = async (sessionId) =>{
  return apiClient.delete(`/chat/history/${sessionId}`);
};

/**
 * get all sessions
 */
export const getAllSessions = async()=>{
    return apiClient.get('/chat/sessions');
};

// Knowledge API
/**
 * upload documents to knowledge base
 * 
 */
export const uploadDocuments= async(documents)=>{
    return apiClient.post('/knowledge/upload',{documents});
};

/**
 * search knowledge base
 */
export const searchKnowledge = async (query, topK=5, filter = {})=>{
    return apiClient.post('/knowledge/search',{query,topK,filter});
};

/**
 * delete documents
 */
export const deleteDocuments = async(ids)=>{
  return apiClient.delete('/knowledge/documents',{data:{ids}});
};

/**
 * get knowledge base stats
 */
export const getKnowledgeStats = async()=>{
    return apiClient.get('/knowledge/stats');
};

/**
 * batch to upload texts
 */
export const batchUploadText = async(text,metadata={},chunkSize=1000)=>{
    return apiClient.post('/knowledge/batch-upload',{
        text,
        metadata,
        chunkSize
    });
};

/**
 * clear knowledge base
 */
export const clearKnowledge = async()=>{
    return apiClient.delete('/knowledge/clear');
};

// Agent API
/**
 * create new Agent
 */
export const createAgent = async(agentType='default')=>{
    return apiClient.post('/agent/create',{agentType});
};

/**
 * Agent search
 */
export const agentQuery = async (query,agentId,options={})=>{
    return apiClient.post('/agent/query',{
        query,
        agentId,
        agentType:options.agentType,
        useKnowledgeBase: options.useKnowledgeBase !== false
    });
};

/**
 * analysis intention
 */
export const analyzeIntent = async(query)=>{
    return apiClient.post('/agent/analyze-intent',{query});
};

/**
 * muti-step reasoning
 */
export const multiStepReasoning = async (task,steps,agentType='analytical')=>{
    return apiClient.post('/agent/multi-step',{
        task,
        steps,
        agentType
    });
};

/**
 * get Agent history
 */
export const getAgentHistory = async(agentId)=>{
    return apiClient.get(`/agent/history/${agentId}`);
};

/**
 * reset or delete Agent
 */
export const deleteAgent = async (agentId,action='reset')=>{
    return apiClient.delete(`/agent/${agentId}`,{
        params:{action}
    });
};

/**
 * get all Agent
 */
export const getAllAgents = async()=>{
    return apiClient.get('/agent/list');
};

// Health Check
export const healthCheck = async ()=>{
    return axios.get(`${API_BASE_URL.replace('/api','')}/health`);
};

export default{
    //chat
    sendChatMessage,
    getChatHistory,
    clearChatHistory,
    getAllSessions,

    // Knowledge
    uploadDocuments,
    searchKnowledge,
    deleteDocuments,
    getKnowledgeStats,
    batchUploadText,
    clearKnowledge,

    // Agent
    createAgent,
    agentQuery,
    analyzeIntent,
    multiStepReasoning,
    getAgentHistory,
    deleteAgent,
    getAllAgents,

    // health
    healthCheck
};

