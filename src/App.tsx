import React, { useState, useEffect, lazy, Suspense } from 'react';
import { TicketList } from './components/TicketList';
import { LoginScreen } from './components/LoginScreen';

// Lazy loaded components for bundle optimization
const KanbanBoard = lazy(() => import('./components/KanbanBoard').then(m => ({ default: m.KanbanBoard })));
const TicketForm = lazy(() => import('./components/TicketForm').then(m => ({ default: m.TicketForm })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const WikiPanel = lazy(() => import('./components/WikiPanel').then(m => ({ default: m.WikiPanel })));
const StatsDashboard = lazy(() => import('./components/StatsDashboard').then(m => ({ default: m.StatsDashboard })));
const NotificationPanel = lazy(() => import('./components/NotificationPanel').then(m => ({ default: m.NotificationPanel })));
const TicketDetail = lazy(() => import('./components/TicketDetail').then(m => ({ default: m.TicketDetail })));
const SearchFilters = lazy(() => import('./components/SearchFilters').then(m => ({ default: m.SearchFilters })));
const UserDashboard = lazy(() => import('./components/UserDashboard').then(m => ({ default: m.UserDashboard })));
import type { FilterState } from './components/SearchFilters';
import { ticketService } from './services/ticketService';
import { wikiService } from './services/wikiService';
import { notificationService } from './services/notificationService';
import { syncService } from './services/syncService';
import { Wifi, WifiOff, RefreshCcw } from 'lucide-react';
import { Ticket, TicketStatus, TicketType, User, UserRole, Notification } from './types';
import { ICONS, TEAMS_THEME_COLOR, ROLE_LABELS } from './constants';

enum Tab {
  LIST = 'list',
  NEW = 'new',
  WIKI = 'wiki',
  ADMIN = 'admin',
  STATS = 'stats',
  DASHBOARD = 'dashboard'
}

type ViewMode = 'list' | 'kanban';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(user?.role === UserRole.USER ? Tab.DASHBOARD : Tab.LIST);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] = useState<FilterState | null>(null);
  
  // Diagnostic log for deployment debugging
  useEffect(() => {
    const dbStatus = (typeof process !== 'undefined' && process.env.DB_ENABLED === 'true') || import.meta.env.VITE_DB_ENABLED === 'true';
    console.log("🚀 App Status:", {
      databaseEnabled: dbStatus,
      supabaseConfig: !!((typeof process !== 'undefined' && process.env.SUPABASE_URL) || import.meta.env.VITE_SUPABASE_URL),
      environment: import.meta.env.MODE
    });
  }, []);

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

  // Handle online/offline status and sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const handleSync = async () => {
    if (syncService.getQueueCount() > 0) {
      setIsSyncing(true);
      try {
        await syncService.processQueue({
          onSyncTicket: async (data, u) => {
            const ticket = await ticketService.createTicket(data, u);
            // Update local state if needed
            setTickets(prev => [ticket, ...prev]);
            return ticket;
          },
          onSyncComment: async (tId, text, u, attUrl) => {
            return await ticketService.addComment(tId, text, u, attUrl);
          }
        });
        // Refresh data after sync
        fetchTickets();
      } catch (err) {
        console.error("Sync failed", err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === UserRole.USER && activeTab === Tab.LIST) {
        setActiveTab(Tab.DASHBOARD);
      }
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

      // Subscribe to All Comments to update unread counts in the list
      const unsubscribeAllComments = ticketService.subscribeToAllComments(() => {
        console.log("💬 [App] New comment detected, refreshing tickets...");
        fetchTickets();
      });

      return () => {
        unsubscribeNotifs();
        unsubscribeTickets();
        unsubscribeAllComments();
      };
    }
  }, [user]);

  const handleCreateTicket = async (data: { tipo: TicketType; descripcion: string; attachmentUrl?: string }) => {
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

  // Filtering Logic
  const filteredTickets = tickets.filter(ticket => {
    // SECURITY: Regular users should ONLY see tickets they created
    if (user.role === UserRole.USER) {
      return ticket.userId === user.id;
    }

    // SECURITY: Technicians and Lead Technicians should ONLY see tickets assigned to them OR unassigned tickets
    // (Only Admins can see everything for global management)
    if (user.role === UserRole.TECHNICIAN || user.role === UserRole.LEAD_TECHNICIAN) {
      const isAssignedToMe = ticket.technicianId === user.id;
      const isUnassigned = !ticket.technicianId;
      if (!isAssignedToMe && !isUnassigned) return false;
    }

    if (!filters) return true;

    // Automatic department filter for technicians if no manual classification filter is active
    if (filters.type === 'all' && (user.role === UserRole.TECHNICIAN || user.role === UserRole.LEAD_TECHNICIAN)) {
      const email = user.email?.toLowerCase() || '';
      const name = user.name?.toLowerCase() || '';
      
      if (email.includes('it') || name.includes('it')) {
        if (ticket.tipo !== TicketType.IT) return false;
      } else if (email.includes('servicios') || name.includes('servicios') || email.includes('general')) {
        if (ticket.tipo !== TicketType.GENERAL) return false;
      }
    }
    
    const matchesSearch = !filters.searchText || 
      ticket.descripcion.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      ticket.id.toString().includes(filters.searchText) ||
      ticket.userName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      (ticket.technicianName?.toLowerCase().includes(filters.searchText.toLowerCase()));

    const matchesCreator = filters.creatorId === 'all' || ticket.userId === filters.creatorId;
    const matchesTechnician = filters.technicianId === 'all' || 
      (filters.technicianId === 'unassigned' && !ticket.technicianId) || 
      ticket.technicianId === filters.technicianId;
    
    const matchesStatus = filters.status === 'all' || ticket.estado === filters.status;
    
    // Date Filtering
    const ticketDate = new Date(ticket.fecha).getTime();
    let matchesDate = true;
    
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && ticketDate >= start.getTime();
    }
    
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && ticketDate <= end.getTime();
    }

    return matchesSearch && matchesCreator && matchesTechnician && matchesStatus && matchesDate;
  });

  return (
    <div className="min-h-screen bg-teams-light text-teams-dark font-sans flex flex-col">
      {/* Connectivity Indicator */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {!isOnline && (
          <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
            <WifiOff size={18} />
            <span className="text-sm font-medium">Modo Offline</span>
          </div>
        )}
        {isSyncing && (
          <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <RefreshCcw size={18} className="animate-spin" />
            <span className="text-sm font-medium">Sincronizando...</span>
          </div>
        )}
        {isOnline && !isSyncing && syncService.getQueueCount() > 0 && (
          <button 
            onClick={handleSync}
            className="bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-amber-600 transition-colors"
          >
            <RefreshCcw size={18} />
            <span className="text-sm font-medium">{syncService.getQueueCount()} pendientes</span>
          </button>
        )}
      </div>

      {/* Header Landmark */}
      <header role="banner" className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm sticky top-0 z-10 w-full">
        <div className="flex items-center space-x-3">
          <div className="bg-teams-purple p-1.5 rounded text-white">
            <ICONS.Ticket />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-teams-purple tracking-tight">
            <span className="hidden xs:inline">Tickets de </span>Soporte
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1 text-gray-500 hover:text-teams-purple relative transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teams-purple rounded"
              title="Notificaciones"
              aria-label={`Notificaciones ${unreadCount > 0 ? `(${unreadCount} sin leer)` : ''}`}
              aria-expanded={showNotifications}
              type="button"
            >
              <ICONS.Bell aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white transform translate-x-1/4 -translate-y-1/4" aria-hidden="true" />
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 top-12 z-50">
                <Suspense fallback={<div className="bg-white p-4 shadow-xl rounded-lg border animate-pulse">Cargando...</div>}>
                  <NotificationPanel 
                      userId={user.id}
                      notifications={notifications}
                      onClose={() => setShowNotifications(false)}
                      onUpdateNotifications={(updated) => {
                        setNotifications(updated);
                        setUnreadCount(updated.filter(n => !n.read).length);
                      }}
                  />
                </Suspense>
              </div>
            )}
          </div>

          <div className="text-right hidden sm:block">
             <div className="text-sm font-semibold">{user.name}</div>
             <div className="text-xs text-gray-500 uppercase">{ROLE_LABELS[user.role]}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-teams-purple transition-colors p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-teams-purple rounded"
            title="Cerrar Sesión"
            aria-label="Cerrar sesión"
            type="button"
          >
            <ICONS.Logout aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Content Landmark */}
      <main role="main" id="main-content" className="w-full max-w-7xl mx-auto p-4 sm:p-6 flex-grow" onClick={() => { if(showNotifications) setShowNotifications(false) }}>
        
        {/* Navigation Tabs - Navigation Landmark */}
        {!selectedTicket && (
            <nav aria-label="Navegación principal" className="flex space-x-1 border-b border-gray-300 mb-4 sm:mb-6 overflow-x-auto no-scrollbar scroll-smooth">
            <button
                onClick={() => setActiveTab(Tab.DASHBOARD)}
                aria-current={activeTab === Tab.DASHBOARD ? 'page' : undefined}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center space-x-1 whitespace-nowrap ${
                activeTab === Tab.DASHBOARD 
                    ? 'border-teams-purple text-teams-purple' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                <ICONS.LayoutGrid size={14} />
                <span>Panel</span>
            </button>

            <button
                onClick={() => setActiveTab(Tab.LIST)}
                aria-current={activeTab === Tab.LIST ? 'page' : undefined}
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
            </nav>
        )}

        {/* Tab Content */}
        <div className="transition-all duration-300 ease-in-out">
          <Suspense fallback={
            <div className="flex flex-col justify-center items-center py-20">
               <div className="text-teams-purple animate-spin mb-4">
                  <ICONS.Spinner size={40} />
               </div>
               <p className="text-gray-500 animate-pulse">Cargando módulo...</p>
            </div>
          }>
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
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                          <h2 className="text-lg font-bold text-gray-700">
                          {user.role === UserRole.USER ? 'Mis Tickets' : 'Cola de Tickets'}
                          </h2>
                          
                          <div className="flex items-center space-x-4">
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
                              <button 
                                  onClick={fetchTickets}
                                  className="text-sm text-teams-purple hover:underline"
                              >
                                  Actualizar
                              </button>
                          </div>
                      </div>
                      {/* Búsqueda Avanzada y Filtros */}
                      <SearchFilters currentUser={user} onFilterChange={setFilters} />
                      
                      {isLoading ? (
                          <div className="flex justify-center items-center py-12">
                              <div className="text-teams-purple animate-spin">
                                  <ICONS.Spinner />
                              </div>
                              <span className="ml-2 text-gray-500">Cargando tickets...</span>
                          </div>
                      ) : (
                          viewMode === 'kanban' ? (
                              <KanbanBoard 
                                  tickets={filteredTickets} 
                                  onStatusChange={handleStatusChange} 
                                  onSelectTicket={handleSelectTicket}
                                  currentUser={user}
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
                                  tickets={filteredTickets} 
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

                  {activeTab === Tab.DASHBOARD && (
                    <UserDashboard 
                      tickets={tickets.filter(t => {
                        if (user.role === UserRole.USER) return t.userId === user.id;
                        return t.technicianId === user.id;
                      })}
                      onCreateTicket={() => setActiveTab(Tab.NEW)}
                      onViewTickets={(view) => {
                        setViewMode(view as ViewMode);
                        setActiveTab(Tab.LIST);
                      }}
                    />
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
          </Suspense>
        </div>
      </main>
    </div>
  );
}