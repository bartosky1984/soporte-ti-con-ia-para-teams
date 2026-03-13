import { TicketClassification } from '../types';

const STORAGE_KEY = 'teams_tickets_classifications';

const DEFAULT_CLASSIFICATIONS: TicketClassification[] = [
  { id: '1', name: 'Problema técnico' },
  { id: '2', name: 'Falta de formación' }
];

export const classificationService = {
  getClassifications: (): TicketClassification[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse classifications", e);
      }
    }
    
    // Initialize with defaults if empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLASSIFICATIONS));
    return DEFAULT_CLASSIFICATIONS;
  },

  addClassification: (name: string): TicketClassification => {
    const classifications = classificationService.getClassifications();
    const newClassification: TicketClassification = {
      id: Date.now().toString(),
      name
    };
    classifications.push(newClassification);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classifications));
    return newClassification;
  },

  updateClassification: (id: string, name: string): TicketClassification | null => {
    const classifications = classificationService.getClassifications();
    const index = classifications.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    classifications[index].name = name;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classifications));
    return classifications[index];
  },

  deleteClassification: (id: string): void => {
    const classifications = classificationService.getClassifications();
    const filtered = classifications.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
};
