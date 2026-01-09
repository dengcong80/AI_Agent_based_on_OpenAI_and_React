// backend/services/agentService.js
const { sendChatCompletion } = require('../config/openai');
const { searchDocuments } = require('../config/pinecone');

/**
 * AI Agent system prompt
 */
const SYSTEM_PROMPT ={
    default: `你是一个智能AI助手，具有以下能力：
1. 基于提供的知识库回答问题
2. 进行逻辑推理和分析
3. 提供专业、准确的建议
4. 保持友好、专业的对话风格

回答规则：
- 优先使用知识库中的信息
- 如果知识库中没有相关信息，基于常识回答
- 承认不确定性，不编造信息
- 回答要简洁、清晰、有条理`,

  technical: `你是一个技术专家AI助手，擅长：
- 编程和软件开发
- 系统架构设计
- 技术问题诊断和解决
- 代码审查和优化建议

请提供专业、详细的技术指导。`,

  creative: `你是一个创意AI助手，擅长：
- 创意写作和内容创作
- 头脑风暴和创意思维
- 文案和营销建议
- 故事构思和角色设计

请提供富有创意和灵感的建议。`,

  analytical: `你是一个数据分析专家AI助手，擅长：
- 数据分析和解读
- 统计推理
- 商业洞察
- 决策支持

请提供基于数据的深入分析和建议。`
};

/**
 * Agent execute function
 */
class AIAgent{
    constructor(type='default'){
        this.type = type;
        this.systemPrompt = SYSTEM_PROMPT[type] || SYSTEM_PROMPT.default;
        this.conversationHistory = [];
        this.maxHistoryLength = 10; // limit conversation history 
    }

    /**
     * add message to conversation history
     */
    addToHistory(role, content){
        this.conversationHistory.push({ role, content });
        if(this.conversationHistory.length > this.maxHistoryLength*2+1){
            this.conversationHistory.splice(1,2); // remove oldest
        }
    }

    /**
     * get formal history messages
     */
    getMessages(){
        return [
            { role: 'system', content: this.systemPrompt },
            ...this.conversationHistory
        ];
    }


    /**
     * query with knowledge retrieval and generate response
     * 
     */
    async queryWithKnowledge(userQuery, useKnowledgeBase = true){
       try{
          let enhancedQuery = userQuery;
          let knowledgeContext = null;
          // retrieve relevant documents if enabled
            if(useKnowledgeBase){
                try{
                    const searchResult = await searchDocuments(userQuery, 3);
                    if(searchResult.results && searchResult.results.length >0){

                        knowledgeContext = searchResult.results;
                        // format knowledge context
                        const contextText = searchResult.results.map((doc,idx)=>`[document${idx+1}] ${doc.text}`).join('\n\n');
                        enhancedQuery = `基于以下知识回答问题：\n
                        ${contextText}\n
                        用户问题：${userQuery}
                        请基于上述知识库信息回答，如果知识库中没有相关信息，请明确说明。`;
                    }
                }catch(error){
        console.warn('Agent Query Error:', error.message);
       }
    }
    this.addToHistory('user', userQuery);
    // call OpenAI to generate response
    const response = await sendChatCompletion(
        [...this.getMessages()],
        {
            temperature: 0.7,
            maxTokens: 2000
        }
    );
    // add assistant response to history
    this.addToHistory('assistant', response.message.content);
    return {
        success: true,
        answer: response.message.content,
        knowledgeUsed: knowledgeContext !== null,
        sources: knowledgeContext,
        usage: response.usage
    };
    }catch(error){
        console.error('Agent QueryWithKnowledge Error:', error.message);
        throw new Error(`Agent Query failed: ${error.message}`);
    }
  }

  /**
   * multiple steap reasoning
   */
    async multiStepReasoning(task,steps){
        try{
            const results = [];
            let currentContext = task;
            for(let i=0;i<steps.length;i++){
                const step = steps[i];
                const prompt = `任务：${currentContext}\n
                当前步骤：(${i+1}/${steps.length}): ${step.description}\n
                请完成这一步骤并提供结果。`;
            const response = await sendChatCompletion([
                { role: 'system', content: this.systemPrompt },
                { role: 'user', content: prompt }
            ]);
            const stepResult = {
                step: i+1,
                description: step.description,
                result: response.message.content
            };
            results.push(stepResult);
            currentContext = response.message.content;
            
        }

        // generate final summary
        const summaryPrompt = `基于以下多步推理结果，生成最终答案：\n
        ${results.map(r=>`步骤${r.step}: ${r.description}\n结果: ${r.result}`).join('\n\n')}
        请提供综合总结。`;
        
        const finalResponse = await sendChatCompletion([
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: summaryPrompt }
        ]);
        return {
            success: true,
            finalAnswer: finalResponse.message.content,
            steps: results
        };
    } catch(error){
        console.error('Agent MultiStepReasoning Error:', error.message);
        throw new Error(`Agent MultiStepReasoning failed: ${error.message}`);
    }
}

/**
 * reset conversation history
 */
    resetHistory(){
        this.conversationHistory = [];
    }

/**
 * get conversation history
 */
    getHistory(){
        return this.conversationHistory;
    }
}
/**
 * Agent factory method
 * 
 */
function createAgent(type='default'){
    return new AIAgent(type);
}

/**
 * analyse users' intentions
 */
async function analyzeIntent(userQuery){
    try{
        const prompt = `分析以下用户查询的意图，返回JSON格式：\n
        {
        "intent": "question|command|request|conversation",
        "domain": "technical|general|creative|analytical",
        "complexity": "simple|medium|complex",
        "requiredKnowledge": true|false
        }

        用户查询：${userQuery}`;
       
        const response = await sendChatCompletion([
            { role: 'system', content: '你是一个意图分析专家，返回JSON格式的分析结果。' },
            { role: 'user', content: prompt }
        ],{
            temperature: 0.3,
            maxTokens: 200
        });
        try{
            const analysis = JSON.parse(response.message.content);
            return {success:true,analysis};
        } catch(e){
        return {
            success:true,
            analysis: {
                intent: 'question',
                domain: 'general',
                complexity: 'medium',
                requiresKnowledge: true
           }
        };
        }   
    }catch(error){
        console.error('Agent AnalyzeIntent Error:', error.message);
        throw new Error(`Agent AnalyzeIntent failed: ${error.message}`);
    }   
}

module.exports = {
    AIAgent,
    createAgent,
    analyzeIntent,
    SYSTEM_PROMPT
};