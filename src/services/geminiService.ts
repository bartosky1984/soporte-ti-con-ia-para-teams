import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'AIza-placeholder' });

export enum ChatMode {
  STANDARD = 'standard',
  FAST = 'fast',
  THINKING = 'thinking',
  SEARCH = 'search'
}

export const geminiService = {
  /**
   * Fast analysis of ticket content to suggest category or quick fixes
   * Uses Gemini Flash Lite for low latency
   */
  analyzeTicket: async (description: string): Promise<string> => {
    if (!description || description.length < 5) return "";
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: `Analiza esta descripción de ticket de soporte y proporciona una sugerencia de causa o categoría muy corta, de 1 oración. Responde en español.
        
        Descripción: ${description}`,
      });
      return response.text || "";
    } catch (error) {
      console.error("Gemini analysis failed:", error);
      return "";
    }
  },

  /**
   * Complex reasoning for the support assistant chat
   * Uses different models based on the selected mode
   */
  chatWithSupport: async (
    message: string, 
    history: any[] = [], 
    contextKnowledge: string = "",
    mode: ChatMode = ChatMode.STANDARD
  ): Promise<string> => {
    try {
      const systemInstruction = `Eres el Asistente de Soporte IT (Fase 2) para Microsoft Teams.
      
      CONTEXTO OPERATIVO:
      - Entorno: Producción con persistencia en Supabase activa.
      - Estado BBDD: Persistencia ACTIVA (DB_ENABLED=true).
      
      PROTOCOLO DE GESTIÓN DE TICKETS:
      1. Identifica: Usuario, Título del problema y Prioridad.
      2. Confirmación: Informa que el ticket ha sido registrado en el sistema central.
      3. ID Real: Los tickets ahora tienen IDs numéricos reales asignados por la base de datos. Si acabas de crear uno, menciona que su registro es permanente.
      4. Historial: El seguimiento histórico está disponible. Puedes referenciar tickets anteriores si se proporcionan en el contexto.
      
      RESTRICCIONES CRÍTICAS:
      - NO solicites credenciales ni datos sensibles.
      - Tono: Conciso, profesional y proactivo.
      
      CONOCIMIENTO DISPONIBLE (FAQs):
      ${contextKnowledge}
      `;

      let model = 'gemini-3-pro-preview';
      let config: any = { systemInstruction };

      if (mode === ChatMode.FAST) {
        model = 'gemini-3.1-flash-lite-preview';
      } else if (mode === ChatMode.THINKING) {
        model = 'gemini-3.1-pro-preview';
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      } else if (mode === ChatMode.SEARCH) {
        model = 'gemini-3-flash-preview';
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model,
        contents: message,
        config,
      });

      return response.text || "Tengo problemas para conectar con el cerebro de soporte en este momento.";
    } catch (error) {
      console.error("Gemini chat failed:", error);
      return "Lo siento, encontré un error al procesar tu solicitud.";
    }
  },

  /**
   * Vision capabilities to analyze screenshots of errors
   * Uses Gemini Pro Vision
   */
  analyzeScreenshot: async (base64Image: string): Promise<string> => {
    try {
      // Extract mime type if present, default to png
      const match = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = match ? match[1] : 'image/png';
      
      // Remove data URL prefix
      const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64
              }
            },
            {
              text: "Analiza esta captura de pantalla. Si contiene un mensaje de error, extráelo. Describe el problema técnico visto en la imagen adecuado para una descripción de ticket de soporte IT. Responde en español."
            }
          ]
        }
      });
      return response.text || "";
    } catch (error) {
      console.error("Gemini vision failed:", error);
      throw error;
    }
  }
};