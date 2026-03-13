import React, { useState, useRef } from 'react';
import { TicketType } from '../types';
import { ICONS } from '../constants';
import { geminiService } from '../services/geminiService';

interface TicketFormProps {
  onSubmit: (data: { tipo: TicketType; descripcion: string }) => Promise<void>;
  onCancel: () => void;
}

export const TicketForm: React.FC<TicketFormProps> = ({ onSubmit, onCancel }) => {
  const [tipo, setTipo] = useState<TicketType>(TicketType.IT);
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ tipo, descripcion });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAiSuggestion('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const analysis = await geminiService.analyzeScreenshot(base64);
          setDescripcion(prev => (prev ? prev + '\n\n' : '') + "[Análisis IA]: " + analysis);
          setAiSuggestion("Captura analizada con éxito. Descripción actualizada.");
        } catch (err) {
          setAiSuggestion("Error al analizar la imagen.");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
    }
  };

  const handleSmartCheck = async () => {
    if (descripcion.length < 5) return;
    setIsAnalyzing(true);
    try {
      const suggestion = await geminiService.analyzeTicket(descripcion);
      setAiSuggestion(suggestion);
    } catch (e) {
      // ignore
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-teams-dark">Crear Nuevo Ticket</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TicketType)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-teams-purple focus:outline-none bg-white text-gray-900"
        >
          {Object.values(TicketType).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
          {isAnalyzing && <span className="ml-2 text-xs text-teams-purple animate-pulse">IA Analizando...</span>}
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          onBlur={handleSmartCheck}
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-teams-purple focus:outline-none bg-white text-gray-900 placeholder-gray-500"
          placeholder="Describe tu problema..."
        />
        {aiSuggestion && (
          <div className="mt-2 p-2 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100 flex items-start">
            <span className="mr-1 mt-0.5"><ICONS.Sparkles /></span>
            <span>{aiSuggestion}</span>
          </div>
        )}
      </div>

      <div className="mb-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="flex items-center text-sm text-teams-purple hover:text-purple-800 transition-colors"
        >
          <span className="mr-1"><ICONS.Image /></span>
          Subir Captura (Análisis IA)
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isAnalyzing}
          className="bg-teams-purple text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center"
        >
          {isSubmitting ? <ICONS.Spinner /> : 'Crear Ticket'}
        </button>
      </div>
    </form>
  );
};