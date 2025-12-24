const { Pinecone } = require('@pinecone-database/pinecone');

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const chatgptIndex = pc.Index('chat-gpt');

const createMemory = async ({ vectors, metadata, messageId }) => {
  await chatgptIndex.upsert([
    {
      id: messageId.toString(),   // must be string
      values: vectors,            // array of numbers
      metadata                    // flat key-value only
    }
  ]);
};

const queryMemory = async ({ queryVector, limit = 5, metadata }) => {
  const data = await chatgptIndex.query({
    vector: queryVector,
    topK: limit,
    filter: metadata
      ? {
          user: { $eq: metadata.user }   // ✅ CORRECT FILTER
        }
      : undefined,
    includeMetadata: true
  });

  return data.matches;
};

module.exports = {
  createMemory,
  queryMemory
};
