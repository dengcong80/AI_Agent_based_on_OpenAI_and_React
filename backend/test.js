// backend/test.js
require('dotenv').config();
const { sendChatCompletion, createEmbedding } = require('./config/openai');
const { 
  initializePinecone, 
  upsertDocuments, 
  searchDocuments 
} = require('./config/pinecone');
const { createAgent } = require('./services/agentService');

// 测试数据：AI 和机器学习知识库
const sampleDocuments = [
  {
    id: 'doc_1',
    text: 'GPT (Generative Pre-trained Transformer) 是一种基于 Transformer 架构的大型语言模型。它通过在大量文本数据上进行预训练，学习语言的统计模式和语义关系。',
    metadata: { category: 'AI基础', source: 'knowledge_base' }
  },
  {
    id: 'doc_2',
    text: 'LangChain 是一个用于开发由语言模型驱动的应用程序的框架。它提供了模块化的组件，可以轻松地将大型语言模型集成到应用程序中。',
    metadata: { category: 'AI工具', source: 'knowledge_base' }
  },
  {
    id: 'doc_3',
    text: '向量数据库（Vector Database）是专门用于存储和检索高维向量的数据库。在 AI 应用中，文本、图像等数据会被转换为向量嵌入，然后存储在向量数据库中进行相似度搜索。',
    metadata: { category: 'AI基础设施', source: 'knowledge_base' }
  },
  {
    id: 'doc_4',
    text: 'RAG (Retrieval-Augmented Generation) 是一种结合检索和生成的技术。它先从知识库中检索相关信息，然后将这些信息作为上下文提供给语言模型生成回答。',
    metadata: { category: 'AI技术', source: 'knowledge_base' }
  },
  {
    id: 'doc_5',
    text: 'Fine-tuning（微调）是在预训练模型的基础上，使用特定领域的数据进行进一步训练的过程。这可以使模型更好地适应特定任务。',
    metadata: { category: 'AI技术', source: 'knowledge_base' }
  },
  {
    id: 'doc_6',
    text: 'Prompt Engineering（提示工程）是设计和优化输入提示词的技术，以获得大型语言模型的最佳输出。好的提示可以显著提高模型的性能。',
    metadata: { category: 'AI技术', source: 'knowledge_base' }
  }
];

/**
 * 测试 OpenAI 连接
 */
async function testOpenAI() {
  console.log('\n🧪 测试 OpenAI 连接...');
  try {
    const response = await sendChatCompletion([
      { role: 'user', content: '你好，请简单介绍一下你自己。' }
    ]);
    console.log('✅ OpenAI 连接成功！');
    console.log('📝 响应:', response.message.content.substring(0, 100) + '...');
    console.log('📊 Token 使用:', response.usage);
    return true;
  } catch (error) {
    console.error('❌ OpenAI 连接失败:', error.message);
    return false;
  }
}

/**
 * 测试 Embedding 生成
 */
async function testEmbedding() {
  console.log('\n🧪 测试 Embedding 生成...');
  try {
    const result = await createEmbedding('这是一个测试文本');
    console.log('✅ Embedding 生成成功！');
    console.log('📊 向量维度:', result.embedding.length);
    console.log('📊 Token 使用:', result.usage);
    return true;
  } catch (error) {
    console.error('❌ Embedding 生成失败:', error.message);
    return false;
  }
}

/**
 * 测试 Pinecone 连接
 */
async function testPinecone() {
  console.log('\n🧪 测试 Pinecone 连接...');
  try {
    await initializePinecone();
    console.log('✅ Pinecone 连接成功！');
    return true;
  } catch (error) {
    console.error('❌ Pinecone 连接失败:', error.message);
    return false;
  }
}

/**
 * 初始化并填充知识库
 */
async function setupKnowledgeBase() {
  console.log('\n📚 初始化知识库...');
  try {
    // 确保 Pinecone 已连接
    await initializePinecone();
    
    // 上传示例文档
    console.log('📤 上传示例文档...');
    const result = await upsertDocuments(sampleDocuments);
    console.log(`✅ 成功上传 ${result.count} 个文档`);
    
    return true;
  } catch (error) {
    console.error('❌ 知识库初始化失败:', error.message);
    return false;
  }
}

/**
 * 测试知识库搜索
 */
async function testKnowledgeSearch() {
  console.log('\n🔍 测试知识库搜索...');
  
  const queries = [
    'GPT 是什么？',
    'LangChain 有什么用？',
    '什么是向量数据库？'
  ];

  try {
    for (const query of queries) {
      console.log(`\n查询: "${query}"`);
      const result = await searchDocuments(query, 2);
      
      console.log(`找到 ${result.results.length} 条相关结果:`);
      result.results.forEach((doc, idx) => {
        console.log(`  ${idx + 1}. [相似度: ${(doc.score * 100).toFixed(1)}%] ${doc.text.substring(0, 80)}...`);
      });
    }
    
    console.log('\n✅ 知识库搜索测试成功！');
    return true;
  } catch (error) {
    console.error('❌ 知识库搜索失败:', error.message);
    return false;
  }
}

/**
 * 测试 AI Agent
 */
async function testAgent() {
  console.log('\n🤖 测试 AI Agent...');
  
  try {
    const agent = createAgent('default');
    
    const query = '请解释一下什么是 RAG 技术？';
    console.log(`\n查询: "${query}"`);
    
    const result = await agent.queryWithKnowledge(query, true);
    
    console.log('\n✅ Agent 响应成功！');
    console.log('📝 回答:', result.answer);
    console.log('📚 是否使用知识库:', result.knowledgeUsed ? '是' : '否');
    
    if (result.sources) {
      console.log(`📖 使用了 ${result.sources.length} 个知识来源`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Agent 测试失败:', error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始运行测试套件...');
  console.log('=' .repeat(60));
  
  const results = {
    openai: await testOpenAI(),
    embedding: await testEmbedding(),
    pinecone: await testPinecone(),
    knowledgeSetup: false,
    knowledgeSearch: false,
    agent: false
  };

  // 如果基础测试通过，继续知识库测试
  if (results.openai && results.embedding && results.pinecone) {
    results.knowledgeSetup = await setupKnowledgeBase();
    
    if (results.knowledgeSetup) {
      // 等待索引更新
      console.log('\n⏳ 等待索引更新 (10秒)...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      results.knowledgeSearch = await testKnowledgeSearch();
      results.agent = await testAgent();
    }
  }

  // 输出测试总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果总结:');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ 通过' : '❌ 失败';
    console.log(`${status} - ${test}`);
  });
  
  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  console.log('\n' + '='.repeat(60));
  console.log(`总计: ${passedCount}/${totalCount} 测试通过`);
  console.log('='.repeat(60));
  
  if (passedCount === totalCount) {
    console.log('\n🎉 所有测试通过！系统运行正常。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查配置和日志。');
  }
}

// 执行测试
runAllTests().catch(error => {
  console.error('💥 测试执行出错:', error);
  process.exit(1);
});