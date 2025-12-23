const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

const generateContent = async(content)=>{
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: content,
        });
    return response.text
}

module.exports = generateContent