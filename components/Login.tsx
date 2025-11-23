import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import { api } from '../services/api';
import { Campus, Role } from '../types';
import { useNavigate } from 'react-router-dom';
import { Loader2, School, Building2, Lock } from 'lucide-react';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);
    const [step, setStep] = useState<1 | 2>(1);
    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingCampuses, setLoadingCampuses] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const list = await api.campuses.list();
                setCampuses(list);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingCampuses(false);
            }
        };
        load();
    }, []);

    // Helper para llenar datos de demo según el campus seleccionado
    const fillDemo = (role: Role) => {
        if (!selectedCampus) return;
        
        const isCentral = selectedCampus.code === 'CEN';
        const isNorte = selectedCampus.code === 'NOR';

        // Set default password
        setPassword('123456');

        if (role === Role.ADMIN) {
            setEmail(isCentral ? 'admin.central@uni.edu.ni' : 'admin.norte@uni.edu.ni');
        } else if (role === Role.PROFESSOR) {
            // Juan Perez (Norte) vs Prof Central (Central)
            setEmail(isCentral ? 'prof.central@uni.edu.ni' : 'juan.perez@uni.edu.ni');
        } else if (role === Role.STUDENT) {
            // Maria (Norte) vs Estudiante Central
            setEmail(isCentral ? 'est.central@uni.edu.ni' : 'maria.e@uni.edu.ni');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); 
        if (!selectedCampus) return;

        setError('');
        setLoading(true);
        try {
            const user = await api.auth.login(email, password, selectedCampus.id);
            login(user, user.token || 'fake-jwt');
            
            // Artificial delay for better UX
            setTimeout(() => {
                if (user.role === Role.ADMIN) navigate('/admin');
                else if (user.role === Role.PROFESSOR) navigate('/professor');
                else navigate('/student');
            }, 800);

        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
            setLoading(false);
        }
    };

    if (step === 1) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="p-4 bg-primary-600 rounded-2xl shadow-lg shadow-primary-500/40">
                             <School className="text-white w-10 h-10" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Bienvenido</h1>
                    <p className="text-blue-200 mb-8">Selecciona tu Recinto Universitario</p>

                    {loadingCampuses ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-white" />
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                            {campuses.map((c) => (
                                <button
                                    type="button"
                                    key={c.id}
                                    onClick={() => { setSelectedCampus(c); setStep(2); }}
                                    className="w-full group relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl transition-all duration-300 text-left flex items-center gap-4"
                                >
                                    <div className="p-2 bg-primary-500/20 rounded-lg text-primary-300 group-hover:text-white group-hover:bg-primary-500 transition-colors">
                                        <Building2 size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-white font-medium block">{c.name}</span>
                                        <span className="text-xs text-blue-200">{c.location}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
             {/* Decorative Background */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-primary-900 rounded-b-[3rem] z-0"></div>
            
            <div className="w-full max-w-md bg-white z-10 rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-8 pb-0 text-center">
                     <button type="button" onClick={() => { setStep(1); setEmail(''); setPassword(''); }} className="text-xs text-primary-600 hover:underline mb-4 block">← Cambiar Recinto</button>
                     <h2 className="text-2xl font-bold text-gray-900">{selectedCampus?.name}</h2>
                     <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales institucionales</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Institucional</label>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                placeholder="usuario@uni.edu.ni"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all pl-10"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            </div>
                        </div>
                        
                         {/* Demo Helpers */}
                        <div className="flex gap-2 text-[10px] text-gray-400 justify-center">
                            <span onClick={() => fillDemo(Role.ADMIN)} className="cursor-pointer hover:text-primary-600">Demo Admin</span> |
                            <span onClick={() => fillDemo(Role.PROFESSOR)} className="cursor-pointer hover:text-primary-600">Demo Prof</span> |
                            <span onClick={() => fillDemo(Role.STUDENT)} className="cursor-pointer hover:text-primary-600">Demo Estudiante</span>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary-500/30 flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Acceder al Sistema'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};