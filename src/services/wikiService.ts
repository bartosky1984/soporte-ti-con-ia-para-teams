import { FAQ } from '../types';
import { supabase } from './supabaseClient';

const isDbEnabled = import.meta.env.VITE_DB_ENABLED === 'true';

// Static fallback in case DB is down or empty
const STATIC_FAQS: FAQ[] = [
  {
    id: '1',
    category: 'Redes',
    question: '¿Cómo conectarse a la VPN corporativa?',
    answer: 'Para conectarte a la VPN: 1. Abre "Cisco AnyConnect" en tu ordenador. 2. En el campo de dirección, escribe "vpn.empresa.com". 3. Haz clic en conectar. 4. Introduce tus credenciales de dominio (las mismas que usas para iniciar sesión en Windows). 5. Acepta la solicitud de autenticación en tu móvil (MFA).'
  },
  {
    id: '2',
    category: 'Hardware',
    question: 'La impresora no responde o está offline',
    answer: '1. Comprueba que la impresora tenga papel y esté encendida. 2. Verifica si hay luces de error parpadeando. 3. Reinicia la impresora (apágala y espera 10 segundos). 4. Si el problema persiste, verifica si otros compañeros pueden imprimir. Si nadie puede, es un problema de red; abre un ticket.'
  },
  {
    id: '3',
    category: 'Software',
    question: 'Outlook no actualiza los correos',
    answer: 'Si Outlook dice "Desconectado" o "Intentando conectar" en la barra inferior: 1. Verifica tu conexión a Internet. 2. Ve a la pestaña "Enviar y recibir" y asegúrate de que "Trabajar sin conexión" NO esté marcado. 3. Cierra Outlook completamente y vuelve a abrirlo.'
  }
];

export const wikiService = {
  getFaqs: async (): Promise<FAQ[]> => {
    if (isDbEnabled) {
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .order('category');
        
        if (error) throw error;
        if (data && data.length > 0) return data as FAQ[];
      } catch (e) {
        console.error("Supabase getFaqs failed", e);
      }
    }
    return STATIC_FAQS;
  },
  
  getFaqsAsString: async (): Promise<string> => {
    const faqs = await wikiService.getFaqs();
    return faqs.map(f => `P: ${f.question}\nR: ${f.answer}`).join('\n\n');
  }
};