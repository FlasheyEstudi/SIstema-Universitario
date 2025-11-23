import React from 'react';
import { X, Bell, Check, Info, AlertCircle, Clock } from 'lucide-react';
import { useAppStore } from '../../store';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { notifications, markAsRead, clearNotifications } = useAppStore();

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS':
                return <Check className="text-green-500" size={20} />;
            case 'WARNING':
                return <AlertCircle className="text-yellow-500" size={20} />;
            case 'ERROR':
                return <AlertCircle className="text-red-500" size={20} />;
            default:
                return <Info className="text-blue-500" size={20} />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'SUCCESS':
                return 'from-green-50 to-emerald-50 border-green-200';
            case 'WARNING':
                return 'from-yellow-50 to-amber-50 border-yellow-200';
            case 'ERROR':
                return 'from-red-50 to-pink-50 border-red-200';
            default:
                return 'from-blue-50 to-primary-50 border-blue-200';
        }
    };

    const formatTime = (date: string) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - notifDate.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Justo ahora';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
        return notifDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    if (!isOpen) return null;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            {/* Overlay con backdrop blur */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal flotante - Centrado en mobile, top-right en desktop */}
            <div className="fixed left-1/2 -translate-x-1/2 top-20 md:left-auto md:translate-x-0 md:right-8 w-[calc(100%-2rem)] max-w-md md:w-96 max-h-[calc(100vh-120px)] md:max-h-[600px] bg-white rounded-3xl shadow-2xl z-50 animate-in slide-in-from-top duration-300 flex flex-col">

                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-purple-600 p-6 rounded-t-3xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Bell className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-white">Notificaciones</h2>
                                <p className="text-sm text-white/80">
                                    {unreadCount} sin leer
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="text-white" size={24} />
                        </button>
                    </div>
                </div>

                {/* Actions bar */}
                {unreadCount > 0 && (
                    <div className="px-6 py-3 border-b bg-gray-50">
                        <button
                            onClick={clearNotifications}
                            className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-2 transition-colors"
                        >
                            <Check size={16} />
                            Marcar todas como leídas
                        </button>
                    </div>
                )}

                {/* Notifications list */}
                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-6">
                            <Bell size={64} className="opacity-20 mb-4" />
                            <p className="font-medium">No tienes notificaciones</p>
                            <p className="text-sm text-center">Cuando recibas notificaciones aparecerán aquí</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => !notif.read && markAsRead(notif.id)}
                                    className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${!notif.read ? 'bg-gradient-to-r ' + getNotificationColor(notif.type) : 'bg-white'
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        {/* Icon */}
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!notif.read ? 'bg-white shadow-md' : 'bg-gray-100'
                                            }`}>
                                            {getNotificationIcon(notif.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className={`font-bold text-sm leading-tight ${!notif.read ? 'text-gray-900' : 'text-gray-600'
                                                    }`}>
                                                    {notif.title}
                                                </h4>
                                                {!notif.read && (
                                                    <div className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full mt-1"></div>
                                                )}
                                            </div>
                                            <p className={`text-sm mt-1 line-clamp-2 ${!notif.read ? 'text-gray-700' : 'text-gray-500'
                                                }`}>
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Clock size={12} className="text-gray-400" />
                                                <span className="text-xs text-gray-400 font-medium">
                                                    {formatTime(notif.date)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer con acción */}
                {notifications.length > 0 && (
                    <div className="p-4 border-t bg-gray-50 rounded-b-3xl">
                        <button
                            onClick={onClose}
                            className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-3 px-4 rounded-xl font-bold hover:from-primary-700 hover:to-purple-700 transition-all shadow-lg"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};