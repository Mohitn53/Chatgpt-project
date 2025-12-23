const {Pinecone } = require('@pinecone-database/pinecone')
const pc = new Pinecone({ apiKey:process.env.PINECONE_API_KEY});


const chatgptIndex = pc.Index('chat-gpt')

const createMemory = async({vectors,metadata,messageId})=>{
    await chatgptIndex.upsert([{

    }])
}