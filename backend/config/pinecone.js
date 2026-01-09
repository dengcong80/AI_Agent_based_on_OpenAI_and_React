// backend/config/pinecone.js
const { Pinecone } = require('@pinecone-database/pinecone');
const { createEmbedding } = require('./openai');


// Initialize Pinecone client
let pineconeClient = null;
let pineconeIndex = null;

/**
 * initialize Pinecone connection
 */
async function initializePinecone(){
    try{
        if(pineconeClient){
            return pineconeIndex
        }
        pineconeClient = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        const indexName = process.env.PINECONE_INDEX_NAME;

        pineconeIndex = pineconeClient.Index(indexName);
        console.log('Pinecone connects successfully to index:', indexName);
        return pineconeIndex;
    } catch (error) {
        console.error('Pinecone initialization error:', error.message);
        throw new Error(`Pinecone initialization failed: ${error.message}`);
    }

}

/**
 * create and upgrade vector index in Pinecone
 * @param {String} indexName - name of the index
 * @param {Number} dimension - dimension of the vectors
 */
async function createIndex(indexName, dimension=1536){ 
    try {
        const existingIndexes = await pineconeClient.listIndexes();
        // check if index already exists
        const indexExists = existingIndexes.indexes.some(
            index => index.name === indexName
        );

        if (!indexExists) {
            await pineconeClient.createIndex({
                name: indexName,
                dimension: dimension,
                metric: 'cosine',
                spec:{
                    serverless:{
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });
            console.log(`Pinecone index "${indexName}" created successfully.`);

            // Wait for the index to be ready
            await new Promise(resolve => setTimeout(resolve, 10000)); // wait for 10 seconds
        }else{
            console.log(`Index "${indexName}" already exists.`);
        }
        return true;    
    } catch (error) {
        console.error('Error creating Pinecone index:', error.message);
        throw new Error(`Failed to create Pinecone index: ${error.message}`);
    }
}

/**
 * add documents to Pinecone database
 * @param {Array} documents - array of document objects [{id,text,metadata},...]
 * 
 */
async function upsertDocuments(documents){
    try{
        const index = await initializePinecone();
        // batch documents for upsert
        const vectors = [];
        for(const doc of documents){
            const embeddingResult = await createEmbedding(doc.text);
            vectors.push({
                id: doc.id,
                values: embeddingResult.embedding,
                metadata: {
                    text: doc.text,
                    ...doc.metadata
                }
            });
        // upload in batches of 50
            if(vectors.length >=50){
                await index.upsert(vectors);
                vectors.length = 0; // clear the array
            }

        }
        // upload remaining vectors
        if(vectors.length >0){
            await index.upsert(vectors);
    }
        console.log(`Upserted ${documents.length} documents to Pinecone.`);
        return { success: true, count: documents.length };
}catch(error){
        console.error('Pinecone Upsert Error:', error.message);
        throw new Error(`Pinecone Upsert failed: ${error.message}`);
    }   
}   

/**
 * query similar documents from Pinecone
 * @param {String} query - text to query
 * @param {Number} topK - number of top similar documents to retrieve
 * @param {Object} filter - metadata filter for the query
 */
async function searchDocuments(query, topK=5, filter={}){
     try{
        const index = await initializePinecone();
        const embeddingResult = await createEmbedding(query);

        // query Pinecone index
        const searchResults = await index.query({
            vector: embeddingResult.embedding,
            topK: topK,
            filter: Object.keys(filter).length >0 ? filter : undefined,
            includeMetadata: true
        });

        // format results
        const results = searchResults.matches.map(match => ({
            id: match.id,
            score: match.score,
            text: match.metadata.text,
            metadata: match.metadata
        }));
        return {
            success: true,
            results: results,
            query: query
        };
     }catch(error){
        console.error('Pinecone Search Error:', error.message);
        throw new Error(`Pinecone Search failed: ${error.message}`);
     }

}

/**
 * delete documents from Pinecone by IDs
 * @param {Array} ids - array of document IDs to delete
 */
async function deleteDocuments(ids){
    try{
        const index = await initializePinecone();
        await index.deleteMany(ids);
        console.log(`Deleted ${ids.length} documents from Pinecone.`);
        return { success: true, deleteCount: ids.length };
    }catch(error){
        console.error('Pinecone Delete Error:', error.message);
        throw new Error(`Pinecone Delete failed: ${error.message}`);
    }
}
/**
 * get Pinecone index statistics
 */
async function getIndexStats(){
    try{
        const index = await initializePinecone();
        const stats = await index.describeIndexStats();
        return { success: true, stats: stats };
    }catch(error){
        console.error('Pinecone Stats Error:', error.message);
        throw new Error(`Pinecone Stats failed: ${error.message}`);
    }
}

/**
 * clear all documents from Pinecone index
 */
async function clearIndex(){
    try{
        const index = await initializePinecone();
        await index.deleteAll();
        console.log('Cleared all documents from Pinecone index.');
        return { success: true };
    }catch(error){
        console.error('Pinecone Clear Index Error:', error.message);    
        throw new Error(`Pinecone Clear Index failed: ${error.message}`);
    }
}

module.exports = {
    initializePinecone,

    upsertDocuments,
    searchDocuments,
    deleteDocuments,
    getIndexStats,
    clearIndex
};
