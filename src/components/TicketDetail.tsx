import React, { useState, useEffect, useRef } from 'react';
import { Ticket, TicketComment, User, TicketStatus, UserRole, TicketType, TicketClassification } from '../types';
import { ticketService } from '../services/ticketService';
import { classificationService } from '../services/classificationService';
import { userService } from '../services/userService';
import { supabase } from '../services/supabaseClient';
import { ICONS } from '../constants';

interface TicketDetailProps {
  ticket: Ticket;
  currentUser: User;
  onClose: () => void;
  onStatusChange: (id: number, status: TicketStatus) => void;
  onTicketUpdate?: (ticket: Ticket) => void;
}

const statusColors = {
  [TicketStatus.PENDING]: 'bg-red-100 text-red-800 border-red-200',
  [TicketStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TicketStatus.RESOLVED]: 'bg-green-100 text-green-800 border-green-200',
};

const priorityColors = {
  'Baja': 'bg-gray-100 text-gray-700',
  'Media': 'bg-blue-100 text-blue-700',
  'Alta': 'bg-orange-100 text-orange-700',
  'Crítica': 'bg-purple-100 text-purple-700 border-purple-200',
};

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, currentUser, onClose, onStatusChange, onTicketUpdate }) => {
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'comments' | 'history'>('comments');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [classifications, setClassifications] = useState<TicketClassification[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [assigning, setAssigning] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const canManage = currentUser.role === UserRole.TECHNICIAN || currentUser.role === UserRole.LEAD_TECHNICIAN || currentUser.role === UserRole.ADMIN;
  const canAssign = currentUser.role === UserRole.LEAD_TECHNICIAN || currentUser.role === UserRole.ADMIN;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        loadComments(),
        loadAudits(),
        loadClassifications(),
        loadTechnicians()
      ]);
      setLoading(false);
    };
    fetchData();
  }, [ticket.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments, activeSubTab]);

  const loadComments = async () => {
    const data = await ticketService.getComments(ticket.id);
    setComments(data);
  };

  const loadAudits = async () => {
    const data = await ticketService.getAuditLogs(ticket.id);
    setAudits(data);
  };

  const loadClassifications = async () => {
    if (canManage) {
      const data = await classificationService.getClassifications();
      setClassifications(data);
    }
  };

  const loadTechnicians = async () => {
    if (canAssign) {
      const data = await userService.getTechnicians();
      setTechnicians(data);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const added = await ticketService.addComment(ticket.id, newComment, currentUser);
      setComments(prev => [...prev, added]);
      setNewComment('');
    } catch (error) {
      console.error("Error sending comment:", error);
    } finally {
      setSending(false);
    }
  };

  const handleClassificationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClassificationId = e.target.value;
    const updatedTicket = await ticketService.updateTicketClassification(ticket.id, newClassificationId);
    if (updatedTicket && onTicketUpdate) {
      onTicketUpdate(updatedTicket);
    }
  };

  const handleAssignTechnician = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const techId = e.target.value;
    if (!techId) return;
    
    const selectedTech = technicians.find(t => t.id === techId);
    if (!selectedTech) return;

    setAssigning(true);
    try {
      const updatedTicket = await ticketService.assignTechnician(ticket.id, selectedTech);
      if (updatedTicket && onTicketUpdate) {
        onTicketUpdate(updatedTicket);
        await loadAudits(); // Refresh history
      }
    } catch (error) {
      console.error("Error assigning technician:", error);
    } finally {
      setAssigning(false);
    }
  };

  const handleResolve = () => {
    if (!ticket.classificationId) {
      alert('Por favor, clasifica el ticket antes de resolverlo. Esto es necesario para las estadísticas de salud IT.');
      return;
    }
    onStatusChange(ticket.id, TicketStatus.RESOLVED);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-start bg-gray-50 rounded-t-lg">
        <div className="flex items-start gap-3">
          <button onClick={onClose} className="mt-1 text-gray-500 hover:text-teams-purple">
            <ICONS.ArrowLeft />
          </button>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-mono text-gray-500">#{ticket.id}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${statusColors[ticket.estado]}`}>
                {ticket.estado}
              </span>
            </div>
            <h2 className="font-semibold text-gray-800">{ticket.descripcion}</h2>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">
                Creado por <strong>{ticket.userName}</strong> el {new Date(ticket.fecha).toLocaleString()}
              </span>
              {ticket.prioridad && (
                <span className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase ${priorityColors[ticket.prioridad]}`}>
                  {ticket.prioridad}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-3">
              {/* Assignment Select */}
              {canAssign ? (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <ICONS.User size={12} /> Asignado a:
                  </label>
                  <select
                    value={ticket.technicianId || ''}
                    onChange={handleAssignTechnician}
                    disabled={assigning}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-teams-purple"
                  >
                    <option value="">-- Sin asignar --</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              ) : ticket.technicianName && (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-teams-purple bg-opacity-10 text-teams-purple px-2 py-1 rounded-md flex items-center gap-1.5 font-medium">
                    <ICONS.User size={12} /> Asignado a: <strong>{ticket.technicianName}</strong>
                  </span>
                </div>
              )}

              {/* Classification Dropdown */}
              {canManage && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <ICONS.LayoutGrid size={12} /> Clasificación:
                  </label>
                  <select 
                    value={ticket.classificationId || ''} 
                    onChange={handleClassificationChange}
                    className={`text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-teams-purple ${
                      !ticket.classificationId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sin clasificar</option>
                    {classifications.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {!ticket.classificationId && (
                    <span className="text-[10px] text-red-500 font-medium italic">Requerido para resolver</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        {canManage && (
            <div className="flex space-x-2">
                {ticket.estado !== TicketStatus.RESOLVED && (
                    <button 
                        onClick={handleResolve}
                        className={`text-xs px-3 py-1.5 rounded text-white font-medium transition-colors ${
                          !ticket.classificationId 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                        Resolver Ticket
                    </button>
                )}
                {ticket.estado === TicketStatus.RESOLVED && (
                    <button 
                        onClick={() => onStatusChange(ticket.id, TicketStatus.IN_PROGRESS)}
                        className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300"
                    >
                        Reabrir
                    </button>
                )}
            </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-white">
        <button 
          onClick={() => setActiveSubTab('comments')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeSubTab === 'comments' ? 'border-teams-purple text-teams-purple' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Conversación ({comments.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeSubTab === 'history' ? 'border-teams-purple text-teams-purple' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Historial de Cambios ({audits.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {activeSubTab === 'comments' ? (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-4 text-gray-400">
                <ICONS.Spinner />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">
                No hay comentarios aún. Inicia la conversación.
              </div>
            ) : (
              comments.map(comment => {
                const isMe = comment.userId === currentUser.id;
                const isTech = comment.userRole === UserRole.TECHNICIAN || comment.userRole === UserRole.ADMIN || comment.userRole === UserRole.LEAD_TECHNICIAN;
                
                return (
                  <div key={comment.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 text-sm border ${
                      isMe 
                        ? 'bg-blue-50 border-blue-100 text-blue-900 rounded-br-none' 
                        : isTech 
                            ? 'bg-orange-50 border-orange-100 text-orange-900 rounded-bl-none'
                            : 'bg-gray-100 border-gray-200 text-gray-800 rounded-bl-none'
                    }`}>
                      <div className="flex justify-between items-baseline mb-1 gap-4">
                        <span className="font-semibold text-xs">
                            {comment.userName} {isTech && !isMe && '(Soporte)'}
                        </span>
                        <span className="text-[10px] opacity-60">
                            {new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p>{comment.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={commentsEndRef} />
          </div>
        ) : (
          <div className="space-y-3">
            {audits.map((audit) => (
              <div key={audit.id} className="flex gap-3 bg-white p-3 rounded border border-gray-100 shadow-sm items-start">
                <div className="bg-blue-50 p-1.5 rounded text-blue-600 mt-1">
                  <ICONS.Chart size={14} />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-900">
                    {audit.user_name} cambió el {audit.action === 'STATUS_CHANGE' ? 'estado' : 'detalle'}
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-1">
                    <span className="bg-gray-100 px-1 border rounded">{audit.old_value}</span>
                    <ICONS.ArrowRight size={10} />
                    <span className="bg-blue-50 text-blue-700 px-1 border border-blue-100 rounded font-medium">{audit.new_value}</span>
                  </div>
                  <div className="text-[9px] text-gray-400 mt-1.5">
                    {new Date(audit.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {audits.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No hay cambios registrados todavía.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Input (Only if comments tab) */}
      {activeSubTab === 'comments' && (
        <div className="p-4 border-t border-gray-200 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleSubmitComment} className="flex gap-3 items-end">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un mensaje o nota técnica..."
              className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-teams-purple focus:border-teams-purple outline-none resize-none h-20 transition-all shadow-inner"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || sending}
              className="bg-teams-purple text-white p-3 rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
            >
              {sending ? <ICONS.Spinner className="animate-spin" /> : <ICONS.Send />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};