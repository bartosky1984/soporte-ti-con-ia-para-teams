import React, { useState, useRef, useEffect } from 'react';
import { geminiService, ChatMode } from '../services/geminiService';
import { ticketService } from '../services/ticketService';
import { wikiService } from '../services/wikiService';
import { ICONS } from '../constants';
import { ChatMessage } from '../types';

export const ChatAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>(ChatMode.STANDARD);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: '¡Hola! Soy el Asistente IA de Soporte. Tengo acceso a las incidencias pasadas y a la Wiki. ¿En qué puedo ayudarte?',
      timestamp: Date.now()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // 1. Gather Context (FAQs only for MVP Phase 1)
      const faqs = await wikiService.getFaqsAsString();
      
      const combinedKnowledge = `
      --- PREGUNTAS FRECUENTES (Wiki Tech) ---
      ${faqs}
      `;

      // 2. Send to Gemini with context and selected mode
      const responseText = await geminiService.chatWithSupport(userMsg.text, [], combinedKnowledge, mode);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const modeOptions = [
    { id: ChatMode.STANDARD, label: 'Estándar', icon: <ICONS.Sparkles />, desc: 'Equilibrado' },
    { id: ChatMode.FAST, label: 'Rápido', icon: <ICONS.Bolt />, desc: 'Baja latencia' },
    { id: ChatMode.THINKING, label: 'Pensar', icon: <ICONS.NetworkIntelligence />, desc: 'Razonamiento profundo' },
    { id: ChatMode.SEARCH, label: 'Búsqueda', icon: <ICONS.Google />, desc: 'Datos en tiempo real' }
  ];

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-teams-purple mr-2"><ICONS.Sparkles /></div>
          <h3 className="font-semibold text-gray-700">Asistente IA</h3>
        </div>
        
        <div className="flex bg-white border border-gray-200 rounded-md p-1 space-x-1">
          {modeOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id)}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] transition-all ${
                mode === opt.id 
                  ? 'bg-teams-purple text-white shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              title={opt.desc}
            >
              {opt.icon}
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-teams-purple text-white rounded-br-none' 
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-gray-100 rounded-lg rounded-bl-none p-3 flex items-center space-x-1">
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
               <span className="text-[10px] text-gray-400 ml-2 italic">
                 {mode === ChatMode.THINKING ? 'Razonando profundamente...' : 
                  mode === ChatMode.SEARCH ? 'Buscando en Google...' : 
                  'Procesando...'}
               </span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-100">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              mode === ChatMode.THINKING ? "Haz una pregunta compleja..." :
              mode === ChatMode.SEARCH ? "Busca información externa..." :
              "Escribe tu problema..."
            }
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teams-purple bg-white text-gray-900 placeholder-gray-500"
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="bg-teams-purple text-white p-2 rounded-md hover:bg-opacity-90 disabled:opacity-50"
          >
            <ICONS.Chat />
          </button>
        </div>
      </div>
    </div>
  );
};