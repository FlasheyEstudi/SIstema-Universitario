import React from 'react';
import { X, CheckCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'danger' | 'info' | 'confirm';
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const ActionModal: React.FC<ModalProps> = ({ 
    isOpen, onClose, title, message, type = 'info', onConfirm, confirmText = 'Aceptar', cancelText = 'Cancelar' 
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch(type) {
            case 'success': return <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4"><CheckCircle className="h-6 w-6 text-green-600" /></div>;
            case 'danger': return <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"><AlertTriangle className="h-6 w-6 text-red-600" /></div>;
            case 'confirm': return <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4"><HelpCircle className="h-6 w-6 text-blue-600" /></div>;
            default: return <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4"><Info className="h-6 w-6 text-gray-600" /></div>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative bg-white rounded-2xl shadow-2xl transform transition-all sm:my-8 sm:w-full sm:max-w-sm p-6 animate-scale-in border border-gray-100">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500">
                    <X size={20} />
                </button>
                
                <div className="text-center">
                    {getIcon()}
                    <h3 className="text-lg leading-6 font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 mb-6">{message}</p>
                    
                    <div className="flex gap-3 justify-center">
                        {(type === 'confirm' || type === 'danger') && (
                            <button
                                type="button"
                                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                                onClick={onClose}
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            type="button"
                            className={`flex-1 px-4 py-2.5 font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-sm text-white
                                ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30'}
                            `}
                            onClick={() => {
                                if (onConfirm) onConfirm();
                                onClose();
                            }}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};