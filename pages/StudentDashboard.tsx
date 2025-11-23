import React, { useEffect, useState } from 'react';
import { useAuthStore, useAppStore } from '../store';
import { api } from '../services/api';
import { Enrollment, Course, Scholarship, ScholarshipApp, Notification, CourseResource } from '../types';
import { Calendar, Book, DollarSign, Edit2, Save, User as UserIcon, FileText, Download, Bell, Settings, Lock, PlusCircle, Check, Info, Link, Paperclip, GraduationCap } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid, YAxis } from 'recharts';
import { ActionModal } from '../components/ui/ModalSystem';
import { BottomNav } from '../components/BottomNav';

declare global {
    interface Window {
        jspdf: any;
    }
}

// Estilos de Input
const INPUT_CLASS = "w-full border border-gray-300 p-3 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm";

export const StudentDashboard: React.FC = () => {
    const { user, updateUser } = useAuthStore();
    const { notifications, markAsRead } = useAppStore();
    const [activeTab, setActiveTab] = useState('DASHBOARD');
    const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

    // Data States
    const [myCourses, setMyCourses] = useState<{ enrollment: Enrollment, course: Course }[]>([]);
    const [notes, setNotes] = useState('');
    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);

    // Resources State
    const [resources, setResources] = useState<{ courseName: string, items: CourseResource[] }[]>([]);

    // Modules Data
    const [scholarships, setScholarships] = useState<Scholarship[]>([]);
    const [myApps, setMyApps] = useState<ScholarshipApp[]>([]);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

    // Profile Edit
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({ phone: '', address: '', email: '' });
    const [newPassword, setNewPassword] = useState('');

    // Modals
    interface ModalState {
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'success' | 'danger' | 'confirm';
        onConfirm?: () => void;
        confirmText?: string;
        cancelText?: string;
    }
    const [modal, setModal] = useState<ModalState>({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        if (!user) return;
        setEditData({ phone: user.phone || '', address: user.address || '', email: user.email });
        setNotes(user.notes || '');
        loadDashboardData();
        loadCampusLogo();
    }, [user]);

    const loadCampusLogo = async () => {
        if (!user) return;
        const campuses = await api.campuses.list();
        const myCampus = campuses.find(c => c.id === user.campusId);
        if (myCampus && myCampus.logoUrl) setLogoUrl(myCampus.logoUrl);
    };

    const loadDashboardData = async () => {
        if (!user) return;
        const [data, st] = await Promise.all([
            api.student.getData(user.id),
            api.student.getStats(user.id)
        ]);
        setMyCourses(data.myCourses);
        setStats(st);
    };

    const handleApplyScholarship = async (schId: string) => {
        await api.scholarships.apply(user!.id, schId);
        setModal({
            isOpen: true, title: 'Solicitud Enviada', type: 'success',
            message: 'Tu solicitud ha sido registrada correctamente. Recibirás una notificación cuando sea revisada.',
            onConfirm: () => loadScholarships()
        });
    };

    const loadScholarships = async () => {
        const [sch, apps] = await Promise.all([
            api.scholarships.list(user!.campusId),
            api.scholarships.getMyApplications(user!.id)
        ]);
        setScholarships(sch);
        setMyApps(apps);
    };

    const loadResources = async () => {
        const resList = [];
        for (const mc of myCourses) {
            const r = await api.courses.getResources(mc.course.id);
            if (r.length > 0) resList.push({ courseName: mc.course.name, items: r });
        }
        setResources(resList);
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        await api.auth.updateProfile(user.id, editData);
        updateUser(editData);
        setEditMode(false);
        setModal({ isOpen: true, title: 'Perfil Actualizado', message: 'Tus datos de contacto se han guardado.', type: 'success' });
    };

    const handleSaveNotes = async () => {
        if (!user) return;
        await api.auth.updateProfile(user.id, { notes });
        updateUser({ notes });
        setModal({ isOpen: true, title: 'Bloc Guardado', message: 'Tus notas se han sincronizado correctamente.', type: 'success' });
    };

    const handleChangePassword = async () => {
        if (!newPassword) return;
        await api.auth.changePassword(user!.id, newPassword);
        setNewPassword('');
        setModal({ isOpen: true, title: 'Seguridad', message: 'Tu contraseña ha sido actualizada.', type: 'success' });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarUrl' | 'coverUrl') => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const url = ev.target?.result as string;
                api.auth.updateProfile(user!.id, { [field]: url });
                updateUser({ [field]: url });
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const addToNotes = (msg: string) => {
        const newNotes = (notes ? notes + '\n- ' : '- ') + msg;
        setNotes(newNotes);
        api.auth.updateProfile(user!.id, { notes: newNotes });
        updateUser({ notes: newNotes });
        setModal({ isOpen: true, title: 'Agregado', message: 'El contenido se ha copiado a tu Bloc de Notas.', type: 'success' });
    };

    const handleEnroll = async () => {
        if (selectedCourses.length === 0) return;

        setModal({
            isOpen: true,
            title: 'Confirmar Inscripción',
            message: `Vas a inscribir ${selectedCourses.length} asignaturas. ¿Deseas continuar?`,
            type: 'confirm',
            onConfirm: async () => {
                await api.student.enroll(user!.id, selectedCourses);
                setSelectedCourses([]);
                loadDashboardData();
                setActiveTab('DASHBOARD');

                setTimeout(() => {
                    setModal({
                        isOpen: true,
                        title: 'Inscripción Exitosa',
                        message: 'Tus clases han sido registradas. ¿Deseas descargar tu Hoja de Inscripción?',
                        type: 'success',
                        confirmText: 'Sí, Descargar',
                        cancelText: 'Cerrar',
                        onConfirm: downloadEnrollmentSlip
                    });
                }, 500);
            }
        });
    };

    // --- PDF GENERATORS ---

    const generateHeader = (doc: any, title: string) => {
        doc.setFillColor(30, 58, 138);
        doc.rect(0, 0, 210, 40, 'F');

        if (logoUrl) {
            try { doc.addImage(logoUrl, 'PNG', 10, 5, 30, 30); } catch (e) { }
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text("UniSystem", 105, 25, { align: 'center' });
        doc.setFontSize(10);
        doc.text("Universidad Nacional Multidisciplinaria", 105, 32, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text(title, 14, 55);

        doc.setFontSize(10);
        doc.text(`Estudiante: ${user?.name} ${user?.lastName}`, 14, 62);
        doc.text(`Carnet: ${user?.carnet}`, 14, 67);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 72);

        return 80;
    };

    const downloadEnrollmentSlip = () => {
        if (!window.jspdf) return;
        const enrolled = availableCourses.filter(c => selectedCourses.includes(c.id));
        const coursesToPrint = enrolled.length > 0 ? enrolled : myCourses.map(mc => mc.course);

        const doc = new window.jspdf.jsPDF();
        let y = generateHeader(doc, "Comprobante de Inscripción de Clases");

        const data = coursesToPrint.map(c => [c.code, c.name, c.credits, c.semester ? `Sem ${c.semester}` : '-', c.schedule || '']);

        (doc as any).autoTable({
            startY: y,
            head: [['Código', 'Asignatura', 'Créditos', 'Nivel', 'Horario']],
            body: data,
            theme: 'striped'
        });

        doc.save(`Inscripcion_${user?.carnet}.pdf`);
    };

    const downloadSchedule = () => {
        if (window.jspdf) {
            const doc = new window.jspdf.jsPDF();
            let y = generateHeader(doc, "Horario de Clases - Semestre Actual");

            const data = myCourses.map(c => [c.course.name, c.course.code, c.course.schedule, c.course.room || 'Virtual']);
            (doc as any).autoTable({
                head: [['Asignatura', 'Código', 'Horario', 'Aula']],
                body: data,
                startY: y,
                theme: 'grid',
                headStyles: { fillColor: [30, 58, 138] }
            });
            doc.save("horario.pdf");
        }
    };

    const downloadKardex = () => {
        if (window.jspdf) {
            const doc = new window.jspdf.jsPDF();
            let y = generateHeader(doc, "Historial Académico (Kardex)");

            const data = history.map(h => [h.term, h.code, h.name, h.credits, h.finalGrade || '-', h.status === 'ACTIVE' ? 'Cursando' : h.status]);
            (doc as any).autoTable({
                head: [['Periodo', 'Código', 'Asignatura', 'Créditos', 'Nota', 'Estado']],
                body: data,
                startY: y,
                theme: 'grid',
                headStyles: { fillColor: [30, 58, 138] }
            });
            doc.save("kardex_academico.pdf");
        }
    };

    const loadHistoryData = async () => {
        const h = await api.student.getHistory(user!.id);
        setHistory(h);
    };

    const loadEnrollmentData = async () => {
        const ac = await api.student.getAvailableCourses(user!.campusId, user!.careerId || '');
        const enrolledIds = myCourses.map(mc => mc.course.id);
        setAvailableCourses(ac.filter(c => !enrolledIds.includes(c.id)));
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 pb-20 md:pb-0">
            <ActionModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} type={modal.type} onConfirm={modal.onConfirm} confirmText={modal.confirmText} cancelText={modal.cancelText} />

            {/* Navegación Interna */}
            <div className="hidden md:w-64 md:block bg-white md:rounded-2xl md:shadow-sm md:border md:p-4 flex flex-col gap-2 overflow-x-auto shrink-0 sticky top-[52px] md:top-20 z-30 h-fit no-scrollbar shadow-md md:shadow-none">
                {[
                    { id: 'DASHBOARD', label: 'INICIO', icon: Book },
                    { id: 'PROFILE', label: 'PERFIL', icon: UserIcon },
                    { id: 'RESOURCES', label: 'AULA', icon: Link },
                    { id: 'NOTIFICATIONS', label: 'AVISOS', icon: Bell },
                    { id: 'ENROLL', label: 'INSCRIP', icon: PlusCircle },
                    { id: 'HISTORY', label: 'HISTORIAL', icon: FileText },
                    { id: 'SCHOLARSHIPS', label: 'BECAS', icon: DollarSign },
                    { id: 'CONFIG', label: 'AJUSTES', icon: Settings },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActiveTab(item.id);
                            if (item.id === 'SCHOLARSHIPS') loadScholarships();
                            if (item.id === 'HISTORY') loadHistoryData();
                            if (item.id === 'ENROLL') loadEnrollmentData();
                            if (item.id === 'RESOURCES') loadResources();
                        }}
                        className={`flex items-center justify-start gap-2 px-4 py-3 md:rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-1 md:flex-none
                            ${activeTab === item.id
                                ? 'md:bg-primary-50 md:text-primary-700 md:shadow-sm md:translate-x-1 border-b-4 border-white text-white'
                                : 'md:text-gray-500 md:hover:bg-gray-50 text-white/60 hover:text-white border-b-4 border-transparent'
                            }`}
                    >
                        <item.icon size={18} className="md:mr-1" /> <span className="hidden md:inline">{item.label === 'INICIO' ? 'Dashboard' : item.label === 'PERFIL' ? 'Mi Perfil' : item.label === 'AULA' ? 'Aula Virtual' : item.label === 'AVISOS' ? 'Notificaciones' : item.label === 'INSCRIP' ? 'Inscripción' : item.label === 'BECAS' ? 'Becas' : item.label === 'AJUSTES' ? 'Configuración' : item.label}</span>
                        <span className="md:hidden">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Área de Contenido */}
            <div className="flex-1 min-w-0 min-h-[calc(100vh-110px)] md:min-h-0">
                {activeTab === 'PROFILE' && user && (
                    <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-xl overflow-hidden animate-in slide-up hover:shadow-2xl transition-shadow duration-300">
                        <div className="h-48 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 relative group">
                            {user.coverUrl && <img src={user.coverUrl} className="w-full h-full object-cover opacity-90" />}
                            <label className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full cursor-pointer hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg">
                                <Edit2 size={18} />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'coverUrl')} />
                            </label>
                        </div>

                        <div className="px-8 pb-8">
                            <div className="flex justify-between items-end -mt-20 mb-6">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-purple-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                    <img src={user.avatarUrl} className="relative w-36 h-36 rounded-full object-cover border-4 border-white shadow-2xl bg-white ring-4 ring-primary-100" />
                                    <label className="absolute bottom-2 right-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-2.5 rounded-full cursor-pointer hover:from-primary-700 hover:to-primary-800 shadow-lg transform hover:scale-110 transition-all duration-200">
                                        <Edit2 size={16} />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatarUrl')} />
                                    </label>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">{user.name} {user.lastName}</h2>
                                <p className="text-primary-600 font-mono text-lg font-bold mt-1">{user.carnet}</p>
                            </div>
                            {/* Profile details rendering omitted for brevity, same as before */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-gray-50 p-6 rounded-2xl border">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><Lock size={12} /> Datos Académicos (Fijos)</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Carrera</span><span className="font-medium text-gray-900">{user.careerId || 'Sistemas'}</span></div>
                                        <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Código MINED</span><span className="font-medium text-gray-900">{user.minedCode || 'N/A'}</span></div>
                                        <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Cédula</span><span className="font-medium text-gray-900">{user.cedula || 'N/A'}</span></div>
                                        <div className="flex justify-between pt-1"><span className="text-gray-500">Campus</span><span className="font-medium text-gray-900">{user.campusId}</span></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-4"><h3 className="text-xs font-bold text-gray-400 uppercase">Datos de Contacto</h3><button onClick={() => editMode ? handleSaveProfile() : setEditMode(true)} className="text-primary-600 text-sm font-bold hover:underline">{editMode ? 'Guardar Cambios' : 'Editar Información'}</button></div>
                                    <div className="space-y-4">
                                        <div><label className="text-xs font-bold text-gray-500 mb-1 block">Dirección Domiciliar</label><input disabled={!editMode} value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} className={INPUT_CLASS + " disabled:bg-gray-100 disabled:text-gray-600"} /></div>
                                        <div><label className="text-xs font-bold text-gray-500 mb-1 block">Número de Teléfono</label><input disabled={!editMode} value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className={INPUT_CLASS + " disabled:bg-gray-100 disabled:text-gray-600"} /></div>
                                        <div><label className="text-xs font-bold text-gray-500 mb-1 block">Correo Electrónico</label><input disabled={!editMode} value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className={INPUT_CLASS + " disabled:bg-gray-100 disabled:text-gray-600"} /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- DASHBOARD --- */}
                {activeTab === 'DASHBOARD' && (
                    <div className="space-y-6 animate-in slide-up">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-gradient-to-br from-blue-50 to-primary-50 p-6 rounded-2xl border-2 border-blue-100 shadow-lg transform hover:scale-105 hover:shadow-2xl transition-all duration-300 group">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-primary-700 text-xs font-extrabold uppercase tracking-wider">Promedio Actual</p>
                                    <GraduationCap className="text-primary-400 group-hover:text-primary-600 transition-colors" size={24} />
                                </div>
                                <h3 className="text-5xl font-black text-primary-600 mt-2 tabular-nums">{stats?.average || 0}<span className="text-2xl">%</span></h3>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-100 shadow-lg transform hover:scale-105 hover:shadow-2xl transition-all duration-300 group">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-green-700 text-xs font-extrabold uppercase tracking-wider">Clases Aprobadas</p>
                                    <Book className="text-green-400 group-hover:text-green-600 transition-colors" size={24} />
                                </div>
                                <h3 className="text-5xl font-black text-green-600 mt-2 tabular-nums">{stats?.courses || 0}</h3>
                            </div>
                            <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200 flex flex-col md:row-span-2 relative shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-yellow-900 flex items-center gap-2"><Book size={18} /> Bloc de Notas</h3>
                                    <button onClick={handleSaveNotes} className="text-yellow-800 hover:bg-yellow-200 p-2 rounded-full transition-colors"><Save size={20} /></button>
                                </div>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full flex-1 bg-white/50 border border-yellow-200 rounded-lg p-3 resize-none outline-none text-sm text-gray-900 placeholder-yellow-800/40 focus:bg-white transition-colors" placeholder="Escribe aquí tus apuntes importantes..." rows={8}></textarea>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border shadow-sm">
                            <h3 className="font-bold text-lg mb-6 text-gray-900">Rendimiento Académico Actual</h3>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={myCourses.map(mc => ({ name: mc.course.code, nota: mc.enrollment.finalGrade || 0 }))}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="nota" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-xl p-6 hover:shadow-2xl transition-shadow">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-extrabold text-2xl text-gray-900 flex items-center gap-3"><Calendar size={28} className="text-primary-600" /> Horario Actual</h3>
                                <button onClick={downloadSchedule} className="text-white bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-2.5 hover:from-primary-700 hover:to-primary-800 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary-500/30 transform hover:scale-105"><Download size={16} /> PDF</button>
                            </div>
                            <div className="grid gap-4">
                                {myCourses.map((c, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-2xl border-2 border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all group">
                                        <div>
                                            <span className="font-bold text-lg text-gray-900 block group-hover:text-primary-700 transition-colors">{c.course.name}</span>
                                            <span className="text-sm text-gray-500 font-mono">{c.course.code}</span>
                                        </div>
                                        <div className="text-left sm:text-right mt-3 sm:mt-0 flex flex-col gap-2">
                                            <span className="text-sm text-white bg-gradient-to-r from-primary-600 to-purple-600 px-4 py-1.5 rounded-full shadow-md font-bold block w-fit ml-0 sm:ml-auto">{c.course.schedule}</span>
                                            <span className="text-xs text-gray-500 font-medium">Aula: {c.course.room}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'RESOURCES' && (
                    <div className="bg-white md:rounded-2xl md:border md:shadow-sm md:p-6 animate-in slide-up">
                        <h2 className="font-bold text-xl mb-6 text-gray-900 p-4 md:p-0 border-b md:border-none">Aula Virtual</h2>
                        <div className="space-y-6 md:px-0">
                            {resources.length === 0 ? (
                                <p className="text-center text-gray-400 py-10">Tus profesores no han subido recursos aún.</p>
                            ) : (
                                resources.map((group, idx) => (
                                    <div key={idx} className="border-b last:border-b-0 md:border md:rounded-xl overflow-hidden bg-white md:mb-4">
                                        <div className="bg-gray-50 p-3 md:border-b font-semibold text-gray-700 text-sm">{group.courseName}</div>
                                        <div className="divide-y">
                                            {group.items.map(r => (
                                                <div key={r.id} className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-primary-600">{r.type === 'LINK' ? <Link size={20} /> : <Paperclip size={20} />}</div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-sm">{r.title}</p>
                                                            <p className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <a href={r.url} target="_blank" className="text-xs bg-primary-100 text-primary-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-primary-200">
                                                        {r.type === 'LINK' ? 'Abrir' : 'Descargar'}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* --- HISTORY / KARDEX --- */}
                {activeTab === 'HISTORY' && (
                    <div className="bg-white rounded-2xl border shadow-sm p-6 animate-in slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-bold text-xl text-gray-900">Historial Académico</h2>
                            <button onClick={downloadKardex} className="text-primary-600 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                                <Download size={16} /> Descargar PDF
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-left">
                                    <tr>
                                        <th className="p-3">Periodo</th>
                                        <th className="p-3">Asignatura</th>
                                        <th className="p-3 text-center">Cortes (P1 / P2 / Ex)</th>
                                        <th className="p-3 text-center">Nota Final</th>
                                        <th className="p-3 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((h: any, i) => (
                                        <tr key={i} className="border-t hover:bg-gray-50">
                                            <td className="p-3 text-xs">{h.term}</td>
                                            <td className="p-3 font-bold text-gray-800">{h.name} <span className="text-xs text-gray-400 font-normal">({h.code})</span></td>
                                            <td className="p-3 text-center text-xs text-gray-500">
                                                {h.gradeP1 || '-'} / {h.gradeP2 || '-'} / {h.gradeExam || '-'}
                                            </td>
                                            <td className={`p-3 text-center font-bold ${h.finalGrade >= 60 ? 'text-green-600' : 'text-red-600'}`}>{h.finalGrade || '-'}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${h.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>{h.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- NOTIFICATIONS, CONFIG, ENROLL, SCHOLARSHIPS (Identical to previous, kept for completeness) --- */}
                {activeTab === 'NOTIFICATIONS' && (
                    <div className="bg-white md:rounded-2xl md:border md:shadow-sm md:p-6 animate-in slide-up">
                        <div className="flex justify-between items-center p-4 md:p-0 md:mb-6 border-b md:border-none">
                            <h2 className="font-bold text-xl text-gray-900">Centro de Notificaciones</h2>
                            <button onClick={() => markAsRead('ALL')} className="text-sm text-primary-600 hover:underline">Marcar todas</button>
                        </div>
                        <div className="space-y-0 md:space-y-4">
                            {notifications.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <Bell size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>No tienes notificaciones nuevas.</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} className={`p-4 flex gap-3 transition-all cursor-pointer hover:bg-gray-50 border-b last:border-b-0 md:border md:rounded-xl md:mb-2 ${n.read ? 'bg-white md:bg-gray-50 md:opacity-80' : 'bg-white'}`}>
                                        <div className="relative shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                                <UserIcon size={24} />
                                            </div>
                                            {!n.read && <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <h4 className="font-bold text-gray-900 truncate">{n.title}</h4>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 truncate">{n.message}</p>
                                            <div className="flex justify-between items-center mt-1 md:mt-2">
                                                <span className="text-xs text-gray-400 hidden md:inline">{new Date(n.date).toLocaleDateString()}</span>
                                                <button onClick={(e) => { e.stopPropagation(); addToNotes(`${n.title}: ${n.message}`); }} className="text-xs flex items-center gap-1 text-primary-600 hover:bg-primary-50 px-2 py-1 rounded font-bold ml-auto md:ml-0">
                                                    <Save size={12} /> <span className="hidden md:inline">Guardar</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'CONFIG' && (
                    <div className="bg-white rounded-2xl border shadow-sm p-8 animate-in slide-up max-w-lg mx-auto"><h2 className="font-bold text-xl mb-6 text-gray-900">Configuración de Cuenta</h2><div className="space-y-5"><div><label className="block text-sm font-bold text-gray-700 mb-2">Cambiar Contraseña</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nueva contraseña segura" className={INPUT_CLASS} /></div><button onClick={handleChangePassword} disabled={!newPassword} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-black transition-all">Actualizar Contraseña</button></div></div>
                )}
                {activeTab === 'ENROLL' && (
                    <div className="bg-white rounded-2xl border shadow-sm p-6 animate-in slide-up"><h2 className="font-bold text-xl mb-4 text-gray-900">Inscripción de Clases</h2><div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto no-scrollbar">{availableCourses.length === 0 ? <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl"><Info className="mx-auto mb-2" />No hay clases disponibles para inscribir en este momento.</div> : availableCourses.map(c => <label key={c.id} className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors bg-white"><input type="checkbox" className="w-5 h-5 text-primary-600 rounded bg-white border-gray-300" checked={selectedCourses.includes(c.id)} onChange={(e) => { if (e.target.checked) setSelectedCourses([...selectedCourses, c.id]); else setSelectedCourses(selectedCourses.filter(id => id !== c.id)); }} /><div className="flex-1"><span className="font-bold block text-gray-900">{c.name}</span><span className="text-xs text-gray-500">{c.code} • {c.credits} Créditos • {c.schedule}</span></div></label>)}</div><button onClick={handleEnroll} disabled={selectedCourses.length === 0} className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:shadow-none hover:bg-primary-700 transition-all">Inscribir Clases</button></div>
                )}
                {activeTab === 'SCHOLARSHIPS' && (
                    <div className="space-y-6 animate-in slide-up">
                        <div className="bg-white md:p-6 md:rounded-2xl md:border md:shadow-sm">
                            <h2 className="font-bold text-xl mb-4 text-gray-900 p-4 md:p-0 border-b md:border-none">Becas Disponibles</h2>
                            <div className="grid gap-0 md:gap-4">
                                {scholarships.length === 0 && <p className="text-gray-400 p-4">No hay convocatorias activas.</p>}
                                {scholarships.map(s => {
                                    const applied = myApps.some(a => a.scholarshipId === s.id);
                                    return (
                                        <div key={s.id} className="p-4 border-b last:border-b-0 md:border md:rounded-xl bg-white md:bg-gray-50 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-gray-900">{s.name}</h3>
                                                <p className="text-sm text-gray-600">{s.description}</p>
                                                <p className="text-xs text-gray-500 mt-1">Requisitos: {s.requirements}</p>
                                            </div>
                                            {applied ?
                                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Solicitada</span> :
                                                <button onClick={() => handleApplyScholarship(s.id)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700">Aplicar</button>
                                            }
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="bg-white md:p-6 md:rounded-2xl md:border md:shadow-sm">
                            <h2 className="font-bold text-xl mb-4 text-gray-900 p-4 md:p-0 border-b md:border-none">Mis Solicitudes</h2>
                            <div className="space-y-0 md:space-y-3">
                                {myApps.length === 0 && <p className="text-gray-400 p-4">No has enviado solicitudes.</p>}
                                {myApps.map(a => (
                                    <div key={a.id} className="p-4 border-b last:border-b-0 md:border md:rounded-xl flex justify-between items-center bg-white">
                                        <div>
                                            <span className="font-bold text-gray-900">{a.scholarshipName}</span>
                                            <span className="text-xs text-gray-500 block">{a.date.split('T')[0]}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${a.status === 'APPROVED' ? 'bg-green-100 text-green-700' : a.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>{a.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation for Mobile */}
            <BottomNav
                activeTab={activeTab}
                setActiveTab={(tab) => {
                    setActiveTab(tab);
                    if (tab === 'SCHOLARSHIPS') loadScholarships();
                    if (tab === 'HISTORY') loadHistoryData();
                    if (tab === 'ENROLL') loadEnrollmentData();
                    if (tab === 'RESOURCES') loadResources();
                }}
                unreadCount={notifications.filter(n => !n.read).length}
                setNotifOpen={() => { }}
                handleLogout={() => { }}
                role="STUDENT"
            />
        </div>
    );
};