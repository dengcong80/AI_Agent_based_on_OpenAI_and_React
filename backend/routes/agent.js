// backend/routes/agent.js
const express = require('express');
const router = express.Router();
const { createAgent, analyzeIntent } = require('../services/agentService');

// save Agent Instance
const agents = new Map();

/**
 * POST /api/agent/query
 * use AI Agent process search
 * 
 */
router.post('/query', async(req, res)=>{
    try{
      const{
        query,
        agentId,
        agentType = 'default',
        useKnowledgeBase = true
      } = req.body;
      if(!query){
        return res.status(400).json({
            error:'Search content is required.'
        });
      }
      // get or create Agent
      const currentAgentId = agentId || `agent_${Date.now()}`;
      let agent = agents.get(currentAgentId);
      if(!agent){
        agent = createAgent(agentType);
        agents.set(currentAgentId,agent);
      }

      // execute search
      const result = await agent.queryWithKnowledge(query,useKnowledgeBase);
      res.json({
        success:true,
        agentId:currentAgentId,
        answer: result.answer,
        knowledgeUsed: result.knowledgeUsed,
        sources: result.sources,
        usage: result.usage
      });

    }catch(error){
     console.error('Agent Query Error:',error);
     res.status(500).json({
        error: 'Agent search failed.',
        details: error.message
     });
    }
});

/**
 * POST /api/agent/analyze-intent
 * analyse users' intention
 */
router.post('/analyze-intent', async(req,res)=>{
    try{
     const {query} = req.body;
     if(!query){
        return res.status(400).json({
            error: 'searching content is required'
        });
     }
     const result = await analyzeIntent(query);
     res.json({
        success:true,
        query,
        analysis:result.analysis
     });
    }catch(error){
        console.error('Intent Analysis Error:', error);
        res.status(500).json({
            error:'Intention analysis failed',
            details:error.message
        });
    }
});

/**
 * POST /api/agent/multi-step
 * execute multi-step reasoning task
 */
router.post('/multi-step',async(req,res)=>{
    try{
      const {task,steps,agentType='analytical'}= req.body;
      if(!task||!steps||!Array.isArray(steps)){
        return res.status(400).json({
            error:'please provide arrays of tasks and steps'
        });
      }
      const agent = createAgent(agentType);
      const result = await agent.multiStepReasoning(task,steps);
      res.json({
        success:true,
        task,
        steps:result.steps,
        finalAnswer: result.finalAnswer
      });
    }catch(error){
      console.error('Multi-step Error:',error);
      res.status(500).json({
        error:'multi-step reasoning failed',
        details: error.message
      });
    }
});

/**
 * GET /api/agent/history/:agentId
 * get Agent chat history
 * 
 */
router.get('/history/:agentId',(req,res)=>{
    try{
      const {agentId} = req.params;
      const agent = agents.get(agentId);
      if(!agent){
        return res.status(404).json({
            error:'Agent doesn\'t exist'
        });
      }
      const history = agent.getHistory();
      res.json({
        success:true,
        agentId,
        history
      });
    }catch(error){
      res.status(500).json({
        error:'get history failed',
        details: error.message
      });
    }
});

/**
 * DELETE /api/agent/:agentId
 * reset or delete Agent
 * 
 */
router.delete('/:agentId',(req,res)=>{
    try{
      const {agentId} = req.params;
      const {action = 'reset'} = req.query;
      const agent = agents.get(agentId);
      if(!agent){
        return res.status(404).json({
            error: 'Agent doesn\'t exist'
        });
      }
      if(action === 'reset'){
        agent.resetHistory();
        res.json({
            success:true,
            message: 'Agent history has been reset'
        });
      }else if(action === 'delete'){
        agents.delete(agentId);
        res.json({
            success:true,
            message:'Agent has been deleted'
        });
      }else{
        res.status(400).json({
            error: 'invalid operation type'
        });
      }
    }catch(error){
      res.status(500).json({
        error:'operation failed',
        details: error.message
      });
    }
});

/**
 * POST /api/agent/create
 * create new Agent
 */
router.post('/create', (req,res)=>{
    try{
      const {agentType='default'}= req.body;
      const agentId = `agent_${Date.now()}`;
      const agent = createAgent(agentType);
      agents.set(agentId,agent);
      res.json({
        success:true,
        agentId,
        agentType,
        message:'Agent has been created successfully.'
      });
    }catch(error){
      res.status(500).json({
        error:'Agent has been created failed.',
        details: error.message
      });
    }
});

/**
 * GET /api/agent/list
 * get all active Agent
 */
router.get('/list',(req,res)=>{
    try{
      const agentList = Array.from(agents.entries()).map(([id,agent])=>({
        agentId:id,
        agentType:agent.type,
        historyLength:agent.conversationHistory.length
      }));
      res.json({
        success:true,
        agents:agentList,
        count:agentList.length
      });
    }catch(error){
       res.status(500).json({
        error:'get Agent list failed',
        details:error.message
       });
    }
});

module.exports=router;