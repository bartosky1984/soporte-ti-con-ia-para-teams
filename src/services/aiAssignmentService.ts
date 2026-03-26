import { Ticket, User } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface AssignmentRecommendation {
  recommendedTechnicianId: string;
  reason: string;
}

export const aiAssignmentService = {
  suggestTechnician: async (
    ticket: Ticket, 
    technicians: User[], 
    allPendingTickets: Ticket[]
  ): Promise<AssignmentRecommendation> => {
    if (!API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Calcula la carga de trabajo activa de cada técnico
    const techniciansWithWorkload = technicians.map(tech => {
      const activeWorkload = allPendingTickets.filter(
        t => t.technicianId === tech.id && (t.estado === 'Pendiente' || t.estado === 'En Progreso')
      ).length;

      return {
        id: tech.id,
        name: tech.name,
        specialties: tech.specialties || [],
        activeWorkload
      };
    });

    const payloadContext = {
      ticket: {
        title: ticket.titulo || '',
        description: ticket.descripcion,
        category: ticket.tipo
      },
      technicians: techniciansWithWorkload
    };

    const systemPrompt = `Eres un Analista de Sistemas experto en Mesa de Ayuda. Tu único trabajo es analizar un ticket de soporte técnico y sugerir al mejor técnico disponible para resolverlo. 

CRITERIOS DE ASIGNACIÓN (Por orden de prioridad):
1. **Especialidad:** El técnico debe tener una especialidad que coincida con la naturaleza del problema (ej. "Hardware", "Software", "Redes", "Impresoras", "Accesos"). Si un técnico tiene la especialidad "Todo", puede tomar cualquier ticket, pero prioriza a los especialistas específicos primero.
2. **Carga de Trabajo (Workload):** Entre los técnicos calificados, prioriza a aquel que tenga la *menor* cantidad de tickets activos. Evita sobrecargar a un solo técnico.
3. **Equilibrio:** Si las especialidades no coinciden exactamente, asigna al técnico generalista ("Todo") o al técnico con menos carga disponible.

DEBES RESPONDER ÚNICAMENTE EN FORMATO JSON CON LA SIGUIENTE ESTRUCTURA ESTRICTA, sin texto markdown ni formato adicional:
{
  "recommendedTechnicianId": "ID_DEL_TECNICO_ELEGIDO",
  "reason": "Una breve justificación de 1 o 2 líneas explicando por qué elegiste a este técnico basándote en su especialidad y carga de trabajo."
}`;

    const userPrompt = `A continuación los datos:\n${JSON.stringify(payloadContext, null, 2)}`;

    const fetchWithRetry = async (url: string, options: any, maxRetries = 3): Promise<Response> => {
      let retries = 0;
      while (retries < maxRetries) {
        const response = await fetch(url, options);
        if (response.status === 429) {
          retries++;
          const waitTime = Math.pow(2, retries) * 1000;
          console.warn(`[aiAssignmentService] Error 429. Reintentando en ${waitTime}ms... (${retries}/${maxRetries})`);
          await new Promise(res => setTimeout(res, waitTime));
          continue;
        }
        return response;
      }
      return fetch(url, options);
    };

    try {
      const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) throw new Error('Cuerpo de respuesta IA vacío');

      return JSON.parse(textResponse) as AssignmentRecommendation;
    } catch (error: any) {
      console.error("[aiAssignmentService] Error:", error);
      throw error;
    }
  }
};
