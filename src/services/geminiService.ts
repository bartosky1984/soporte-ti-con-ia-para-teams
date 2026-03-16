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
    // We include 'latest' aliases as they are often more stable with quotas
    const modelsToTry = mode === ChatMode.THINKING 
      ? ['gemini-pro-latest', 'gemini-2.0-flash', 'gemini-flash-latest']
      : ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-pro-latest'];

    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 [Gemini] Attempting ${modelName}...`);
        const model = genAI.getGenerativeModel({ 
          model: modelName
        });

        const result = await model.generateContent([
          { text: `System: Eres un asistente de soporte IT para Microsoft Teams. Tono profesional y conciso. Contexto: ${contextKnowledge}` },
          { text: message }
        ]);
        
        const response = await result.response;
        const text = response.text();
        console.log(`✅ [Gemini] Success with ${modelName}`);
        return text;
      } catch (error: any) {
        console.warn(`⚠️ [Gemini] Model ${modelName} failed:`, error.message);
        lastError = error;
        // Continue to next model for ALMOST ANY error (404, 400, 429, 500)
        // This is the most resilient approach
        continue;
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