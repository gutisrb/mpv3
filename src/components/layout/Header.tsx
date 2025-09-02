import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const nav = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      setEmail(user?.email ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    nav('/login', { replace: true });
  };

  return (
    <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
      <div className="font-semibold">Channel Manager</div>
      <div className="flex items-center gap-3">
        {email && <span className="text-sm text-slate-600">{email}</span>}
        <button onClick={signOut} className="px-3 py-1.5 rounded-md border">Logout</button>
      </div>
    </header>
  );
};

export default Header;
