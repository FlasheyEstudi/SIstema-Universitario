import React, { useState } from 'react';
import { Home, Bell, BookOpen, User, Settings, BarChart2, Users, GraduationCap, DollarSign, ClipboardList, FileText, UserPlus, MoreHorizontal, X } from 'lucide-react';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    unreadCount: number;
    setNotifOpen: () => void;
    handleLogout: () => void;
    role?: 'STUDENT' | 'PROFESSOR' | 'ADMIN';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, unreadCount, role = 'STUDENT' }) => {
    const [showMore, setShowMore] = useState(false);

    // Configuración de tabs según el rol
    const getAllNavItems = () => {
        if (role === 'ADMIN') {
            return [
                { id: 'OVERVIEW', label: 'Resumen', icon: BarChart2 },
                { id: 'USERS', label: 'Usuarios', icon: Users },
                { id: 'ACADEMIC', label: 'Académico', icon: GraduationCap },
                { id: 'PENSUM', label: 'Pensum', icon: ClipboardList },
                { id: 'HISTORY', label: 'Historial', icon: FileText },
                { id: 'SCHOLARSHIPS', label: 'Becas', icon: DollarSign },
                { id: 'NOTIFS', label: 'Avisos', icon: Bell },
                { id: 'CONFIG', label: 'Config', icon: Settings },
            ];
        } else if (role === 'PROFESSOR') {
            return [
                { id: 'DASHBOARD', label: 'Inicio', icon: Home },
                { id: 'CLASSES', label: 'Clases', icon: BookOpen },
                { id: 'GRADES', label: 'Notas', icon: ClipboardList },
                { id: 'ATTENDANCE', label: 'Asistencia', icon: Users },
                { id: 'NOTIFICATIONS', label: 'Avisos', icon: Bell, badge: unreadCount },
                { id: 'PROFILE', label: 'Perfil', icon: User },
                { id: 'CONFIG', label: 'Config', icon: Settings },
            ];
        } else {
            // STUDENT (default) - 8 tabs
            return [
                { id: 'DASHBOARD', label: 'Inicio', icon: Home },
                { id: 'NOTIFICATIONS', label: 'Avisos', icon: Bell, badge: unreadCount },
                { id: 'RESOURCES', label: 'Aula', icon: BookOpen },
                { id: 'HISTORY', label: 'Historial', icon: FileText },
                { id: 'ENROLL', label: 'Inscribir', icon: UserPlus },
                { id: 'SCHOLARSHIPS', label: 'Becas', icon: DollarSign },
                { id: 'PROFILE', label: 'Perfil', icon: User },
                { id: 'CONFIG', label: 'Config', icon: Settings },
            ];
        }
    };

    const allItems = getAllNavItems();

    // Mostrar solo los primeros 3 tabs + botón "más"
    const visibleItems = showMore ? allItems : allItems.slice(0, 3);

    return (
        <>
            {/* Modal de tabs adicionales */}
            {showMore && (
                <>
                    <div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setShowMore(false)}
                    />
                    <div className="fixed bottom-20 left-4 right-4 bg-white rounded-3xl shadow-2xl z-50 md:hidden animate-in slide-in-from-bottom duration-200 border-2 border-gray-100">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900">Más opciones</h3>
                                <button
                                    onClick={() => setShowMore(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-gray-600" />
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {allItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setShowMore(false);
                                        }}
                                        className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all ${activeTab === item.id
                                                ? 'bg-primary-600 text-white shadow-lg'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <item.icon size={24} />
                                        <span className="text-[10px] font-medium mt-2 text-center">{item.label}</span>
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                                {item.badge > 9 ? '9+' : item.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Barra de navegación inferior */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40 safe-bottom">
                <div className="grid grid-cols-4 gap-1 px-2 py-2">
                    {visibleItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors relative ${activeTab === item.id
                                    ? 'text-primary-600 bg-primary-50'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <item.icon size={22} />
                            <span className="text-[10px] font-medium mt-1 whitespace-nowrap">{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                    {item.badge > 9 ? '9+' : item.badge}
                                </span>
                            )}
                        </button>
                    ))}

                    {/* Botón "Más" */}
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${showMore
                                ? 'text-primary-600 bg-primary-50'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <MoreHorizontal size={22} />
                        <span className="text-[10px] font-medium mt-1">Más</span>
                    </button>
                </div>
            </div>
        </>
    );
};
