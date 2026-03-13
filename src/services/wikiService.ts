import { FAQ } from '../types';

const FAQS: FAQ[] = [
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
  },
  {
    id: '4',
    category: 'General',
    question: '¿Cómo reservar una sala de reuniones?',
    answer: 'Las reservas se gestionan a través del calendario de Outlook. 1. Crea una "Nueva reunión". 2. En el campo "Ubicación" o mediante el botón "Buscador de salas", selecciona la sala deseada. 3. Si la sala acepta, recibirás un correo de confirmación automática.'
  },
  {
    id: '5',
    category: 'Software',
    question: 'Restablecer contraseña de dominio',
    answer: 'Si has olvidado tu contraseña o ha caducado: 1. Ve a https://password.empresa.com. 2. Selecciona "Restablecer contraseña". 3. Sigue los pasos de verificación de identidad. Nota: Necesitarás tu teléfono móvil registrado.'
  }
];

export const wikiService = {
  getFaqs: (): FAQ[] => {
    return FAQS;
  },
  
  getFaqsAsString: (): string => {
    return FAQS.map(f => `P: ${f.question}\nR: ${f.answer}`).join('\n\n');
  }
};