import React from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { AdminDashboard } from './pages/AdminDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { ProfessorDashboard } from './pages/ProfessorDashboard';
import { useAuthStore } from './store';
import { Role } from './types';

const PrivateRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: Role[] }) => {
    const { isAuthenticated, user } = useAuthStore();
    
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" />; // Redirect to their default dashboard
    }

    return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    /* MemoryRouter se usa aquí para evitar errores de 'Location.assign' en entornos de sandbox/blob 
       ya que gestiona el historial en memoria sin intentar modificar la URL del navegador. */
    <MemoryRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Redirect Root based on Role */}
        <Route path="/" element={<RootRedirect />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
            <PrivateRoute allowedRoles={[Role.ADMIN]}>
                <AdminDashboard />
            </PrivateRoute>
        } />

        {/* Student Routes */}
        <Route path="/student" element={
            <PrivateRoute allowedRoles={[Role.STUDENT]}>
                <StudentDashboard />
            </PrivateRoute>
        } />
         <Route path="/student/*" element={
            <PrivateRoute allowedRoles={[Role.STUDENT]}>
                <StudentDashboard />
            </PrivateRoute>
        } />

        {/* Professor Routes */}
        <Route path="/professor" element={
            <PrivateRoute allowedRoles={[Role.PROFESSOR]}>
                <ProfessorDashboard />
            </PrivateRoute>
        } />
         <Route path="/professor/*" element={
            <PrivateRoute allowedRoles={[Role.PROFESSOR]}>
                <ProfessorDashboard />
            </PrivateRoute>
        } />

      </Routes>
    </MemoryRouter>
  );
};

const RootRedirect = () => {
    const { user, isAuthenticated } = useAuthStore();
    if (!isAuthenticated || !user) return <Navigate to="/login" />;
    if (user.role === Role.ADMIN) return <Navigate to="/admin" />;
    if (user.role === Role.STUDENT) return <Navigate to="/student" />;
    if (user.role === Role.PROFESSOR) return <Navigate to="/professor" />;
    return <Navigate to="/login" />;
};

export default App;