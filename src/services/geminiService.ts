import { GoogleGenerativeAI } from "@google/generative-ai";

// Multi-layered variable detection for maximum compatibility (Vercel + Vite)
const getApiKey = () => {
  console.log("🔍 [Gemini] Detecting API Key...");
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    console.log("✅ [Gemini] API Key found in import.meta.env.VITE_GEMINI_API_KEY");
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env) {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (key) {
      console.log("✅ [Gemini] API Key found in process.env");
      return key;
    }
  }
  console.warn("❌ [Gemini] NO API KEY DETECTED!");
  return '';
};

const apiKey = getApiKey();
const genAI = new GoogleGenerativeAI(apiKey);

export enum ChatMode {
  STANDARD = 'standard',
  FAST = 'fast',
  THINKING = 'thinking',
  SEARCH = 'search'
}

export const geminiService = {
  /**
   * Fast analysis of ticket content to suggest category or quick fixes
   */
  analyzeTicket: async (description: string): Promise<string> => {
    if (!description || description.length < 5 || !apiKey) return "";
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Analiza esta descripción de ticket de soporte y proporciona una sugerencia de causa o categoría muy corta, de 1 oración. Responde en español.
      
      Descripción: ${description}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini analysis failed:", error);
      return "";
    }
  },

  /**
   * Complex reasoning for the support assistant chat with automatic model fallback
   */
  chatWithSupport: async (
    message: string, 
    _history: any[] = [], 
    contextKnowledge: string = "",
    mode: ChatMode = ChatMode.STANDARD
  ): Promise<string> => {
    if (!apiKey) return "API Key de Gemini no configurada.";
    
    // Updated priority list based on REST diagnostic
    const modelsToTry = mode === ChatMode.THINKING 
      ? ['gemini-2.0-flash', 'gemini-pro-latest', 'gemini-flash-latest']
      : ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-pro-latest'];

    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 [Gemini] Attempting ${modelName}...`);
        const model = genAI.getGenerativeModel({ 
          model: modelName
        });

        console.log(`📡 [Gemini] Sending content to ${modelName}...`);
        // Use a simpler request first to verify connectivity
        const result = await model.generateContent([
          { text: `System: Eres un asistente de soporte IT. Contexto: ${contextKnowledge}` },
          { text: message }
        ]);
        
        console.log(`📦 [Gemini] Response received from ${modelName}`);
        const response = await result.response;
        const text = response.text();
        console.log(`💬 [Gemini] Success! Response length: ${text.length}`);
        return text;
      } catch (error: any) {
        console.error(`⚠️ [Gemini] Model ${modelName} failed:`, error);
        lastError = error;
        // Continue to next model if it's a 404/400/500
        if (error?.message?.includes('404') || error?.message?.includes('400') || error?.message?.includes('500')) {
          continue;
        }
        break;
      }
    }

    console.error("❌ All Gemini models failed:", lastError);
    if (lastError?.message?.includes('429') || lastError?.message?.includes('quota')) {
      return "Lo siento, el servicio de IA está saturado en este momento. Por favor, intenta de nuevo en unos segundos.";
    }
    return `Lo siento, encontré un error al procesar tu solicitud con la IA: ${lastError?.message || 'Error desconocido'}`;
  },

  /**
   * Vision capabilities to analyze screenshots
   */
  analyzeScreenshot: async (base64Image: string): Promise<string> => {
    if (!apiKey) return "API Key no configurada.";
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

      const result = await model.generateContent([
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType
          }
        },
        { text: "Analiza esta captura de pantalla de un error técnico. Describe qué sucede y sugiere un título para el ticket. Responde en español." }
      ]);
      
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini vision failed:", error);
      throw error;
    }
  }
};