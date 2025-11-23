import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { LogOut, Bell, User as UserIcon } from 'lucide-react';
import { NotificationModal } from './ui/NotificationModal';
import { api } from '../services/api';

interface LayoutProps {
   children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
   const { user, logout } = useAuthStore();
   const { notifications } = useAppStore();
   const navigate = useNavigate();
   const [isNotifOpen, setNotifOpen] = useState(false);
   const [campusName, setCampusName] = useState('');

   const unreadCount = notifications.filter(n => !n.read).length;

   useEffect(() => {
      const loadCampus = async () => {
         if (user) {
            try {
               const campuses = await api.campuses.list();
               const c = campuses.find(c => c.id === user.campusId);
               setCampusName(c ? c.name : 'UniSystem');
            } catch (error) {
               setCampusName('UniSystem');
            }
         }
      };
      loadCampus();
   }, [user]);

   const handleLogout = () => {
      logout();
      navigate('/login');
   };

   return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
         {/* HEADER SUPERIOR UNIFICADO (DESKTOP) */}
         <header className="hidden md:block sticky top-0 z-40 w-full bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex justify-between items-center h-16">
                  {/* Izquierda: Identidad */}
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/30">
                        US
                     </div>
                     <div className="leading-tight">
                        <h1 className="font-bold text-gray-900 text-lg tracking-tight">UniSystem</h1>
                        <p className="text-xs text-gray-500 font-medium truncate max-w-[150px] sm:max-w-xs" title={campusName}>
                           {campusName}
                        </p>
                     </div>
                  </div>

                  {/* Derecha: Acciones */}
                  <div className="flex items-center gap-2 sm:gap-4">
                     {/* Notificaciones */}
                     <button
                        onClick={() => setNotifOpen(true)}
                        className="relative p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all"
                     >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                           <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                        )}
                     </button>

                     {/* Separador */}
                     <div className="h-6 w-px bg-gray-200 mx-1"></div>

                     {/* Perfil de Usuario */}
                     <div className="flex items-center gap-3">
                        <div className="hidden md:block text-right">
                           <p className="text-sm font-bold text-gray-900 leading-none">{user?.name}</p>
                           <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{user?.role}</p>
                        </div>

                        <div className="relative group cursor-pointer">
                           <img
                              src={user?.avatarUrl || "https://picsum.photos/40"}
                              alt="Avatar"
                              className="w-9 h-9 rounded-full border border-gray-200 bg-gray-100 object-cover shadow-sm group-hover:ring-2 group-hover:ring-primary-100 transition-all"
                           />
                        </div>

                        <button
                           onClick={handleLogout}
                           className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                           title="Cerrar Sesión"
                        >
                           <LogOut size={20} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </header>

         {/* HEADER MÓVIL (NEUTRAL STYLE) */}
         <header className="md:hidden sticky top-0 z-40 w-full bg-white text-gray-900 shadow-md">
            <div className="px-4 py-3 flex justify-between items-center">
               <h1 className="text-xl font-bold tracking-wide">UniSystem</h1>
               <div className="flex items-center gap-5">
                  <button onClick={() => setNotifOpen(true)} className="relative">
                     <Bell size={22} />
                     {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                     )}
                  </button>
                  <button onClick={handleLogout}><LogOut size={22} /></button>
               </div>
            </div>
         </header>

         {/* CONTENIDO PRINCIPAL CENTRADO */}
         <main className="flex-1 w-full max-w-7xl mx-auto md:px-6 lg:px-8 md:py-8 pb-16">
            {children}
         </main>

         {/* Footer Simple */}
         <footer className="py-6 text-center text-xs text-gray-400 border-t">
            <p>© {new Date().getFullYear()} UniSystem - Universidad Nacional Multidisciplinaria</p>
         </footer>

         {/* Modal de Notificaciones */}
         <NotificationModal isOpen={isNotifOpen} onClose={() => setNotifOpen(false)} />
      </div>
   );
};