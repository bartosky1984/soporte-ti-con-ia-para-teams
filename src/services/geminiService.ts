import { GoogleGenerativeAI } from "@google/generative-ai";

// Multi-layered variable detection for maximum compatibility (Vercel + Vite)
const getApiKey = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
  }
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
    
    // Priority list of models to try
    const modelsToTry = mode === ChatMode.THINKING 
      ? ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro']
      : ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 Attempting LLM [${modelName}]...`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: `Eres el Asistente de Soporte IT para Microsoft Teams.
          
          CONTEXTO OPERATIVO:
          - Entorno: Producción con persistencia en Supabase.
          - Estado BBDD: Persistencia ACTIVA.
          
          PROTOCOLO DE GESTIÓN DE TICKETS:
          1. Identifica: Usuario, Título del problema y Prioridad.
          2. Confirmación: Informa que el ticket ha sido registrado en el sistema.
          3. ID Real: Los tickets tienen IDs reales asignados por el sistema.
          
          RESTRICCIONES CRÍTICAS:
          - NO solicites credenciales ni datos sensibles.
          - Tono: Conciso, profesional y proactivo.
          
          CONOCIMIENTO DISPONIBLE (FAQs):
          ${contextKnowledge}
          `
        });

        const result = await model.generateContent(message);
        const response = await result.response;
        return response.text();
      } catch (error: any) {
        console.warn(`⚠️ Model ${modelName} failed:`, error.message);
        lastError = error;
        // Continue to next model if 404 (not found) or 400 (unsupported)
        if (error?.message?.includes('404') || error?.message?.includes('400')) {
          continue;
        }
        // If it's a quota error or something else, break and show it
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