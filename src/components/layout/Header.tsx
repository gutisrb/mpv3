import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useProperties } from '@/api/dataHooks';
import { ChevronDown, Building2 } from 'lucide-react';

const Header: React.FC = () => {
  const nav = useNavigate();
  const { currentProperty, setProperty } = useApp();
  const { data: properties = [] } = useProperties();
  const [email, setEmail] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const handlePropertySelect = (property: any) => {
    setProperty(property);
    setIsDropdownOpen(false);
  };

  return (
    <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
      <div className="font-semibold">Channel Manager</div>
      <div className="flex items-center gap-4">
        {/* Property Selector */}
        {properties.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
            >
              <Building2 className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {currentProperty ? currentProperty.name : 'Select Property'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-2">
                  {properties.map((property) => (
                    <button
                      key={property.id}
                      onClick={() => handlePropertySelect(property)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                        currentProperty?.id === property.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="font-medium">{property.name}</div>
                      <div className="text-xs text-gray-500">{property.location}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {email && <span className="text-sm text-slate-600">{email}</span>}
        <button onClick={signOut} className="px-3 py-1.5 rounded-md border">Logout</button>
      </div>
    </header>
  );
};

export default Header;
