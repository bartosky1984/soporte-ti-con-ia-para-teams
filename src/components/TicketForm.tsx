import React, { useState, useRef } from 'react';
import { TicketType } from '../types';
import { ICONS } from '../constants';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';

interface TicketFormProps {
  onSubmit: (data: { tipo: TicketType; descripcion: string; attachmentUrl?: string }) => Promise<void>;
  onCancel: () => void;
}

export const TicketForm: React.FC<TicketFormProps> = ({ onSubmit, onCancel }) => {
  const [tipo, setTipo] = useState<TicketType>(TicketType.IT);
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) return;

    setIsSubmitting(true);
    try {
      let attachmentUrl = undefined;
      if (selectedFile) {
        attachmentUrl = await storageService.uploadFile(selectedFile) || undefined;
      }
      await onSubmit({ tipo, descripcion, attachmentUrl });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-teams-dark">Crear Nuevo Ticket</h2>
      
      <div className="mb-4">
        <label htmlFor="ticket-type" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
        <select
          id="ticket-type"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TicketType)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-teams-purple focus:outline-none bg-white text-gray-900"
          aria-required="true"
        >
          {Object.values(TicketType).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="ticket-description" className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          id="ticket-description"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-teams-purple focus:outline-none bg-white text-gray-900 placeholder-gray-500"
          placeholder="Describe tu problema..."
          aria-required="true"
        />
      </div>

      <div className="mb-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center text-sm text-teams-purple hover:text-purple-800 transition-colors focus:outline-none focus-visible:underline"
          aria-label="Subir captura de pantalla o adjunto"
        >
          <span className="mr-1" aria-hidden="true"><ICONS.Image /></span>
          {selectedFile ? `Archivo: ${selectedFile.name}` : 'Subir Captura / Adjunto'}
        </button>
        {selectedFile && (
          <button 
            type="button" 
            onClick={() => {setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = '';}}
            className="ml-2 text-xs text-red-500 hover:text-red-700"
          >
            Eliminar
          </button>
        )}
        <input
          type="file"
          id="screenshot-upload"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
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
          disabled={isSubmitting}
          className="bg-teams-purple text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center"
        >
          {isSubmitting ? <ICONS.Spinner /> : 'Crear Ticket'}
        </button>
      </div>
    </form>
  );
};