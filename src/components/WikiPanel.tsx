import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { wikiService } from '../services/wikiService';
import { FAQ } from '../types';

export const WikiPanel: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const loadFaqs = async () => {
      const data = await wikiService.getFaqs();
      setFaqs(data);
    };
    loadFaqs();
  }, []);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-teams-dark flex items-center">
              <span className="mr-2 text-teams-purple"><ICONS.Book /></span>
              Wiki Tech & FAQ
            </h2>
            <p className="text-sm text-gray-500">
              Base de conocimiento técnico y preguntas frecuentes para resolver problemas comunes.
            </p>
          </div>
          
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <ICONS.Search />
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teams-purple bg-white text-gray-900"
            />
          </div>
        </div>

        {/* Categories / List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No se encontraron resultados para "{searchTerm}"
            </div>
          ) : (
            filteredFaqs.map(faq => (
              <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className={`w-full flex items-center justify-between p-4 text-left transition-colors ${openId === faq.id ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                      {faq.category}
                    </span>
                    <span className="font-medium text-gray-800">{faq.question}</span>
                  </div>
                  <div className={`transform transition-transform duration-200 text-gray-400 ${openId === faq.id ? 'rotate-180' : ''}`}>
                    <ICONS.ChevronDown />
                  </div>
                </button>
                
                {openId === faq.id && (
                  <div className="p-4 pt-0 text-sm text-gray-600 bg-gray-50 border-t border-gray-100">
                    <div className="pt-3 leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};