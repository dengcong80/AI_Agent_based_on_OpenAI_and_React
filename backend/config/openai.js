// backend/config/openai.js
const { OpenAI } = require('openai');

// 初始化 OpenAI 客户端（使用 Groq）
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
});

// OpenAI 配置参数
const OPENAI_CONFIG = {
    // 模型配置
    model: process.env.OPENAI_MODEL || 'llama-3.3-70b-versatile',
    fallbackModel: 'llama-3.1-8b-instant',
    
    // 生成参数
    temperature: 0.7,        // 修复：原来拼写错误 temerature
    maxTokens: 2000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0.6,

    // Embedding 配置
    embeddingModel: 'text-embedding-3-small',
    embeddingDimensions: 1536,  // 修复：原来是 embeddingDimension（单数）
    
    // 超时配置
    timeout: 60000, // 60 秒
};

/**
 * 发送聊天完成请求到 Groq
 * @param {Array} messages - 消息对象数组，包含 'role' 和 'content'
 * @param {Object} options - 请求的额外选项
 */
async function sendChatCompletion(messages, options = {}) {
    try {
        const config = {
            model: options.model || OPENAI_CONFIG.model,
            messages: messages,
            temperature: options.temperature ?? OPENAI_CONFIG.temperature,  // 修复拼写
            max_tokens: options.maxTokens || OPENAI_CONFIG.maxTokens,
            top_p: options.topP || OPENAI_CONFIG.topP,
            frequency_penalty: options.frequencyPenalty ?? OPENAI_CONFIG.frequencyPenalty,
            presence_penalty: options.presencePenalty ?? OPENAI_CONFIG.presencePenalty,
            stream: options.stream || false,
        };

        const response = await openai.chat.completions.create(config);

        return {
            success: true,
            message: response.choices[0].message,
            usage: response.usage,
            model: response.model
        };
    } catch (error) {
        console.error('OpenAI Chat Completion Error:', error.message);

        // 降级到备选模型
        if (options.model !== OPENAI_CONFIG.fallbackModel && !options.noFallback) {  // 修复：nofallback -> noFallback
            console.log(`Falling back to model: ${OPENAI_CONFIG.fallbackModel}`);
            return sendChatCompletion(messages, {
                ...options,
                model: OPENAI_CONFIG.fallbackModel,
                noFallback: true  // 修复拼写
            });
        }
        throw new Error(`OpenAI API called failed: ${error.message}`);
    }
}

/**
 * 生成文本的向量嵌入
 * 注意：Groq 不支持 embedding API，使用本地哈希算法
 * @param {String} text - 要生成嵌入的文本
 */
async function createEmbedding(text) {
    try {
        // Groq 不支持 embedding，使用本地算法
        const embedding = generateSimpleEmbedding(text);
        
        return {
            success: true,
            embedding: embedding,  // 修复：返回格式统一为 embedding（单数）
            usage: { total_tokens: Math.ceil(text.length / 4) }
        };
    } catch (error) {
        console.error('OpenAI Embedding Error:', error.message);
        throw new Error(`OpenAI Embedding failed: ${error.message}`);
    }
}

/**
 * 生成简单的确定性嵌入向量
 * 基于文本内容的哈希，相同文本生成相同向量
 */
function generateSimpleEmbedding(text) {
    const dimension = 1536;
    const embedding = new Array(dimension).fill(0);
    
    // 清理文本
    const cleanText = text.toLowerCase().trim();
    
    // 使用多个种子值生成向量的不同部分
    const seeds = [
        hashString(cleanText), // 整体哈希
        hashString(cleanText.substring(0, Math.floor(cleanText.length / 2))), // 前半部分
        hashString(cleanText.substring(Math.floor(cleanText.length / 2))), // 后半部分
        cleanText.length, // 长度
        (cleanText.match(/[a-z]/g) || []).length, // 字母数
    ];
    
    // 生成向量
    for (let i = 0; i < dimension; i++) {
        const seedIndex = i % seeds.length;
        const seed = seeds[seedIndex];
        
        // 使用正弦函数生成伪随机但确定的值
        const angle = (seed + i * 0.1) * Math.PI;
        embedding[i] = Math.sin(angle) * Math.cos(angle * 0.5);
    }
    
    // 归一化向量（使其长度为1）
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    for (let i = 0; i < dimension; i++) {
        embedding[i] = embedding[i] / (norm || 1);
    }
    
    return embedding;
}

/**
 * 字符串哈希函数
 */
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
}

/**
 * 流式生成响应
 * @param {Array} messages - 历史消息
 * @param {Function} onChunk - 处理每个数据块的回调函数
 */
async function streamChatCompletion(messages, onChunk) {
    try {
        const stream = await openai.chat.completions.create({
            model: OPENAI_CONFIG.model,
            messages: messages,
            temperature: OPENAI_CONFIG.temperature,  // 修复拼写
            max_tokens: OPENAI_CONFIG.maxTokens,
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                onChunk(content);
            }
        }
        return { success: true };
    } catch (error) {
        console.error('OpenAI Stream Chat Completion Error:', error.message);
        throw new Error(`OpenAI Stream API call failed: ${error.message}`);
    }
}

/**
 * 估算给定文本的 token 数量
 * @param {Array} messages - 消息数组
 */
function estimateTokens(messages) {
    // 简单估算：英文中 1 token ≈ 4 个字符
    const totalChars = messages.reduce((sum, msg) => {
        return sum + (msg.content?.length || 0);
    }, 0);
    return Math.ceil(totalChars * 0.25);
}

module.exports = {
    openai,
    OPENAI_CONFIG,  // 修复：原来是 OpenAI_CONFIG（下划线）
    sendChatCompletion,
    createEmbedding,
    streamChatCompletion,
    estimateTokens
};