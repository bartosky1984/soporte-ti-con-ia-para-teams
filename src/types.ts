export enum TicketStatus {
  PENDING = 'Pendiente',
  IN_PROGRESS = 'En Progreso',
  RESOLVED = 'Resuelto'
}

export enum TicketType {
  GENERAL = 'Servicios Generales',
  IT = 'Informática'
}

export interface TicketClassification {
  id: string;
  name: string;
}

export interface Ticket {
  id: number;
  userId: string; // ID of the user who created the ticket
  userName: string; // Name of the user
  tipo: TicketType;
  descripcion: string;
  estado: TicketStatus;
  fecha: string;
  classificationId?: string; // ID of the classification criterion
  resolvedAt?: string; // Timestamp when resolved
  firstResponseAt?: string; // Timestamp of first technician response
  prioridad?: 'Baja' | 'Media' | 'Alta' | 'Crítica'; 
  technicianId?: string; // ID of the technician assigned to the ticket
  technicianName?: string; // Name of the technician assigned
  unreadCount?: number; // Calculated property for UI
  hasMessages?: boolean; // Calculated property for UI
  messageCount?: number; // Total messages count
}

export interface ITHealthStats {
  totalTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
  avgResolutionTimeHours: number;
  byClassification: { name: string; count: number }[];
  byType: { name: string; count: number }[];
  topUsersByLackOfTraining: { name: string; count: number }[];
}

export interface TicketComment {
  id: string;
  ticketId: number;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum UserRole {
  USER = 'USER',
  TECHNICIAN = 'TECHNICIAN',
  LEAD_TECHNICIAN = 'LEAD_TECHNICIAN',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Notification {
  id: string;
  userId: string; // Recipient
  ticketId: number;
  message: string;
  read: boolean;
  timestamp: number;
}

export interface FAQ {
  id: string;
  category: 'General' | 'Hardware' | 'Software' | 'Redes';
  question: string;
  answer: string;
}