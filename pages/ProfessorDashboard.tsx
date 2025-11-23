import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { api } from '../services/api';
import { Course, Enrollment, User, CourseResource } from '../types';
import { Users, BookOpen, Clock, Bell, Send, CheckCircle, GraduationCap, LayoutDashboard, Settings, Save, Upload, Link, FileText, Download } from 'lucide-react';
import { ActionModal } from '../components/ui/ModalSystem';
import { BottomNav } from '../components/BottomNav';

// Estilos
const INPUT_CLASS = "w-full border border-gray-300 p-3 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all";
const SELECT_CLASS = "w-full border border-gray-300 p-3 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium";

export const ProfessorDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('DASHBOARD');

    // Data
    const [courses, setCourses] = useState<Course[]>([]);
    const [stats, setStats] = useState<any>({ classes: 0, students: 0 });
    const [currentClass, setCurrentClass] = useState<Course | null>(null);

    // Selected Context
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [roster, setRoster] = useState<(Enrollment & { student: User })[]>([]);
    const [resources, setResources] = useState<CourseResource[]>([]);

    // Modules State
    const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState<{ [key: string]: string }>({});
    const [notifMsg, setNotifMsg] = useState('');
    const [notifTarget, setNotifTarget] = useState('ALL');
    const [newPassword, setNewPassword] = useState('');

    // Resource State
    const [newRes, setNewRes] = useState({ title: '', type: 'LINK' as 'LINK' | 'FILE', url: '' });

    // Modal
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' as any });

    useEffect(() => {
        if (!user) return;
        loadInitialData();
    }, [user]);

    useEffect(() => {
        if (selectedCourseId) {
            loadRoster(selectedCourseId);
            loadResources(selectedCourseId);
            setAttendanceData({});
        }
    }, [selectedCourseId]);

    const loadInitialData = async () => {
        const [c, s] = await Promise.all([
            api.professor.getClasses(user!.id),
            api.professor.getStats(user!.id)
        ]);
        setCourses(c);
        setStats(s);
        determineCurrentClass(c);
        if (c.length > 0) setSelectedCourseId(c[0].id);
    };

    const determineCurrentClass = (classes: Course[]) => {
        const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        const today = days[new Date().getDay()];
        const nowHour = new Date().getHours();
        const current = classes.find(c => {
            if (!c.schedule) return false;
            return c.schedule.includes(today) && parseInt(c.schedule.split(' ')[1]) <= nowHour && parseInt(c.schedule.split('-')[1]?.trim()) > nowHour;
        });
        setCurrentClass(current || null);
    };

    const loadRoster = async (cid: string) => {
        const r = await api.professor.getClassRoster(cid);
        setRoster(r);
    };

    const loadResources = async (cid: string) => {
        const r = await api.courses.getResources(cid);
        setResources(r);
    };

    const loadAttendanceForDate = async () => {
        if (!selectedCourseId) return;
        const records: any[] = await api.professor.getAttendance(selectedCourseId, attDate);
        const map: any = {};
        records.forEach(r => map[r.studentId] = r.status);
        setAttendanceData(map);
    };

    const handleSaveAttendance = async () => {
        if (!selectedCourseId) return;
        const records = Object.keys(attendanceData).map(sid => ({
            studentId: sid,
            status: attendanceData[sid]
        }));
        await api.professor.saveAttendance(selectedCourseId, attDate, records);
        setModal({ isOpen: true, title: 'Asistencia Guardada', message: 'Los registros se han actualizado correctamente.', type: 'success' });
    };

    const markAllPresent = () => {
        const map: any = {};
        roster.forEach(r => map[r.studentId] = 'PRESENT');
        setAttendanceData(map);
    };

    const handleGradeChange = async (enrollmentId: string, field: 'p1' | 'p2' | 'exam', val: string) => {
        const numVal = parseInt(val) || 0;
        const enrollment = roster.find(r => r.id === enrollmentId);
        if (!enrollment) return;

        const p1 = field === 'p1' ? numVal : (enrollment.gradeP1 || 0);
        const p2 = field === 'p2' ? numVal : (enrollment.gradeP2 || 0);
        const exam = field === 'exam' ? numVal : (enrollment.gradeExam || 0);

        // Calculate Final: (P1 * 0.3) + (P2 * 0.3) + (Exam * 0.4)
        const final = Math.round((p1 * 0.3) + (p2 * 0.3) + (exam * 0.4));

        await api.professor.submitGrade(enrollmentId, { p1, p2, exam, final });
        loadRoster(selectedCourseId); // Refresh UI
    };

    const handleUploadResource = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setNewRes({ ...newRes, type: 'FILE', title: e.target.files![0].name, url: ev.target?.result as string });
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleAddResource = async () => {
        if (!newRes.title || !newRes.url) return;
        await api.courses.addResource(selectedCourseId, newRes);
        setNewRes({ title: '', type: 'LINK', url: '' });
        setModal({ isOpen: true, title: 'Recurso Añadido', message: 'El material está disponible para los estudiantes.', type: 'success' });
        loadResources(selectedCourseId);
    };

    const handleSendNotification = async () => {
        if (!notifMsg) return;
        const course = courses.find(c => c.id === selectedCourseId);

        if (notifTarget === 'ALL') {
            const promises = roster.map(r => api.notifications.send({
                senderId: user?.id,
                recipientId: r.studentId,
                title: `Aviso: ${course?.name}`,
                message: notifMsg,
                type: 'INFO'
            }));
            await Promise.all(promises);
        } else {
            await api.notifications.send({
                senderId: user?.id,
                recipientId: notifTarget,
                title: `Mensaje Privado: ${course?.name}`,
                message: notifMsg,
                type: 'INFO'
            });
        }
        setModal({ isOpen: true, title: 'Enviado', message: 'El aviso ha sido distribuido.', type: 'success' });
        setNotifMsg('');
    };

    const handleChangePassword = async () => {
        if (!newPassword) return;
        await api.auth.changePassword(user!.id, newPassword);
        setModal({ isOpen: true, title: 'Seguridad', message: 'Contraseña actualizada.', type: 'success' });
        setNewPassword('');
    };

    // --- RENDER FUNCTIONS ---

    const renderDashboard = () => (
        <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-primary-50 p-6 rounded-3xl border-2 border-blue-100 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-primary-600 rounded-2xl text-white shadow-lg"><BookOpen size={28} /></div>
                    </div>
                    <p className="text-primary-700 text-xs font-extrabold uppercase tracking-wider">Clases Asignadas</p>
                    <h3 className="text-5xl font-black text-primary-600 mt-2 tabular-nums">{stats.classes}</h3>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-3xl border-2 border-green-100 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white shadow-lg"><Users size={28} /></div>
                    </div>
                    <p className="text-green-700 text-xs font-extrabold uppercase tracking-wider">Total Alumnos</p>
                    <h3 className="text-5xl font-black text-green-600 mt-2 tabular-nums">{stats.students}</h3>
                </div>
                <div className={`p-6 rounded-3xl border-2 shadow-xl transition-all transform hover:scale-105 ${currentClass ? 'bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 text-white shadow-green-500/50' : 'bg-white border-dashed border-gray-300'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-4 rounded-2xl ${currentClass ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-100 text-gray-400'}`}><Clock size={28} /></div>
                    </div>
                    <p className={`text-xs font-extrabold uppercase tracking-wider ${currentClass ? 'text-white/90' : 'text-gray-500'}`}>Clase Actual</p>
                    <h3 className={`text-2xl font-bold mt-2 ${currentClass ? 'text-white' : 'text-gray-400'}`}>{currentClass ? currentClass.name : 'Ninguna'}</h3>
                    {currentClass && <p className="text-sm opacity-90 mt-1 font-medium">{currentClass.room}</p>}
                </div>
            </div>

            <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-xl p-8 hover:shadow-2xl transition-shadow">
                <h3 className="font-extrabold text-2xl mb-6 text-gray-900">Mis Grupos</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {courses.map(c => (
                        <div key={c.id} onClick={() => { setSelectedCourseId(c.id); setActiveTab('GRADES'); }} className="p-6 border-2 border-gray-100 rounded-2xl hover:border-primary-300 hover:bg-gradient-to-r hover:from-primary-50 hover:to-purple-50 cursor-pointer transition-all flex justify-between items-center group bg-white shadow-sm hover:shadow-xl transform hover:scale-105">
                            <div>
                                <h4 className="font-extrabold text-gray-900 text-lg group-hover:text-primary-700 transition-colors">{c.name}</h4>
                                <p className="text-sm text-gray-500 font-mono mt-1">{c.code} • {c.schedule}</p>
                            </div>
                            <span className="text-xs bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-2 rounded-full font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-all">Gestionar</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderCourseSelector = () => (
        <div className="mb-6 bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row items-center gap-4">
            <label className="text-sm font-bold text-gray-500 uppercase whitespace-nowrap">Gestionando Clase:</label>
            <select
                className={`${SELECT_CLASS} md:w-auto border-none bg-gray-50 focus:ring-0 font-bold text-lg text-primary-700 cursor-pointer hover:bg-gray-100`}
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
            >
                {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
        </div>
    );

    const renderAttendance = () => (
        <div className="bg-white p-8 rounded-2xl border shadow-sm animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900"><CheckCircle className="text-green-600" /> Toma de Asistencia</h2>
                    <p className="text-gray-500 mt-1">Seleccione la fecha y marque el estado de cada estudiante.</p>
                </div>
                <div className="flex items-end gap-3 bg-gray-50 p-2 rounded-xl border">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Fecha</label>
                        <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} className="border-0 bg-white p-2 rounded-lg font-bold text-gray-900 shadow-sm outline-none ring-1 ring-gray-200" />
                    </div>
                    <button onClick={loadAttendanceForDate} className="bg-gray-900 hover:bg-black text-white p-2.5 rounded-lg text-sm font-bold transition-colors">Cargar</button>
                </div>
            </div>
            <div className="mb-6"><button onClick={markAllPresent} className="text-xs bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-100 hover:bg-green-100 font-bold transition-colors">Marcar Todos Presente</button></div>
            <div className="overflow-x-auto border rounded-xl shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                        <tr><th className="p-4 text-gray-600 font-bold">Estudiante</th><th className="p-4 text-center text-gray-600 font-bold">Estado</th></tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                        {roster.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-bold text-gray-900">{r.student.name}</td>
                                <td className="p-4 flex justify-center gap-2">
                                    {[{ id: 'PRESENT', label: 'P', color: 'bg-green-50 text-green-600' }, { id: 'ABSENT', label: 'A', color: 'bg-red-50 text-red-600' }, { id: 'LATE', label: 'T', color: 'bg-yellow-50 text-yellow-600' }, { id: 'EXCUSED', label: 'J', color: 'bg-blue-50 text-blue-600' }].map(opt => (
                                        <button key={opt.id} onClick={() => setAttendanceData({ ...attendanceData, [r.studentId]: opt.id })} className={`w-10 h-10 rounded-lg font-bold text-sm ${attendanceData[r.studentId] === opt.id ? opt.color.replace('50', '600').replace('text-', 'text-white ') : opt.color}`}>{opt.label}</button>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-6 flex justify-end"><button onClick={handleSaveAttendance} className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 shadow-lg flex items-center gap-2"><Save size={20} /> Guardar Asistencia</button></div>
        </div>
    );

    const renderGrades = () => (
        <div className="bg-white p-8 rounded-2xl border shadow-sm animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900"><GraduationCap className="text-blue-600" /> Libro de Calificaciones</h2>
                <div className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">Evaluación Por Cortes (30/30/40)</div>
            </div>
            <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-left text-gray-600">
                        <tr>
                            <th className="p-4">Estudiante</th>
                            <th className="p-4 text-center">I Parcial (30%)</th>
                            <th className="p-4 text-center">II Parcial (30%)</th>
                            <th className="p-4 text-center">Examen (40%)</th>
                            <th className="p-4 text-center">Nota Final</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                        {roster.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-bold text-gray-900">{r.student.name}</td>
                                <td className="p-4 text-center"><input type="number" min={0} max={100} defaultValue={r.gradeP1} onBlur={e => handleGradeChange(r.id, 'p1', e.target.value)} className="w-16 text-center border p-1 rounded font-bold" /></td>
                                <td className="p-4 text-center"><input type="number" min={0} max={100} defaultValue={r.gradeP2} onBlur={e => handleGradeChange(r.id, 'p2', e.target.value)} className="w-16 text-center border p-1 rounded font-bold" /></td>
                                <td className="p-4 text-center"><input type="number" min={0} max={100} defaultValue={r.gradeExam} onBlur={e => handleGradeChange(r.id, 'exam', e.target.value)} className="w-16 text-center border p-1 rounded font-bold" /></td>
                                <td className="p-4 text-center"><span className={`font-bold text-lg ${(r.finalGrade || 0) >= 60 ? 'text-green-600' : 'text-red-600'}`}>{r.finalGrade || '-'}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderResources = () => (
        <div className="bg-white p-8 rounded-2xl border shadow-sm animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900"><Link className="text-purple-600" /> Aula Virtual (Recursos)</h2>

            <div className="bg-gray-50 p-4 rounded-xl mb-8 flex flex-col md:flex-row gap-4 items-end border">
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-gray-500 uppercase">Título del Recurso</label>
                    <input className={INPUT_CLASS} value={newRes.title} onChange={e => setNewRes({ ...newRes, title: e.target.value })} placeholder="Ej: Silabo, Guía #1..." />
                </div>
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-gray-500 uppercase">Enlace o Archivo</label>
                    <div className="flex gap-2">
                        <input className={INPUT_CLASS} disabled={newRes.type === 'FILE'} value={newRes.url} onChange={e => setNewRes({ ...newRes, url: e.target.value })} placeholder="https://..." />
                        <label className="bg-gray-200 hover:bg-gray-300 p-3 rounded-lg cursor-pointer"><Upload size={20} /><input type="file" className="hidden" onChange={handleUploadResource} /></label>
                    </div>
                </div>
                <button onClick={handleAddResource} className="w-full md:w-auto bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700">Subir</button>
            </div>

            <div className="grid gap-3">
                {resources.map(r => (
                    <div key={r.id} className="p-4 border rounded-xl flex justify-between items-center bg-white hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">{r.type === 'LINK' ? <Link size={20} /> : <FileText size={20} />}</div>
                            <div>
                                <h4 className="font-bold text-gray-900">{r.title}</h4>
                                <p className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <a href={r.url} target="_blank" className="text-sm font-bold text-purple-600 hover:underline">Abrir Recurso</a>
                    </div>
                ))}
                {resources.length === 0 && <p className="text-center text-gray-400 py-10">No hay recursos compartidos.</p>}
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="bg-white p-8 rounded-2xl border shadow-sm animate-fade-in max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Bell size={28} /></div>
                <h2 className="text-2xl font-bold text-gray-900">Enviar Aviso</h2>
                <p className="text-gray-500 text-sm mt-1">Notifique a sus estudiantes sobre tareas o cambios.</p>
            </div>
            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Destinatario</label>
                    <select className={SELECT_CLASS} value={notifTarget} onChange={e => setNotifTarget(e.target.value)}>
                        <option value="ALL">Toda la Clase: {courses.find(c => c.id === selectedCourseId)?.name}</option>
                        {roster.map(r => <option key={r.studentId} value={r.studentId}>{r.student.name}</option>)}
                    </select>
                </div>
                <textarea className={`${INPUT_CLASS} h-32 resize-none`} placeholder="Escriba su mensaje..." value={notifMsg} onChange={e => setNotifMsg(e.target.value)}></textarea>
                <button onClick={handleSendNotification} className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all"><Send size={18} /> Enviar Aviso</button>
            </div>
        </div>
    );

    const renderConfig = () => (
        <div className="bg-white p-8 rounded-2xl border shadow-sm animate-fade-in max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-900"><Settings size={24} /> Configuración</h2>
            <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700">Cambiar Contraseña</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={INPUT_CLASS} placeholder="Nueva contraseña" />
                <button onClick={handleChangePassword} disabled={!newPassword} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-black transition-all">Actualizar</button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row gap-8 pb-20 md:pb-0">
            <ActionModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} type={modal.type} />

            {/* Navegación */}
            <div className="hidden md:w-64 md:block bg-white rounded-2xl shadow-sm border p-3 flex flex-col gap-2 overflow-x-auto shrink-0 sticky top-20 z-10 h-fit no-scrollbar">
                {[
                    { id: 'DASHBOARD', label: 'Resumen', icon: LayoutDashboard },
                    { id: 'GRADES', label: 'Libro de Notas', icon: GraduationCap },
                    { id: 'ATTENDANCE', label: 'Asistencia', icon: CheckCircle },
                    { id: 'RESOURCES', label: 'Aula Virtual', icon: Link },
                    { id: 'NOTIFS', label: 'Avisos', icon: Bell },
                    { id: 'CONFIG', label: 'Configuración', icon: Settings },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === item.id ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                        <item.icon size={18} /> {item.label}
                    </button>
                ))}
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
                {activeTab === 'DASHBOARD' && renderDashboard()}

                {(activeTab !== 'DASHBOARD' && activeTab !== 'CONFIG') && (
                    <div className="space-y-6 animate-slide-up">
                        {renderCourseSelector()}
                        {selectedCourseId ? (
                            <>
                                {activeTab === 'GRADES' && renderGrades()}
                                {activeTab === 'ATTENDANCE' && renderAttendance()}
                                {activeTab === 'RESOURCES' && renderResources()}
                                {activeTab === 'NOTIFS' && renderNotifications()}
                            </>
                        ) : (
                            <div className="p-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed">
                                <BookOpen size={64} className="mx-auto mb-6 opacity-20" />
                                <p className="font-bold text-lg">Seleccione una clase para comenzar a gestionar.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'CONFIG' && renderConfig()}
            </div>

            {/* Bottom Navigation for Mobile */}
            <BottomNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                unreadCount={0}
                setNotifOpen={() => { }}
                handleLogout={() => { }}
                role="PROFESSOR"
            />
        </div>
    );
};