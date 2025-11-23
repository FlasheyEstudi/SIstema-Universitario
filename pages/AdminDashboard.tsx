import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { api } from '../services/api';
import { Course, Role, User, Campus, Scholarship, ScholarshipApp, Career, ScholarshipStats } from '../types';
import { Users, BookOpen, GraduationCap, Building2, UserPlus, DollarSign, Bell, CheckCircle, XCircle, Settings, Plus, BarChart2, Search, FileText, Download, Edit3, ClipboardList, Printer, Upload, Trash2, Send, Clock, UserCheck } from 'lucide-react';
import { SEMESTERS, CENTRAL_CAMPUS_CODE } from '../constants';
import { ActionModal } from '../components/ui/ModalSystem';
import { BottomNav } from '../components/BottomNav';

declare global {
    interface Window {
        jspdf: any;
    }
}

// Estilos comunes para inputs
const INPUT_CLASS = "border border-gray-300 p-3 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all w-full";
const SELECT_CLASS = "border border-gray-300 p-3 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all w-full";

// Helper para PDFs
const generatePDFHeader = (doc: any, title: string, subtitle?: string, logoUrl?: string) => {
    doc.setFillColor(30, 58, 138); // Primary 900
    doc.rect(0, 0, 210, 40, 'F');

    // Render Logo if exists
    if (logoUrl) {
        try {
            doc.addImage(logoUrl, 'PNG', 10, 5, 30, 30);
        } catch (e) { console.error("Error adding logo", e); }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("UniSystem", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text("Universidad Nacional Multidisciplinaria", 105, 28, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text(title, 14, 55);
    if (subtitle) {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(subtitle, 14, 62);
    }
    return 70; // Retorna posición Y inicial para contenido
};

const OverviewModule = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
        <div className="bg-gradient-to-br from-blue-50 to-primary-50 p-8 rounded-3xl border-2 border-blue-100 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 group">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-primary-600 rounded-2xl text-white mb-4 w-fit shadow-lg"><Users size={36} /></div>
            <h3 className="text-primary-700 text-xs font-extrabold uppercase tracking-wider">Estudiantes Activos</h3>
            <p className="text-6xl font-black text-primary-600 mt-3 tabular-nums">{stats?.totalStudents || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-3xl border-2 border-green-100 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 group">
            <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white mb-4 w-fit shadow-lg"><GraduationCap size={36} /></div>
            <h3 className="text-green-700 text-xs font-extrabold uppercase tracking-wider">Personal Docente</h3>
            <p className="text-6xl font-black text-green-600 mt-3 tabular-nums">{stats?.totalProfessors || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl border-2 border-purple-100 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 group">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl text-white mb-4 w-fit shadow-lg"><BookOpen size={36} /></div>
            <h3 className="text-purple-700 text-xs font-extrabold uppercase tracking-wider">Carreras Ofertadas</h3>
            <p className="text-6xl font-black text-purple-600 mt-3 tabular-nums">{stats?.activeCareers || 0}</p>
        </div>
    </div>
);

const UsersModule = ({ careers, onCreate, campusId, logoUrl, setModal }: any) => {
    const [role, setRole] = useState<Role>(Role.STUDENT);
    const [data, setData] = useState<Partial<User>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({ ...data, campusId }, role);

        if (role === Role.STUDENT) {
            setModal({
                isOpen: true,
                title: 'Estudiante Registrado',
                message: 'El usuario ha sido creado. ¿Desea descargar la Ficha de Matrícula ahora?',
                type: 'success',
                confirmText: 'Sí, Descargar',
                onConfirm: generateRegistrationPDF
            });
        } else {
            setModal({ isOpen: true, title: 'Profesor Registrado', message: 'El docente ha sido añadido al sistema.', type: 'success' });
        }
        setData({});
    };

    const generateRegistrationPDF = () => {
        if (!window.jspdf) return;
        const doc = new window.jspdf.jsPDF();
        let y = generatePDFHeader(doc, "Ficha de Matrícula - Nuevo Ingreso", `Fecha: ${new Date().toLocaleDateString()}`, logoUrl);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        const fields = [
            ['Nombre Completo:', `${data.name || ''} ${data.lastName || ''}`],
            ['Cédula:', data.cedula || 'N/A'],
            ['Dirección:', data.address || 'N/A'],
            ['Teléfono:', data.phone || 'N/A'],
            ['Correo Institucional:', data.email || 'N/A'],
            ['Contraseña Inicial:', data.password || '123456'],
            ['', ''],
            ['DATOS ACADÉMICOS', ''],
            ['Carnet:', data.carnet || 'Generado por Sistema'],
            ['Código MINED:', data.minedCode || 'N/A'],
            ['Carrera:', careers.find((c: Career) => c.id === data.careerId)?.name || 'N/A'],
            ['Recinto:', campusId]
        ];

        (doc as any).autoTable({
            startY: y,
            head: [],
            body: fields,
            theme: 'plain',
            styles: { fontSize: 12, cellPadding: 3 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
        });

        doc.text("__________________________", 105, 250, { align: 'center' });
        doc.text("Firma de Responsable de Registro", 105, 256, { align: 'center' });

        doc.save(`Ficha_Matricula_${data.carnet || 'Nuevo'}.pdf`);
    };

    return (
        <div className="bg-white p-8 rounded-2xl border shadow-sm">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-900"><UserPlus className="text-primary-600" /> Matrícula y Registro</h2>

            <div className="flex gap-4 mb-8 border-b pb-6">
                <button onClick={() => setRole(Role.STUDENT)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${role === Role.STUDENT ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Matrícula Estudiante</button>
                <button onClick={() => setRole(Role.PROFESSOR)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${role === Role.PROFESSOR ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Registrar Profesor</button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Campos Comunes */}
                <input required placeholder="Nombres" className={INPUT_CLASS} value={data.name || ''} onChange={e => setData({ ...data, name: e.target.value })} />
                <input required placeholder="Apellidos" className={INPUT_CLASS} value={data.lastName || ''} onChange={e => setData({ ...data, lastName: e.target.value })} />
                <input required placeholder="Cédula de Identidad" className={INPUT_CLASS} value={data.cedula || ''} onChange={e => setData({ ...data, cedula: e.target.value })} />
                <input required placeholder="Email Institucional" type="email" className={INPUT_CLASS} value={data.email || ''} onChange={e => setData({ ...data, email: e.target.value })} />
                <input required placeholder="Contraseña Inicial" type="text" className={INPUT_CLASS} value={data.password || ''} onChange={e => setData({ ...data, password: e.target.value })} />
                <input required placeholder="Dirección Domiciliar" className={INPUT_CLASS} value={data.address || ''} onChange={e => setData({ ...data, address: e.target.value })} />
                <input required placeholder="Teléfono" className={INPUT_CLASS} value={data.phone || ''} onChange={e => setData({ ...data, phone: e.target.value })} />

                {role === Role.STUDENT && (
                    <>
                        <div className="border-t col-span-1 md:col-span-2 my-2 pt-4"><p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Datos Académicos</p></div>
                        <input required placeholder="Número de Carnet (202X-XXXX)" className={INPUT_CLASS} value={data.carnet || ''} onChange={e => setData({ ...data, carnet: e.target.value })} />
                        <input required placeholder="Código MINED" className={INPUT_CLASS} value={data.minedCode || ''} onChange={e => setData({ ...data, minedCode: e.target.value })} />
                        <select className={SELECT_CLASS} required value={data.careerId || ''} onChange={e => setData({ ...data, careerId: e.target.value })}>
                            <option value="">Seleccionar Carrera</option>
                            {careers.map((c: Career) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </>
                )}

                {role === Role.PROFESSOR && (
                    <>
                        <div className="border-t col-span-1 md:col-span-2 my-2 pt-4"><p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Datos Profesionales</p></div>
                        <input required placeholder="Profesión / Título" className={`${INPUT_CLASS} md:col-span-2`} value={data.profession || ''} onChange={e => setData({ ...data, profession: e.target.value })} />
                    </>
                )}

                <div className="md:col-span-2 mt-6">
                    <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg">
                        {role === Role.STUDENT ? 'Finalizar Matrícula e Imprimir Ficha' : 'Guardar Registro'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const AcademicModule = ({ students, courses, onEnroll, logoUrl, setModal }: any) => {
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
    const [filterTerm, setFilterTerm] = useState('');

    const filteredStudents = students.filter((s: User) =>
        (s.name + ' ' + s.lastName).toLowerCase().includes(filterTerm.toLowerCase()) ||
        s.carnet?.includes(filterTerm)
    );

    const handleEnroll = () => {
        if (!selectedStudent || selectedCourses.size === 0) return;

        setModal({
            isOpen: true,
            title: 'Confirmar Inscripción',
            message: `¿Matricular ${selectedCourses.size} clases al estudiante seleccionado?`,
            type: 'confirm',
            onConfirm: () => {
                onEnroll(selectedStudent, Array.from(selectedCourses));
                setSelectedCourses(new Set());
                setModal({
                    isOpen: true,
                    title: 'Inscripción Exitosa',
                    message: 'Matrícula procesada correctamente. ¿Descargar Hoja de Inscripción?',
                    type: 'success',
                    confirmText: 'Sí, Descargar',
                    onConfirm: generateEnrollmentPDF
                });
            }
        });
    };

    const generateEnrollmentPDF = () => {
        if (!window.jspdf) return;
        const student = students.find((s: User) => s.id === selectedStudent);
        const enrolledCourses = courses.filter((c: Course) => selectedCourses.has(c.id));
        const doc = new window.jspdf.jsPDF();

        let y = generatePDFHeader(doc, "Hoja de Inscripción de Clases", `Periodo: 2024-1`, logoUrl);

        doc.setFontSize(10);
        doc.text(`Estudiante: ${student?.name} ${student?.lastName}`, 14, y);
        doc.text(`Carnet: ${student?.carnet}`, 14, y + 6);
        doc.text(`Fecha Impresión: ${new Date().toLocaleDateString()}`, 140, y);

        const tableData = enrolledCourses.map((c: Course) => [
            c.code, c.name, c.credits, `Sem ${c.semester}`, c.schedule || 'Por definir'
        ]);

        (doc as any).autoTable({
            startY: y + 15,
            head: [['Código', 'Asignatura', 'Créditos', 'Nivel', 'Horario']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 58, 138] }
        });

        doc.save(`Matricula_${student?.carnet}.pdf`);
    };

    return (
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen size={20} /> Inscripción de Clases</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="border-r pr-6">
                    <h3 className="font-semibold mb-2 text-gray-700">1. Seleccionar Estudiante</h3>
                    <div className="relative mb-4">
                        <input className={`${INPUT_CLASS} pl-10`} placeholder="Buscar por nombre o carnet..." value={filterTerm} onChange={e => setFilterTerm(e.target.value)} />
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    </div>
                    <div className="h-96 overflow-y-auto border rounded-xl divide-y">
                        {filteredStudents.map((s: User) => (
                            <div key={s.id} onClick={() => setSelectedStudent(s.id)} className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedStudent === s.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                                <p className="font-bold text-gray-900">{s.name} {s.lastName}</p>
                                <p className="text-xs text-gray-500 font-mono">{s.carnet} • {s.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-2 text-gray-700">2. Oferta Académica</h3>
                    <div className="h-96 overflow-y-auto border rounded-xl p-3 bg-gray-50">
                        {courses.map((c: Course) => (
                            <label key={c.id} className="flex items-start gap-3 mb-2 p-3 bg-white rounded-lg border hover:shadow-md cursor-pointer transition-all">
                                <input type="checkbox" className="mt-1 w-4 h-4 text-primary-600 rounded" checked={selectedCourses.has(c.id)} onChange={(e) => {
                                    const s = new Set(selectedCourses);
                                    e.target.checked ? s.add(c.id) : s.delete(c.id);
                                    setSelectedCourses(s);
                                }} />
                                <div>
                                    <span className="text-sm font-bold block text-gray-900">{c.name}</span>
                                    <span className="text-xs text-gray-500 font-mono">{c.code} • Sem {c.semester} • {c.schedule}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                    <button onClick={handleEnroll} disabled={!selectedStudent || selectedCourses.size === 0} className="w-full mt-4 bg-primary-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-primary-700 shadow-lg shadow-primary-500/30">
                        Procesar Inscripción
                    </button>
                </div>
            </div>
        </div>
    );
};

const PensumModule = ({ careers, courses, campusId, professors, reloadData, logoUrl }: any) => {
    const [newCareer, setNewCareer] = useState({ name: '', faculty: '' });
    const [newCourse, setNewCourse] = useState<Partial<Course>>({ semester: 1 });
    const [selectedCareer, setSelectedCareer] = useState<string>('');

    // Assign Professor State
    const [assignProf, setAssignProf] = useState<{ courseId: string, professorId: string } | null>(null);

    const handleCreateCareer = async () => {
        if (!newCareer.name) return;
        await api.admin.createCareer({ ...newCareer, campusId });
        setNewCareer({ name: '', faculty: '' });
        reloadData();
    };

    const handleCreateCourse = async () => {
        if (!newCourse.name || !selectedCareer) return;
        await api.admin.createCourse({ ...newCourse, careerId: selectedCareer, campusId });
        setNewCourse({ ...newCourse, name: '', code: '' });
        reloadData();
    };

    const handleAssignProfessor = async () => {
        if (!assignProf) return;
        await api.courses.update(assignProf.courseId, { professorId: assignProf.professorId });
        setAssignProf(null);
        reloadData();
    };

    const generatePensumPDF = () => {
        if (!window.jspdf || !selectedCareer) return;
        const career = careers.find((c: Career) => c.id === selectedCareer);
        const careerCourses = courses.filter((c: Course) => c.careerId === selectedCareer);
        const doc = new window.jspdf.jsPDF();

        let y = generatePDFHeader(doc, "Pensum Académico", `Carrera: ${career.name}`, logoUrl);

        const data = careerCourses.sort((a: Course, b: Course) => (a.semester || 0) - (b.semester || 0)).map((c: Course) => [
            `Sem ${c.semester}`, c.code, c.name, c.credits, c.schedule || 'No definido'
        ]);

        (doc as any).autoTable({
            startY: y + 10,
            head: [['Nivel', 'Código', 'Asignatura', 'Créditos', 'Horario']],
            body: data,
            theme: 'grid',
            headStyles: { fillColor: [30, 58, 138] }
        });
        doc.save(`Pensum_${career.name}.pdf`);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {/* Gestión de Carreras */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900"><ClipboardList size={20} /> Gestión de Carreras</h3>
                <div className="flex gap-2 mb-6 bg-gray-50 p-3 rounded-lg">
                    <input className={INPUT_CLASS} placeholder="Nombre de Carrera" value={newCareer.name} onChange={e => setNewCareer({ ...newCareer, name: e.target.value })} />
                    <input className={INPUT_CLASS} placeholder="Facultad" value={newCareer.faculty} onChange={e => setNewCareer({ ...newCareer, faculty: e.target.value })} />
                    <button onClick={handleCreateCareer} className="bg-gray-900 text-white p-3 rounded-lg hover:bg-black"><Plus size={20} /></button>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {careers.map((c: Career) => (
                        <div key={c.id} onClick={() => setSelectedCareer(c.id)} className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 flex justify-between items-center transition-all ${selectedCareer === c.id ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' : ''}`}>
                            <span className="font-bold text-gray-800">{c.name}</span>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">{c.faculty}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gestión de Asignaturas */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900">Asignaturas de Carrera</h3>
                    {selectedCareer && <button onClick={generatePensumPDF} className="text-primary-600 text-sm font-bold flex items-center gap-1 hover:underline"><Download size={14} /> PDF</button>}
                </div>

                {selectedCareer ? (
                    <>
                        <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50 p-4 rounded-xl">
                            <h4 className="col-span-2 text-xs font-bold text-gray-500 uppercase">Crear Nueva Materia</h4>
                            <input className={INPUT_CLASS} placeholder="Nombre Asignatura" value={newCourse.name || ''} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} />
                            <input className={INPUT_CLASS} placeholder="Código" value={newCourse.code || ''} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} />
                            <select className={SELECT_CLASS} value={newCourse.semester} onChange={e => setNewCourse({ ...newCourse, semester: parseInt(e.target.value) })}>
                                {SEMESTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            <input className={INPUT_CLASS} type="number" placeholder="Créditos" value={newCourse.credits || ''} onChange={e => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) })} />
                            <input className={INPUT_CLASS} placeholder="Horario" value={newCourse.schedule || ''} onChange={e => setNewCourse({ ...newCourse, schedule: e.target.value })} />
                            <select className={SELECT_CLASS} value={newCourse.professorId || ''} onChange={e => setNewCourse({ ...newCourse, professorId: e.target.value })}>
                                <option value="">Asignar Docente...</option>
                                {professors.map((p: User) => <option key={p.id} value={p.id}>{p.name} {p.lastName}</option>)}
                            </select>
                        </div>
                        <button onClick={handleCreateCourse} className="w-full bg-primary-600 text-white py-2 rounded-lg font-bold mb-4 shadow-sm hover:bg-primary-700">Agregar Asignatura</button>

                        <div className="h-96 overflow-y-auto space-y-2 pr-1">
                            {courses.filter((c: Course) => c.careerId === selectedCareer).map((c: Course) => {
                                const prof = professors.find((p: User) => p.id === c.professorId);
                                return (
                                    <div key={c.id} className="p-3 bg-white border rounded-lg text-sm hover:shadow-sm transition-shadow">
                                        <div className="flex justify-between font-bold text-gray-900 items-start">
                                            <span>{c.name}</span>
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">Sem {c.semester}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1 mb-2">
                                            <span>{c.code} • {c.credits} Cr.</span>
                                            <span>{c.schedule}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t pt-2 mt-2">
                                            <div className="flex items-center gap-2">
                                                <UserCheck size={14} className="text-gray-400" />
                                                <span className={`text-xs ${prof ? 'text-gray-700 font-medium' : 'text-red-400 italic'}`}>
                                                    {prof ? `${prof.name} ${prof.lastName}` : 'Sin Asignar'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setAssignProf({ courseId: c.id, professorId: c.professorId || '' })}
                                                className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded font-bold border border-blue-100 flex items-center gap-1"
                                            >
                                                <Edit3 size={12} /> Reasignar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="text-center text-gray-400 py-20 flex flex-col items-center">
                        <ClipboardList size={48} className="opacity-20 mb-4" />
                        <p>Seleccione una carrera para ver y gestionar su pensum.</p>
                    </div>
                )}
            </div>

            {/* Modal para asignar profesor */}
            {assignProf && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-lg mb-4">Asignar Docente</h3>
                        <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Seleccione Profesor</label>
                        <select
                            className={SELECT_CLASS}
                            value={assignProf.professorId}
                            onChange={e => setAssignProf({ ...assignProf, professorId: e.target.value })}
                        >
                            <option value="">-- Sin Asignar --</option>
                            {professors.map((p: User) => <option key={p.id} value={p.id}>{p.name} {p.lastName}</option>)}
                        </select>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setAssignProf(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold">Cancelar</button>
                            <button onClick={handleAssignProfessor} className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-bold">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const HistoryModule = ({ students, logoUrl }: any) => {
    const [selectedStudent, setSelectedStudent] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [filter, setFilter] = useState('');
    const [editGrade, setEditGrade] = useState<{ id: string, grade: number } | null>(null);

    const loadHistory = async (sid: string) => {
        setSelectedStudent(sid);
        const data = await api.admin.getStudentHistory(sid);
        setHistory(data);
    };

    const handleUpdateGrade = async () => {
        if (!editGrade) return;
        await api.admin.updateGrade(editGrade.id, editGrade.grade);
        setEditGrade(null);
        loadHistory(selectedStudent);
    };

    const filtered = students.filter((s: User) => s.name.toLowerCase().includes(filter.toLowerCase()) || s.carnet?.includes(filter));

    const downloadKardexPDF = () => {
        if (!window.jspdf || !selectedStudent) return;
        const student = students.find((s: User) => s.id === selectedStudent);
        const doc = new window.jspdf.jsPDF();
        let y = generatePDFHeader(doc, "Historial Académico Oficial", `Estudiante: ${student.name} ${student.lastName}`, logoUrl);

        doc.text(`Carnet: ${student.carnet}`, 14, y);
        doc.text(`Fecha Emisión: ${new Date().toLocaleDateString()}`, 14, y + 6);

        const data = history.map(h => [h.term, h.code, h.courseName, h.credits, h.finalGrade || '-', h.status]);
        (doc as any).autoTable({
            startY: y + 15,
            head: [['Periodo', 'Código', 'Asignatura', 'Créditos', 'Nota', 'Estado']],
            body: data,
            theme: 'striped'
        });
        doc.save(`Kardex_${student.carnet}.pdf`);
    };

    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <h3 className="font-bold mb-4 text-gray-900">Buscar Estudiante</h3>
                <input className={INPUT_CLASS + " mb-4"} placeholder="Nombre o Carnet..." value={filter} onChange={e => setFilter(e.target.value)} />
                <div className="h-96 overflow-y-auto space-y-1">
                    {filtered.map((s: User) => (
                        <div key={s.id} onClick={() => loadHistory(s.id)} className={`p-3 rounded-lg cursor-pointer text-sm ${selectedStudent === s.id ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'hover:bg-gray-50 text-gray-700'}`}>
                            <p className="font-bold">{s.name} {s.lastName}</p>
                            <p className="text-xs opacity-70">{s.carnet}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-gray-900">Kardex Académico</h3>
                    {selectedStudent && <button onClick={downloadKardexPDF} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex gap-2"><Download size={16} /> Exportar PDF</button>}
                </div>

                {selectedStudent ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="p-3 text-left">Periodo</th>
                                    <th className="p-3 text-left">Asignatura</th>
                                    <th className="p-3 text-center">Nota</th>
                                    <th className="p-3 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {history.map((h, i) => (
                                    <tr key={i}>
                                        <td className="p-3 text-gray-500">{h.term}</td>
                                        <td className="p-3 font-medium text-gray-900">{h.courseName} <span className="text-gray-400 text-xs">({h.code})</span></td>
                                        <td className="p-3 text-center font-bold">{h.finalGrade || '-'}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => setEditGrade({ id: h.enrollmentId, grade: h.finalGrade || 0 })} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit3 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p>Seleccione un estudiante para ver su historial.</p>
                    </div>
                )}
            </div>

            {/* Modal Edición Nota */}
            {editGrade && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-80">
                        <h3 className="font-bold mb-4">Corregir Nota</h3>
                        <input type="number" min={0} max={100} className={INPUT_CLASS} value={editGrade.grade} onChange={e => setEditGrade({ ...editGrade, grade: parseInt(e.target.value) })} />
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setEditGrade(null)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancelar</button>
                            <button onClick={handleUpdateGrade} className="flex-1 bg-primary-600 text-white py-2 rounded-lg">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ScholarshipsModule = ({ scholarships, apps, campusId, reloadData, analysis }: any) => {
    const [subTab, setSubTab] = useState<'LIST' | 'APPS' | 'ANALYSIS'>('LIST');
    const [newSch, setNewSch] = useState<Partial<Scholarship>>({});

    const handleCreate = async () => {
        if (!newSch.name || !newSch.amount) return;
        await api.scholarships.create({ ...newSch, campusId });
        setNewSch({});
        reloadData();
    };

    const handleStatus = async (id: string, status: string) => {
        await api.scholarships.updateApplication(id, status);
        reloadData();
    };

    return (
        <div className="bg-white rounded-2xl border shadow-sm p-6">
            <div className="flex gap-4 mb-6 border-b pb-4">
                <button onClick={() => setSubTab('LIST')} className={`font-bold pb-2 ${subTab === 'LIST' ? 'text-primary-600 border-b-2 border-primary-600' : ''}`}>Programas de Beca</button>
                <button onClick={() => setSubTab('APPS')} className={`font-bold pb-2 ${subTab === 'APPS' ? 'text-primary-600 border-b-2 border-primary-600' : ''}`}>Solicitudes</button>
                <button onClick={() => setSubTab('ANALYSIS')} className={`font-bold pb-2 ${subTab === 'ANALYSIS' ? 'text-primary-600 border-b-2 border-primary-600' : ''}`}>Análisis Financiero</button>
            </div>

            {subTab === 'LIST' && (
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-50 rounded-xl h-fit">
                        <h4 className="font-bold mb-4 text-gray-900">Crear Nueva Beca</h4>
                        <input className={INPUT_CLASS + " mb-2"} placeholder="Nombre de la Beca" value={newSch.name || ''} onChange={e => setNewSch({ ...newSch, name: e.target.value })} />
                        <textarea className={INPUT_CLASS + " mb-2"} placeholder="Descripción" value={newSch.description || ''} onChange={e => setNewSch({ ...newSch, description: e.target.value })} />
                        <textarea className={INPUT_CLASS + " mb-2"} placeholder="Requisitos" value={newSch.requirements || ''} onChange={e => setNewSch({ ...newSch, requirements: e.target.value })} />
                        <input type="number" className={INPUT_CLASS + " mb-4"} placeholder="Monto Mensual" value={newSch.amount || ''} onChange={e => setNewSch({ ...newSch, amount: parseInt(e.target.value) })} />
                        <button onClick={handleCreate} className="w-full bg-primary-600 text-white py-2 rounded-lg font-bold">Crear Programa</button>
                    </div>
                    <div className="md:col-span-2 grid gap-4">
                        {scholarships.map((s: Scholarship) => (
                            <div key={s.id} className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm">
                                <div>
                                    <h4 className="font-bold text-gray-900">{s.name}</h4>
                                    <p className="text-sm text-gray-600">{s.description}</p>
                                    <p className="text-xs text-blue-600 font-bold mt-1">Monto: C$ {s.amount}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.active ? 'Activa' : 'Inactiva'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {subTab === 'APPS' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-left">
                            <tr>
                                <th className="p-3">Estudiante</th>
                                <th className="p-3">Beca Solicitada</th>
                                <th className="p-3">Fecha</th>
                                <th className="p-3">Estado</th>
                                <th className="p-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {apps.map((a: ScholarshipApp) => (
                                <tr key={a.id} className="border-t">
                                    <td className="p-3 font-bold">{a.studentName}</td>
                                    <td className="p-3">{a.scholarshipName}</td>
                                    <td className="p-3 text-gray-500">{a.date.split('T')[0]}</td>
                                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${a.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : a.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span></td>
                                    <td className="p-3 flex justify-center gap-2">
                                        <button onClick={() => handleStatus(a.id, 'APPROVED')} className="text-green-600 hover:bg-green-50 p-1 rounded font-bold text-xs border border-green-200">Aprobar</button>
                                        <button onClick={() => handleStatus(a.id, 'REJECTED')} className="text-red-600 hover:bg-red-50 p-1 rounded font-bold text-xs border border-red-200">Rechazar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {subTab === 'ANALYSIS' && (
                <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                        <h4 className="text-blue-900 font-bold">Presupuesto Mensual</h4>
                        <p className="text-4xl font-bold text-blue-600 mt-2">C$ {analysis?.totalBudget || 0}</p>
                    </div>
                    <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                        <h4 className="text-green-900 font-bold">Becas Activas</h4>
                        <p className="text-4xl font-bold text-green-600 mt-2">{analysis?.activeScholarships || 0}</p>
                    </div>
                    <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                        <h4 className="text-yellow-900 font-bold">Estudiantes Aptos (Sin Beca)</h4>
                        <p className="text-4xl font-bold text-yellow-600 mt-2">{analysis?.eligibleStudentsCount || 0}</p>
                        <p className="text-xs text-yellow-700 mt-2">Promedio {'>'} 85%</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const NotificationModule = ({ campusId, setModal }: any) => {
    const [msg, setMsg] = useState({ title: '', message: '', recipientId: 'ALL' });
    const [view, setView] = useState<'SEND' | 'HISTORY'>('SEND');
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (view === 'HISTORY') {
            loadHistory();
        }
    }, [view]);

    const loadHistory = async () => {
        try {
            const data = await api.notifications.getAllGlobal();
            setHistory(data);
        } catch (e) { console.error(e); }
    };

    const handleSend = async () => {
        if (!msg.title || !msg.message) return;
        await api.notifications.send({
            senderId: 'ADMIN',
            recipientId: msg.recipientId,
            title: msg.title,
            message: msg.message,
            type: 'INFO'
        });
        setMsg({ ...msg, title: '', message: '' });
        setModal({ isOpen: true, title: 'Enviado', message: 'La notificación ha sido enviada exitosamente.', type: 'success' });
    };

    return (
        <div className="bg-white p-8 rounded-2xl border shadow-sm max-w-4xl mx-auto">
            <div className="flex justify-center gap-4 mb-8">
                <button onClick={() => setView('SEND')} className={`px-6 py-2 rounded-full font-bold transition-all ${view === 'SEND' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Enviar Mensaje</button>
                <button onClick={() => setView('HISTORY')} className={`px-6 py-2 rounded-full font-bold transition-all ${view === 'HISTORY' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Historial del Sistema</button>
            </div>

            {view === 'SEND' ? (
                <>
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><Send size={32} /></div>
                        <h2 className="text-2xl font-bold text-gray-900">Difusión de Mensajes</h2>
                        <p className="text-gray-500">Envíe avisos importantes a toda la comunidad estudiantil o usuarios específicos.</p>
                    </div>

                    <div className="space-y-4 max-w-lg mx-auto">
                        <div>
                            <label className="font-bold text-gray-700 block mb-2">Destinatario</label>
                            <select className={SELECT_CLASS} value={msg.recipientId} onChange={e => setMsg({ ...msg, recipientId: e.target.value })}>
                                <option value="ALL">Todos los Usuarios del Recinto</option>
                                {/* Se podría extender para cargar lista de usuarios */}
                            </select>
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-2">Título del Aviso</label>
                            <input className={INPUT_CLASS} placeholder="Ej: Suspensión de Clases" value={msg.title} onChange={e => setMsg({ ...msg, title: e.target.value })} />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-2">Contenido</label>
                            <textarea className={INPUT_CLASS + " h-32"} placeholder="Escriba el detalle del comunicado..." value={msg.message} onChange={e => setMsg({ ...msg, message: e.target.value })} />
                        </div>
                        <button onClick={handleSend} className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all">
                            Enviar Notificación
                        </button>
                    </div>
                </>
            ) : (
                <div className="animate-fade-in">
                    <h2 className="font-bold text-xl mb-4 text-gray-900">Historial Global de Notificaciones</h2>
                    <div className="overflow-x-auto border rounded-xl">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3">Remitente</th>
                                    <th className="p-3">Destinatario</th>
                                    <th className="p-3">Mensaje</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {history.map((h: any, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(h.date).toLocaleString()}</td>
                                        <td className="p-3 font-bold">{h.senderName || 'Sistema'}</td>
                                        <td className="p-3 text-primary-600">{h.recipientName || 'Todos'}</td>
                                        <td className="p-3">
                                            <span className="font-bold block">{h.title}</span>
                                            <span className="text-gray-500">{h.message}</span>
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-400">No hay notificaciones registradas.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---

export const AdminDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('OVERVIEW');
    const [loading, setLoading] = useState(true);

    // Modal State
    interface ModalState {
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'success' | 'danger' | 'confirm';
        onConfirm?: () => void;
        confirmText?: string;
    }
    const [modal, setModal] = useState<ModalState>({ isOpen: false, title: '', message: '', type: 'info' });

    // Data State
    const [stats, setStats] = useState<any>(null);
    const [students, setStudents] = useState<User[]>([]);
    const [professors, setProfessors] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [careers, setCareers] = useState<Career[]>([]);
    const [scholarships, setScholarships] = useState<Scholarship[]>([]);
    const [apps, setApps] = useState<ScholarshipApp[]>([]);
    const [schStats, setSchStats] = useState<any>(null);
    const [campusList, setCampusList] = useState<Campus[]>([]);

    // Config State
    const [newCampus, setNewCampus] = useState({ name: '', location: '', code: '', adminName: '', adminEmail: '', adminPassword: '' });
    const [editCampus, setEditCampus] = useState<Campus | null>(null);

    const currentCampus = campusList.find(c => c.id === user?.campusId);
    const isCentralAdmin = currentCampus?.code === CENTRAL_CAMPUS_CODE;

    useEffect(() => {
        if (!user) return;
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            const [st, stds, profs, crs, cars, schs, aps, sStats, cmps] = await Promise.all([
                api.admin.getStats(user!.campusId),
                api.admin.getStudents(user!.campusId),
                api.admin.getProfessors(user!.campusId),
                api.admin.getCourses(user!.campusId),
                api.admin.getCareers(user!.campusId),
                api.scholarships.list(user!.campusId),
                api.scholarships.getApplications(user!.campusId),
                api.scholarships.getAnalysis(user!.campusId),
                api.campuses.list()
            ]);
            setStats(st);
            setStudents(stds);
            setProfessors(profs);
            setCourses(crs);
            setCareers(cars);
            setScholarships(schs);
            setApps(aps);
            setSchStats(sStats);
            setCampusList(cmps);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (u: any, role: Role) => { await api.admin.createUser({ ...u, role }); loadData(); };
    const handleEnrollBulk = async (sid: string, cids: string[]) => { await api.admin.enrollStudentBulk(sid, cids, '2024-1'); };

    const handleCreateCampus = async () => {
        if (!newCampus.name) return setModal({ isOpen: true, title: 'Error', message: 'Complete los campos', type: 'danger' });
        await api.campuses.create(newCampus);
        setModal({ isOpen: true, title: 'Éxito', message: 'Recinto Creado', type: 'success' });
        loadData();
    };

    const handleDeleteCampus = async (id: string) => {
        setModal({
            isOpen: true, title: 'Eliminar Recinto', message: '¿Está seguro de eliminar este recinto y toda su data?', type: 'danger', confirmText: 'Sí, Eliminar',
            onConfirm: async () => { await api.campuses.delete(id); loadData(); }
        });
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const logoUrl = ev.target?.result as string;
                await api.campuses.update(user!.campusId, { logoUrl });
                setModal({ isOpen: true, title: 'Logo Actualizado', message: 'El logo se ha guardado correctamente.', type: 'success' });
                loadData();
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    if (loading) return <div className="p-20 text-center text-gray-500 font-medium">Cargando Sistema...</div>;

    return (
        <div className="space-y-8 pb-24 md:pb-12">
            <ActionModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                confirmText={modal.confirmText}
            />

            {/* Navegación por Pestañas */}
            <div className="hidden md:flex bg-white rounded-xl shadow-sm p-2 overflow-x-auto no-scrollbar gap-2 sticky top-20 z-10 border">
                {[
                    { id: 'OVERVIEW', label: 'Resumen', icon: BarChart2 },
                    { id: 'USERS', label: 'Usuarios', icon: UserPlus },
                    { id: 'ACADEMIC', label: 'Académico', icon: BookOpen },
                    { id: 'PENSUM', label: 'Pensum', icon: ClipboardList },
                    { id: 'HISTORY', label: 'Historial', icon: FileText },
                    { id: 'SCHOLARSHIPS', label: 'Becas', icon: DollarSign },
                    { id: 'NOTIFS', label: 'Notificaciones', icon: Bell },
                    { id: 'CONFIG', label: 'Configuración', icon: Settings },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Renderizado de Módulos */}
            <div className="animate-fade-in duration-300">
                {activeTab === 'OVERVIEW' && <OverviewModule stats={stats} />}
                {activeTab === 'USERS' && <UsersModule careers={careers} onCreate={handleCreateUser} campusId={user!.campusId} logoUrl={currentCampus?.logoUrl} setModal={setModal} />}
                {activeTab === 'ACADEMIC' && <AcademicModule students={students} courses={courses} onEnroll={handleEnrollBulk} logoUrl={currentCampus?.logoUrl} setModal={setModal} />}
                {activeTab === 'PENSUM' && <PensumModule careers={careers} courses={courses} campusId={user!.campusId} professors={professors} reloadData={loadData} logoUrl={currentCampus?.logoUrl} />}
                {activeTab === 'HISTORY' && <HistoryModule students={students} logoUrl={currentCampus?.logoUrl} />}
                {activeTab === 'SCHOLARSHIPS' && <ScholarshipsModule scholarships={scholarships} apps={apps} campusId={user!.campusId} reloadData={loadData} analysis={schStats} />}
                {activeTab === 'NOTIFS' && <NotificationModule campusId={user!.campusId} setModal={setModal} />}

                {activeTab === 'CONFIG' && (
                    <div className="bg-white p-8 rounded-2xl border shadow-sm">
                        <h2 className="font-bold text-xl mb-6 text-gray-900">Configuración</h2>
                        <div className="flex flex-col items-center mb-8">
                            {currentCampus?.logoUrl && <img src={currentCampus.logoUrl} className="h-32 object-contain mb-4" />}
                            <label className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-lg font-bold flex gap-2">
                                <Upload size={18} /> Subir Logo
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                            <p className="text-xs text-gray-400 mt-2">Este logo aparecerá en todos los documentos PDF.</p>
                        </div>
                        {isCentralAdmin && (
                            <div>
                                <h3 className="font-bold border-t pt-4 mt-4">Gestión de Recintos</h3>
                                <div className="grid md:grid-cols-2 gap-4 mt-2 mb-4 bg-gray-50 p-4 rounded-xl">
                                    <input className={INPUT_CLASS} placeholder="Nombre Recinto" value={newCampus.name} onChange={e => setNewCampus({ ...newCampus, name: e.target.value })} />
                                    <input className={INPUT_CLASS} placeholder="Ubicación" value={newCampus.location} onChange={e => setNewCampus({ ...newCampus, location: e.target.value })} />
                                    <input className={INPUT_CLASS} placeholder="Código (Ej: SUR)" value={newCampus.code} onChange={e => setNewCampus({ ...newCampus, code: e.target.value })} />
                                    <div className="hidden md:block"></div>
                                    <p className="md:col-span-2 font-bold text-sm text-gray-500 mt-2">Datos del Administrador</p>
                                    <input className={INPUT_CLASS} placeholder="Nombre Admin" value={newCampus.adminName} onChange={e => setNewCampus({ ...newCampus, adminName: e.target.value })} />
                                    <input className={INPUT_CLASS} placeholder="Email Admin" value={newCampus.adminEmail} onChange={e => setNewCampus({ ...newCampus, adminEmail: e.target.value })} />
                                    <input className={INPUT_CLASS} placeholder="Contraseña Admin" value={newCampus.adminPassword} onChange={e => setNewCampus({ ...newCampus, adminPassword: e.target.value })} />
                                    <button onClick={handleCreateCampus} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold md:col-span-2 mt-2">Crear Recinto y Admin</button>
                                </div>
                                <div className="mt-4 space-y-2">
                                    {campusList.map(c => (
                                        <div key={c.id} className="flex justify-between p-3 border rounded-lg bg-white items-center">
                                            <div>
                                                <span className="font-bold block text-gray-900">{c.name}</span>
                                                <span className="text-xs text-gray-500">{c.code} - {c.location}</span>
                                            </div>
                                            {c.code !== CENTRAL_CAMPUS_CODE && <button onClick={() => handleDeleteCampus(c.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={18} /></button>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Navigation for Mobile */}
            <BottomNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                unreadCount={0}
                setNotifOpen={() => { }}
                handleLogout={() => { }}
                role="ADMIN"
            />
        </div>
    );
};