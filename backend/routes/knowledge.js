// backend/routes/knowledge.js
const express = require('express');
const router = express.Router();
const {
    upsertDocuments,
    searchDocuments,
    deleteDocuments,
    getIndexStats,
    clearIndex
} = require('../config/pinecone');

/**
 * POST /api/knowledge/upload
 * upload documents to knowledge base
 */
router.post('/upload', async (req, res) => {
    try {
        const { documents } = req.body;
        if(!documents || !Array.isArray(documents) || documents.length === 0) {
            return res.status(400).json({ error: 'Invalid documents' });
        }
        // validate each document
        for(const doc of documents) {
            if(!doc.id || !doc.text) {
                return res.status(400).json({ error: 'Each document must have id and text' });
            }
        }

        // upsert documents to Pinecone
        const result = await upsertDocuments(documents);
        res.json({
            success: true,
            message: 'Documents uploaded successfully ${result.count} documents.',
            count:result.count
        });
       }catch (error) {
        console.error('Error uploading documents:', error);
        res.status(500).json({ error: 'Error uploading documents', details: error.message });
    }
});

/**
 * POST /api/knowledge/search
 * search documents in knowledge base
 */
router.post('/search', async (req, res) => {
    try {
        const { query, topK=5,filter ={} } = req.body;
        if(!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        const result = await searchDocuments(query, topK,filter);
        res.json({
            success: true,
            query: result.query,
            results: result.results,
            count: result.results.length
        });
    }catch (error) {
        console.error('Error searching documents:', error);
        res.status(500).json({ error: 'Error searching documents', details: error.message });
    }
});

/**
 * DELETE /api/knowledge/documents
 * delete documents from knowledge base
 * 
 */
router.delete('/documents', async (req, res) => {
    try {
        const { ids } = req.body;
        if(!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'please provide document ids' });
        }

        const result = await deleteDocuments(ids);
        res.json({
            success: true,
            message: `Deleted ${result.deleteCount} documents.`,
            deletedCount: result.deleteCount
        });
    }catch (error) {
        console.error('Error deleting documents:', error);
        res.status(500).json({ error: 'Error deleting documents', details: error.message });
    }
});

/**
 * GET /api/knowledge/stats
 * get index statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const result = await getIndexStats();
        res.json({
            success: true,
            stats: result.stats
        });
    }catch (error) {
        console.error('Error getting index stats:', error);
        res.status(500).json({ error: 'Error getting index stats', details: error.message });
    }   
});

/**
 * DELETE /api/knowledge/clear
 * clear the entire knowledge base
 */
router.delete('/clear', async (req, res) => {
    try {
        const result = await clearIndex();
        res.json({
            success: true,
            message: `Cleared index. ${result.deletedCount} documents deleted.`,
            deletedCount: result.deletedCount
        });
    }catch (error) {
        console.error('Error clearing index:', error);
        res.status(500).json({ error: 'Error clearing index', details: error.message });
    }
});

/**
 * POST /api/knowledge/batch-upload
 * batch upload documents to knowledge base
 */
router.post('/batch-upload', async (req, res) => {
    try {
        const { text,metadata={},chunkSize=1000 } = req.body;
        if(!text) {
            return res.status(400).json({
                 error: 'Text is required for batch upload'
             });
        }
        const chunks= splitTextIntoChunks(text,chunkSize);
        const documents=chunks.map((chunk,index)=>({
            id:`${metadata.source||'doc'}_chunk_${index}_${Date.now()}`,
            text: chunk,
            metadata: {
                 ...metadata,
                chunkIndex: index,
                totalChunks: chunks.length
            }
        }));
        const result = await upsertDocuments(documents);
        res.json({
            success: true,
            message: `Documents have been batched into ${chunks.length} chunks and uploaded successfully. ${result.count} documents.`,
            chunks: chunks.length,
            totalDocuments :result.count
        });
    }catch (error) {
        console.error('Error in batch uploading documents:', error);
        res.status(500).json({ error: 'Error in batch uploading documents', details: error.message });
    }
});

/**
 * split text into chunks of specified size
 */
function splitTextIntoChunks(text,chunkSize=1000) {
    const chunks=[];
    let currentChunk='';

    const sentences = text.match(/[^.!?]+[.!?]+/g)||[text];
    for( const sentence of sentences) {
        if((currentChunk+sentence).length<=chunkSize){
            currentChunk+=sentence;
        }else{
            if(currentChunk){
                chunks.push(currentChunk.trim());
            }
            currentChunk=sentence;
        }
    }
    if(currentChunk){
        chunks.push(currentChunk.trim());
    }
    return chunks;
}

module.exports = router;