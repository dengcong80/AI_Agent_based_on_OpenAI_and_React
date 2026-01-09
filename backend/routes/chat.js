// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const {sendChatCompletion,streamChatCompletion} = require('../config/openai');

// save chat message to database
const sessions = new Map(); // In-memory session storage for demonstration

/**
 * POST /api/chat/message
 * send chat messages
 */
router.post('/message', async (req, res) => {
    try{
        const {message,sessionId,model,temperature} = req.body;
        if(!message){
            return res.status(400).json({error:'Message is required'});
        }

        // get session history
        const currentSessionId = sessionId || `session_${Date.now()}`;
        let history = sessions.get(currentSessionId) || [];
        history.push({role:'user',content:message,timestamp:new Date().toISOString()            
        });
        const messages = history.map(({role,content})=>({role,content}));

        // call OpenAI API
        const response = await sendChatCompletion(messages,
            {model,temperature});

        // save complete response to history
        history.push({
            role:'assistant',
            content:response.message.content,
            timestamp:new Date().toISOString()
        });
        if(history.length > 20){
            history = history.slice(-20);
        }
        sessions.set(currentSessionId,history);

        res.json({
            success:true,
            sessionId:currentSessionId,
            message:response.message.content,
            usage:response.usage,
            model:response.model
        });
    } catch (error) {
        console.error('Error processing chat message:', error);
        res.status(500).json({ error: 'messages send failed',details:error.message });
    }
});

/**
 * POST /api/chat/stream
 * stream chat messages response
 */
router.post('/stream', async (req, res) => {
    try{
    const {message,sessionId} = req.body;
    if(!message){   
        return res.status(400).json({error:'Message is required'});
    } 

    // set SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // get or create session history
    const currentSessionId = sessionId || `session_${Date.now()}`;
    let history = sessions.get(currentSessionId) || [];
    history.push({
        role:'user',content:message,timestamp:new Date().toISOString()
    });
    // prepare messages for OpenAI
    const messages = history.map(({role,content})=>({role,content}));

    let fullResponse = '';

    // stream generated response from OpenAI
    await streamChatCompletion(messages, (chunk) => {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({chunk})} \n\n`);
    });

    // save assistant response to history
    history.push({
        role:'assistant',
        content:fullResponse,
        timestamp:new Date().toISOString()
    });

    if(history.length > 20){
        history = history.slice(-20);
    }
    sessions.set(currentSessionId,history);
    res.write(`data: ${JSON.stringify({done:true,sessionId:currentSessionId })} \n\n`);
    res.end();
    } catch (error) {
        console.error('Stream error :', error)
        res.write(`data: ${JSON.stringify({ error: 'streaming failed',details:error.message })} \n\n`);
        res.end();
    }
});

/**
 * GET /api/chat/history/：sessionId
 * get chat history by sessionId
 */

router.get('/history/:sessionId', (req, res) => {
    try{
    const {sessionId} = req.params;
    const history = sessions.get(sessionId) || [];
    res.json({ 
        success: true, 
        sessionId,
        history 
    });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'get history failed',details:error.message });
    }
});



/**
 * DELETE /api/chat/history/：sessionId
 * delete chat history by sessionId
 */
router.delete('/history/:sessionId', (req, res) => {
    try{
    const {sessionId} = req.params;
    sessions.delete(sessionId);
    res.json({ success: true, message: 'History deleted successfully' });

    }catch (error) {
        console.error('Error deleting chat history:', error);
        res.status(500).json({ error: 'delete history failed',details:error.message });
    }

    });

/**
 * GET /api/chat/sessions
 * get all session IDs
 */
router.get('/sessions', (req, res) => {
    try{
        const sessionList = Array.from(sessions.keys()).map(sessionId => ({
            sessionId,
            messageCount: sessions.get(sessionId).length,
            lastActivity: sessions.get(sessionId).slice(-1)[0]?.timestamp
        }) );
        res.json({ success: true, sessions: sessionList });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'get sessions failed',details:error.message });
    }
});

module.exports = router;