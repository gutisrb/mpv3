import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password'|'magic'>('password');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      setSessionEmail(user?.email ?? null);
      setChecking(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setSessionEmail(session?.user?.email ?? null);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    // Clear any cached state just in case
    try {
      localStorage.removeItem('sb-' + supabase.supabaseKey);
    } catch {}
    setLoading(false);
    setSessionEmail(null);
    setMsg('Signed out. You can log in with a different account now.');
  };

  const doPassword = async () => {
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    nav('/dashboard', { replace: true });
  };

  const doMagic = async () => {
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/#/login' }
    });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    setMsg('Check your email for the sign-in link.');
  };

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-600">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white shadow rounded-2xl p-6 space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>

        {sessionEmail ? (
          <div className="space-y-3 p-3 border rounded-md bg-slate-50">
            <div className="text-sm">
              You’re currently signed in as <b>{sessionEmail}</b>.
            </div>
            <div className="text-sm text-slate-600">
              To switch accounts, sign out first, then sign in with the other email.
            </div>
            <button
              onClick={signOut}
              disabled={loading}
              className="px-3 py-2 rounded-md bg-slate-900 text-white disabled:opacity-50"
            >
              {loading ? 'Signing out…' : 'Sign out to switch'}
            </button>
            {msg && <div className="text-sm text-emerald-700">{msg}</div>}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="block text-sm">Email</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {mode==='password' && (
              <div className="space-y-2">
                <label className="block text-sm">Password</label>
                <input
                  type="password"
                  className="w-full border rounded-md px-3 py-2"
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  placeholder="Your password"
                />
              </div>
            )}

            {msg && <div className="text-sm text-rose-600">{msg}</div>}

            <div className="flex gap-2">
              {mode==='password' ? (
                <button
                  onClick={doPassword}
                  disabled={loading}
                  className="px-3 py-2 rounded-md bg-slate-900 text-white disabled:opacity-50"
                >
                  Sign in
                </button>
              ) : (
                <button
                  onClick={doMagic}
                  disabled={loading}
                  className="px-3 py-2 rounded-md bg-slate-900 text-white disabled:opacity-50"
                >
                  Send magic link
                </button>
              )}
              <button
                onClick={()=>setMode(mode==='password'?'magic':'password')}
                className="px-3 py-2 rounded-md border"
              >
                {mode==='password' ? 'Use magic link' : 'Use password'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
