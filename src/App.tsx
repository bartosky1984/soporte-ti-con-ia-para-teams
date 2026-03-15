import React, { useState, useEffect } from 'react';
import { TicketList } from './components/TicketList';
import { KanbanBoard } from './components/KanbanBoard';
import { TicketForm } from './components/TicketForm';
import { ChatAssistant } from './components/ChatAssistant';
import { AdminPanel } from './components/AdminPanel';
import { WikiPanel } from './components/WikiPanel';
import { StatsDashboard } from './components/StatsDashboard';
import { LoginScreen } from './components/LoginScreen';
import { NotificationPanel } from './components/NotificationPanel';
import { TicketDetail } from './components/TicketDetail';
import { ticketService } from './services/ticketService';
import { notificationService } from './services/notificationService';
import { Ticket, TicketStatus, TicketType, User, UserRole, Notification } from './types';
import { ICONS, TEAMS_THEME_COLOR, ROLE_LABELS } from './constants';

enum Tab {
  LIST = 'list',
  NEW = 'new',
  CHAT = 'chat',
  WIKI = 'wiki',
  ADMIN = 'admin',
  STATS = 'stats'
}

type ViewMode = 'list' | 'kanban';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.LIST);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      // Pass user ID to calculate unread status
      const data = await ticketService.getTickets(user?.id);
      setTickets(data);
      // Update selected ticket data if it's currently open
      if (selectedTicket) {
        const updated = data.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTickets();
      fetchNotifications();
      
      // Subscribe to Realtime notifications for this user
      const unsubscribeNotifs = notificationService.subscribeToNotifications(user.id, () => {
        fetchNotifications();
      });

      // Subscribe to Realtime ticket changes
      const unsubscribeTickets = ticketService.subscribeToTickets(() => {
        fetchTickets();
      });

      return () => {
        unsubscribeNotifs();
        unsubscribeTickets();
      };
    }
  }, [user]);

  const handleCreateTicket = async (data: { tipo: TicketType; descripcion: string }) => {
    if (!user) return;
    try {
      await ticketService.createTicket(data, user); // Pass user
      await fetchTickets();
      setActiveTab(Tab.LIST);
    } catch (e) {
      alert("Error al crear ticket");
    }
  };

  const handleStatusChange = async (id: number, status: TicketStatus) => {
    try {
      const ticketToUpdate = tickets.find(t => t.id === id);
      const updated = await ticketService.updateTicketStatus(id, status, user!, ticketToUpdate?.estado);
      if (updated) {
        setTickets(prev => prev.map(t => t.id === id ? updated : t));
        if (selectedTicket && selectedTicket.id === id) {
          setSelectedTicket(updated);
        }
        fetchNotifications();
      }
    } catch (e) {
      alert("Error al actualizar estado");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab(Tab.LIST);
    setViewMode('list');
    setShowNotifications(false);
    setSelectedTicket(null);
  };

  const handleSelectTicket = async (ticket: Ticket) => {
      setSelectedTicket(ticket);
      if (user) {
        // Mark as read immediately when opening
        await ticketService.markAsRead(ticket.id, user.id);
        // Optimistically update UI to remove badge
        setTickets(prev => prev.map(t => 
            t.id === ticket.id ? { ...t, unreadCount: 0 } : t
        ));
      }
  };

  const handleNotificationClick = async (notif: Notification) => {
      // Find the ticket and open it
      const ticket = tickets.find(t => t.id === notif.ticketId);
      if (ticket) {
          await handleSelectTicket(ticket);
          setActiveTab(Tab.LIST); 
          setShowNotifications(false);
          // Mark notification as read
          const updated = await notificationService.markAsRead(notif.id);
          setNotifications(updated);
          setUnreadCount(updated.filter(n => !n.read).length);
      }
  };

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  const isAdmin = user.role === UserRole.ADMIN;
  const isTechOrAdmin = user.role === UserRole.TECHNICIAN || user.role === UserRole.LEAD_TECHNICIAN || user.role === UserRole.ADMIN;

  return (
    <div className="min-h-screen bg-teams-light text-teams-dark font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-teams-purple p-1.5 rounded text-white">
            <ICONS.Ticket />
          </div>
          <h1 className="text-xl font-semibold text-teams-purple tracking-tight">Tickets de Soporte</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1 text-gray-500 hover:text-teams-purple relative transition-colors focus:outline-none"
              title="Notificaciones"
            >
              <ICONS.Bell />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white transform translate-x-1/4 -translate-y-1/4" />
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 top-12 z-50">
                 <NotificationPanel 
                    userId={user.id}
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                    onUpdateNotifications={(updated) => {
                      setNotifications(updated);
                      setUnreadCount(updated.filter(n => !n.read).length);
                    }}
                 />
                 {/* Overlay hack to capture clicks on notifications to navigate */}
                 {notifications.length > 0 && (
                     <div className="absolute top-10 left-0 w-full h-full pointer-events-none"></div>
                 )}
              </div>
            )}
          </div>

          <div className="text-right hidden sm:block">
             <div className="text-sm font-semibold">{user.name}</div>
             <div className="text-xs text-gray-500 uppercase">{ROLE_LABELS[user.role]}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-teams-purple transition-colors p-1"
            title="Cerrar Sesión"
          >
            <ICONS.Logout />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto p-6" onClick={() => { if(showNotifications) setShowNotifications(false) }}>
        
        {/* Navigation Tabs - Hide when looking at a specific ticket details */}
        {!selectedTicket && (
            <div className="flex space-x-1 border-b border-gray-300 mb-6 overflow-x-auto">
            <button
                onClick={() => setActiveTab(Tab.LIST)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === Tab.LIST 
                    ? 'border-teams-purple text-teams-purple' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                Tickets
            </button>
            
            <button
                onClick={() => setActiveTab(Tab.NEW)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === Tab.NEW 
                    ? 'border-teams-purple text-teams-purple' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                Nuevo Ticket
            </button>
            
            <button
                onClick={() => setActiveTab(Tab.CHAT)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center space-x-1 whitespace-nowrap ${
                activeTab === Tab.CHAT
                    ? 'border-teams-purple text-teams-purple' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                <ICONS.Sparkles />
                <span>Asistente IA</span>
            </button>

            <button
                onClick={() => setActiveTab(Tab.WIKI)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center space-x-1 whitespace-nowrap ${
                activeTab === Tab.WIKI
                    ? 'border-teams-purple text-teams-purple' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                <ICONS.Book />
                <span>Wiki Tech</span>
            </button>

            {isTechOrAdmin && (
                <button
                onClick={() => setActiveTab(Tab.STATS)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center space-x-1 whitespace-nowrap ${
                    activeTab === Tab.STATS
                    ? 'border-teams-purple text-teams-purple' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                >
                <ICONS.Chart />
                <span>Estadísticas</span>
                </button>
            )}

            {isAdmin && (
                <button
                onClick={() => setActiveTab(Tab.ADMIN)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center space-x-1 whitespace-nowrap ${
                    activeTab === Tab.ADMIN
                    ? 'border-teams-purple text-teams-purple' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                >
                <ICONS.Shield />
                <span>Admin</span>
                </button>
            )}
            </div>
        )}

        {/* Tab Content */}
        <div className="transition-all duration-300 ease-in-out">
          {selectedTicket ? (
            <TicketDetail 
              ticket={selectedTicket} 
              currentUser={user}
              onClose={() => setSelectedTicket(null)}
              onStatusChange={handleStatusChange}
              onTicketUpdate={(updatedTicket) => {
                setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
                setSelectedTicket(updatedTicket);
              }}
            />
          ) : (
            <>
                {activeTab === Tab.LIST && (
                    <>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-700">
                        {user.role === UserRole.USER ? 'Mis Tickets' : 'Cola de Tickets'}
                        </h2>
                        
                        <div className="flex items-center space-x-4">
                            {isTechOrAdmin && (
                                <div className="flex bg-gray-100 p-1 rounded-md">
                                    <button 
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-teams-purple' : 'text-gray-500 hover:text-gray-700'}`}
                                        title="Vista de Lista"
                                    >
                                        <ICONS.List />
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('kanban')}
                                        className={`p-1.5 rounded transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-teams-purple' : 'text-gray-500 hover:text-gray-700'}`}
                                        title="Vista de Tablero (Kanban)"
                                    >
                                        <ICONS.LayoutGrid />
                                    </button>
                                </div>
                            )}
                            <button 
                                onClick={fetchTickets}
                                className="text-sm text-teams-purple hover:underline"
                            >
                                Actualizar
                            </button>
                        </div>
                    </div>
                    
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="text-teams-purple animate-spin">
                                <ICONS.Spinner />
                            </div>
                            <span className="ml-2 text-gray-500">Cargando tickets...</span>
                        </div>
                    ) : (
                        viewMode === 'kanban' && isTechOrAdmin ? (
                            <KanbanBoard 
                                tickets={tickets} 
                                onStatusChange={handleStatusChange} 
                                onSelectTicket={handleSelectTicket}
                                onClassificationChange={async (id, classificationId) => {
                                  try {
                                    const updated = await ticketService.updateTicketClassification(id, classificationId);
                                    if (updated) {
                                      setTickets(prev => prev.map(t => t.id === id ? updated : t));
                                    }
                                  } catch (e) {
                                    console.error("Error updating classification", e);
                                  }
                                }}
                            />
                        ) : (
                            <TicketList 
                                tickets={tickets} 
                                onStatusChange={handleStatusChange} 
                                onSelectTicket={handleSelectTicket}
                                isLoading={isLoading} 
                                currentUser={user}
                            />
                        )
                    )}
                    </>
                )}

                {activeTab === Tab.NEW && (
                    <TicketForm 
                    onSubmit={handleCreateTicket} 
                    onCancel={() => setActiveTab(Tab.LIST)} 
                    />
                )}

                {activeTab === Tab.CHAT && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <ChatAssistant />
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 h-fit">
                        <h3 className="font-semibold mb-2 text-sm">Sobre Soporte IA</h3>
                        <p className="text-xs text-gray-500 mb-3">
                        Nuestro Asistente IA usa <strong>Gemini Pro</strong> para ayudar a diagnosticar problemas antes de enviar un ticket.
                        </p>
                        <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
                        <li><strong>Aprendizaje Automático:</strong> La IA conoce las soluciones de tickets pasados.</li>
                        <li><strong>Wiki Integrada:</strong> Consulta las FAQs antes de responder.</li>
                        <li>Haz preguntas técnicas</li>
                        <li>Soluciona errores de software</li>
                        </ul>
                    </div>
                    </div>
                )}
                
                {activeTab === Tab.WIKI && (
                    <WikiPanel />
                )}

                {activeTab === Tab.STATS && isTechOrAdmin && (
                    <StatsDashboard user={user} />
                )}

                {activeTab === Tab.ADMIN && isAdmin && (
                    <AdminPanel />
                )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}