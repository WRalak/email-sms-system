import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import DashboardPage   from './pages/DashboardPage';
import ContactsPage    from './pages/ContactsPage';
import MessagesPage    from './pages/MessagesPage';
import ComposePage     from './pages/ComposePage';
import CampaignsPage   from './pages/CampaignsPage';
import TemplatesPage   from './pages/TemplatesPage';
import AnalyticsPage   from './pages/AnalyticsPage';
import SettingsPage    from './pages/SettingsPage';
import AppLayout       from './components/AppLayout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e1e3a', color: '#e2e8f0', border: '1px solid #2d2d52', borderRadius: '10px' },
            success: { iconTheme: { primary: '#6f4dff', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"  element={<DashboardPage />} />
            <Route path="contacts"   element={<ContactsPage />} />
            <Route path="messages"   element={<MessagesPage />} />
            <Route path="compose"    element={<ComposePage />} />
            <Route path="campaigns"  element={<CampaignsPage />} />
            <Route path="templates"  element={<TemplatesPage />} />
            <Route path="analytics"  element={<AnalyticsPage />} />
            <Route path="settings"   element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
