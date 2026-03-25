import React, { useState, useEffect, useRef } from 'react';
import { Ticket, TicketComment, User, TicketStatus, UserRole, TicketType, TicketClassification } from '../types';
import { ticketService } from '../services/ticketService';
import { classificationService } from '../services/classificationService';
import { userService } from '../services/userService';
import { supabase } from '../services/supabaseClient';
import { ICONS, PRIORITY_COLORS } from '../constants';
import { storageService } from '../services/storageService';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [estimatedDate, setEstimatedDate] = useState<string>(
    ticket.estimatedResolutionDate ? new Date(ticket.estimatedResolutionDate).toISOString().split('T')[0] : ''
  );
  const [savingDate, setSavingDate] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Subscribe to Realtime comments for this specific ticket
    const unsubscribe = ticketService.subscribeToComments(ticket.id, () => {
      loadComments();
    });

    return () => {
      unsubscribe();
    };
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
    if (!newComment.trim() && !selectedFile) return;
    
    setSending(true);
    try {
      let attachmentUrl = undefined;
      if (selectedFile) {
        setIsUploading(true);
        attachmentUrl = await storageService.uploadFile(selectedFile) || undefined;
        setIsUploading(false);
      }
      
      const added = await ticketService.addComment(ticket.id, newComment, currentUser, attachmentUrl);
      // Removed manual setComments - the Realtime listener already handles updates automatically without duplicates
      setNewComment('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Error sending comment:", error);
    } finally {
      setSending(false);
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleClassificationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClassificationId = e.target.value;
    const updatedTicket = await ticketService.updateTicketClassification(ticket.id, newClassificationId);
    if (updatedTicket && onTicketUpdate) {
      onTicketUpdate(updatedTicket);
    }
  };

  const handleTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as TicketType;
    const updatedTicket = await ticketService.updateTicketType(ticket.id, newType, currentUser, ticket.tipo);
    if (updatedTicket && onTicketUpdate) {
      onTicketUpdate(updatedTicket);
      await loadAudits();
    }
  };

  const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPriority = e.target.value as 'Baja' | 'Media' | 'Alta' | 'Crítica';
    const oldPriority = ticket.prioridad || 'Media';
    if (newPriority === oldPriority) return;
    const updatedTicket = await ticketService.updateTicketPriority(ticket.id, newPriority, currentUser, oldPriority);
    if (updatedTicket && onTicketUpdate) {
      onTicketUpdate(updatedTicket);
      await loadAudits();
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

  const handleSaveEstimatedDate = async () => {
    if (!estimatedDate) return;
    setSavingDate(true);
    try {
      const isoDate = new Date(estimatedDate).toISOString();
      const updated = await ticketService.updateEstimatedResolutionDate(ticket.id, isoDate, currentUser);
      if (updated && onTicketUpdate) {
        onTicketUpdate(updated);
        await loadAudits();
      }
    } catch (e) {
      console.error('Error saving estimated date', e);
    } finally {
      setSavingDate(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-start bg-gray-50 rounded-t-lg">
        <div className="flex items-start gap-3">
            <button 
            onClick={onClose} 
            className="mt-1 text-gray-500 hover:text-teams-purple focus:outline-none focus:ring-2 focus:ring-teams-purple rounded"
            aria-label="Cerrar detalles del ticket y volver a la lista"
          >
            <ICONS.ArrowLeft aria-hidden="true" />
          </button>
          <div className="flex-1">
            {/* SLA Warning Banner - Only for management/technicians */}
            {canManage && ticket.estado !== TicketStatus.RESOLVED && (
              (() => {
                const createdDate = new Date(ticket.fecha).getTime();
                const now = Date.now();
                const diffHours = (now - createdDate) / (1000 * 60 * 60);
                if (diffHours > 24) {
                  return (
                    <div className="mb-2 bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-2 animate-pulse">
                      <ICONS.AlertTriangle size={14} /> EXCESO DE SLA (24h+) - REQUIERE ATENCIÓN INMEDIATA
                    </div>
                  );
                } else if (diffHours > 18) {
                  return (
                    <div className="mb-2 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-2">
                      <ICONS.Clock size={14} /> ADVERTENCIA DE SLA (18h+)
                    </div>
                  );
                }
                return null;
              })()
            )}
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-mono text-gray-500" aria-label={`ID del ticket ${ticket.id}`}>#{ticket.id}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${statusColors[ticket.estado]}`} aria-label={`Estado: ${ticket.estado}`}>
                {ticket.estado}
              </span>
            </div>
            <h2 className="font-semibold text-gray-800">{ticket.descripcion}</h2>
            
            {/* Attachment Preview */}
            {ticket.attachmentUrl && (
              <div className="mt-2">
                <a 
                  href={ticket.attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors group"
                  aria-label="Ver imagen adjunta en tamaño completo"
                >
                  {ticket.attachmentUrl.startsWith('data:image') || ticket.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                    <div className="relative">
                      <img src={ticket.attachmentUrl} alt="Adjunto del ticket" className="h-24 w-auto rounded border shadow-sm object-cover transition-transform group-hover:scale-[1.02]" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded transition-all flex items-center justify-center">
                        <ICONS.ExternalLink size={16} className="text-white opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-teams-purple px-2">
                      <ICONS.Image size={16} /> <span>Ver Adjunto</span>
                    </div>
                  )}
                </a>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">
                Creado por <strong>{ticket.userName}</strong> el {new Date(ticket.fecha).toLocaleString()}
              </span>
              {ticket.prioridad && (
                <span className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase border ${PRIORITY_COLORS[ticket.prioridad as keyof typeof PRIORITY_COLORS] || 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                  {ticket.prioridad}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-3">
              {/* Assignment Select */}
              {canAssign ? (
                <div className="flex items-center gap-2">
                  <label htmlFor="assignee-select" className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <ICONS.User size={12} aria-hidden="true" /> Asignado a:
                  </label>
                  <select
                    id="assignee-select"
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
                  <label htmlFor="classification-select" className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <ICONS.LayoutGrid size={12} aria-hidden="true" /> Clasificación:
                  </label>
                  <select 
                    id="classification-select"
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
                    <span className="text-[10px] text-red-500 font-medium italic" aria-live="assertive">Requerido para resolver</span>
                  )}
                </div>
              )}

              {/* Department Dropdown (Lead Tech / Admin only) */}
              {canAssign && (
                <div className="flex items-center gap-2">
                  <label htmlFor="type-select" className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <ICONS.Shield size={12} aria-hidden="true" /> Rama:
                  </label>
                  <select 
                    id="type-select"
                    value={ticket.tipo} 
                    onChange={handleTypeChange}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-teams-purple font-semibold"
                  >
                    <option value={TicketType.IT}>Informática</option>
                    <option value={TicketType.GENERAL}>Servicios Generales</option>
                  </select>
                </div>
              )}

              {/* Priority Selector (Lead Tech / Admin only) */}
              {canAssign && (
                <div className="flex items-center gap-2">
                  <label htmlFor="priority-select" className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <ICONS.AlertTriangle size={12} aria-hidden="true" /> Prioridad:
                  </label>
                  <select
                    id="priority-select"
                    value={ticket.prioridad || 'Media'}
                    onChange={handlePriorityChange}
                    className={`text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-teams-purple font-bold ${
                      ticket.prioridad === 'Crítica' ? 'border-purple-300 text-purple-700 bg-purple-50' :
                      ticket.prioridad === 'Alta'    ? 'border-orange-300 text-orange-700 bg-orange-50' :
                      ticket.prioridad === 'Baja'    ? 'border-gray-300 text-gray-600' :
                      'border-blue-300 text-blue-700 bg-blue-50'
                    }`}
                    aria-label="Cambiar prioridad del ticket"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              )}

              {/* Estimated Resolution Date - EDITABLE for techs, READ-ONLY for users */}
              {ticket.estado !== TicketStatus.RESOLVED && (
                canManage ? (
                  <div className="flex items-center gap-2">
                    <label htmlFor="estimated-date-input" className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <ICONS.Clock size={12} aria-hidden="true" /> Fecha estimada:
                    </label>
                    <input
                      id="estimated-date-input"
                      type="date"
                      value={estimatedDate}
                      onChange={(e) => setEstimatedDate(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-teams-purple"
                      aria-label="Fecha estimada de resolucíon del ticket"
                    />
                    <button
                      onClick={handleSaveEstimatedDate}
                      disabled={savingDate || !estimatedDate}
                      className="text-xs bg-teams-purple text-white px-2 py-1 rounded hover:bg-opacity-90 disabled:opacity-50 transition-colors"
                      aria-label="Guardar fecha estimada"
                    >
                      {savingDate ? '...' : 'Guardar'}
                    </button>
                  </div>
                ) : ticket.estimatedResolutionDate ? (
                  <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs font-medium" role="status" aria-label={`Fecha estimada de resolución: ${new Date(ticket.estimatedResolutionDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}>
                    <ICONS.Clock size={12} aria-hidden="true" />
                    <span>Est. resolucín: <strong>{new Date(ticket.estimatedResolutionDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                  </div>
                ) : null
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
      <div className="flex border-b border-gray-100 bg-white" role="tablist">
        <button 
          onClick={() => setActiveSubTab('comments')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeSubTab === 'comments' ? 'border-teams-purple text-teams-purple' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          role="tab"
          aria-selected={activeSubTab === 'comments'}
          aria-controls="comments-panel"
        >
          Conversación ({comments.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeSubTab === 'history' ? 'border-teams-purple text-teams-purple' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          role="tab"
          aria-selected={activeSubTab === 'history'}
          aria-controls="history-panel"
        >
          Historial de Cambios ({audits.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {activeSubTab === 'comments' ? (
          <div id="comments-panel" role="tabpanel" aria-label="Conversación del ticket" className="space-y-4" aria-live="polite">
            {loading ? (
              <div className="flex justify-center py-4 text-gray-400">
                <ICONS.Spinner aria-hidden="true" className="animate-spin" />
                <span className="sr-only">Cargando comentarios...</span>
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
                  <div key={comment.id} className={`flex w-full mb-1 ${isMe ? 'justify-end pl-10' : 'justify-start pr-10'}`}>
                    <div className={`relative max-w-full rounded-2xl px-3 py-2 text-sm shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 ${
                      isMe 
                        ? 'bg-[#E7E9FF] text-[#242424] rounded-tr-none border border-[#6264A720]' 
                        : isTech 
                            ? 'bg-[#FEEFD0] text-[#422409] rounded-tl-none border border-orange-200'
                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                    }`}>
                      {/* Tail Decorations */}
                      <div className={`absolute top-0 w-2 h-2 ${
                        isMe 
                          ? '-right-1 bg-[#E7E9FF] border-t border-r border-[#6264A720]' 
                          : '-left-1 bg-inherit border-t border-l border-inherit'
                      } rotate-45 transform origin-center z-0 hidden sm:block`} style={{ top: '6px' }} />

                      <div className="relative z-10">
                        {!isMe && (
                          <div className="flex items-center gap-1 mb-1">
                            <span className={`font-bold text-[10px] uppercase tracking-wider ${isTech ? 'text-orange-700' : 'text-teams-purple'}`}>
                                {comment.userName} {isTech && '(Soporte)'}
                            </span>
                          </div>
                        )}
                        
                        <div className="leading-relaxed break-words whitespace-pre-wrap">
                          {comment.text}
                        </div>

                        <div className={`flex items-center gap-1 mt-1 justify-end opacity-60 text-[10px]`}>
                            <span>{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            {isMe && <ICONS.Check size={10} className="text-blue-600" aria-hidden="true" />}
                        </div>

                        {comment.attachmentUrl && (
                          <div className="mt-2 pt-2 border-t border-black border-opacity-5">
                            <a 
                              href={comment.attachmentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block rounded-lg overflow-hidden border border-black border-opacity-10 hover:opacity-95 transition-opacity bg-white"
                            >
                              {comment.attachmentUrl.startsWith('data:image') || comment.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                <img src={comment.attachmentUrl} alt="Adjunto" className="max-h-60 w-auto object-cover mx-auto" />
                              ) : (
                                <div className="p-3 flex items-center gap-3 text-xs text-teams-purple">
                                  <div className="bg-purple-50 p-2 rounded-lg"><ICONS.Image size={18} /></div>
                                  <span className="font-medium">Ver archivo adjunto</span>
                                </div>
                              )}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={commentsEndRef} />
          </div>
        ) : (
          <div id="history-panel" role="tabpanel" aria-label="Historial de cambios" className="space-y-3">
            {audits.map((audit) => (
              <div key={audit.id} className="flex gap-3 bg-white p-3 rounded border border-gray-100 shadow-sm items-start">
                <div className="bg-blue-50 p-1.5 rounded text-blue-600 mt-1" aria-hidden="true">
                  <ICONS.Chart size={14} />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-900">
                    {audit.user_name} cambió el {audit.action === 'STATUS_CHANGE' ? 'estado' : 'detalle'}
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-1">
                    <span className="bg-gray-100 px-1 border rounded" aria-label={`Valor anterior: ${audit.old_value}`}>{audit.old_value}</span>
                    <ICONS.ArrowRight size={10} aria-hidden="true" />
                    <span className="bg-blue-50 text-blue-700 px-1 border border-blue-100 rounded font-medium" aria-label={`Sustituido por: ${audit.new_value}`}>{audit.new_value}</span>
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
            <div className="flex-1">
              <label htmlFor="chat-message-input" className="sr-only">Escribe un mensaje</label>
              {selectedFile && (
                <div className="mb-2 p-2 bg-gray-100 rounded flex justify-between items-center text-xs border border-gray-200">
                  <div className="flex items-center gap-2 truncate">
                    <ICONS.Image size={14} className="text-teams-purple" />
                    <span className="truncate">{selectedFile.name}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = '';}}
                    className="text-red-500 hover:text-red-700 font-bold px-1"
                  >
                    ×
                  </button>
                </div>
              )}
              <textarea
                id="chat-message-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un mensaje o nota técnica..."
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-teams-purple focus:border-teams-purple outline-none resize-none h-20 transition-all shadow-inner"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment(e);
                  }
                }}
                aria-required="true"
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || isUploading}
                className="bg-gray-100 text-gray-600 p-2 rounded-md hover:bg-gray-200 transition-all focus:outline-none flex items-center justify-center border border-gray-300 shadow-sm"
                title="Adjuntar archivo"
                aria-label="Adjuntar archivo o imagen"
              >
                <ICONS.Image size={18} aria-hidden="true" />
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <button
                type="submit"
                disabled={(!newComment.trim() && !selectedFile) || sending || isUploading}
                className="bg-teams-purple text-white p-3 rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-400"
                aria-label="Enviar mensaje"
              >
                {sending || isUploading ? <ICONS.Spinner aria-hidden="true" className="animate-spin" /> : <ICONS.Send aria-hidden="true" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};