import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Dashboard from '@/pages/Dashboard';
import Calendar from '@/pages/Calendar';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import { AppProvider } from '@/context/AppContext';

const queryClient = new QueryClient();

/** Decides where "/" should go: /dashboard if authed, else /login */
const HomeRedirect: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      setAuthed(!!user);
      setReady(true);
    })();
    return () => { alive = false; };
  }, []);

  if (!ready) return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  return <Navigate to={authed ? '/dashboard' : '/login'} replace />;
};

/** Shell that only renders children when authenticated */
const ProtectedShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setIsAuthed(!!user);
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setIsAuthed(!!session?.user);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  if (!isAuthed) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <HashRouter>
          <Routes>
            {/* Landing: decide based on auth */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected */}
            <Route path="/dashboard" element={<ProtectedShell><Dashboard /></ProtectedShell>} />
            <Route path="/calendar"  element={<ProtectedShell><Calendar  /></ProtectedShell>} />
            <Route path="/analytics" element={<ProtectedShell><Analytics /></ProtectedShell>} />
            <Route path="/settings"  element={<ProtectedShell><Settings  /></ProtectedShell>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
