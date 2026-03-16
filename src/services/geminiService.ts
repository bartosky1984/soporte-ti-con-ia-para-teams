import { GoogleGenerativeAI } from "@google/generative-ai";

// Use VITE_ prefix for standard browser access via Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
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
   * Complex reasoning for the support assistant chat
   */
  chatWithSupport: async (
    message: string, 
    _history: any[] = [], 
    contextKnowledge: string = "",
    mode: ChatMode = ChatMode.STANDARD
  ): Promise<string> => {
    if (!apiKey) return "API Key de Gemini no configurada.";
    
    try {
      const systemInstruction = `Eres el Asistente de Soporte IT para Microsoft Teams.
      
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
      `;

      let modelName = 'gemini-1.5-flash';
      if (mode === ChatMode.THINKING || mode === ChatMode.STANDARD) {
        modelName = 'gemini-1.5-pro';
      }

      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemInstruction 
      });

      const result = await model.generateContent(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini chat failed:", error);
      return "Lo siento, encontré un error al procesar tu solicitud con la IA.";
    }
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