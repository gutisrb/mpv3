import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { supabase } from '../api/supabaseClient';
import { useEffect, useState } from 'react';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Login page - Auth event:', event, session);
      
      if (event === 'SIGNED_IN') {
        setLoading(false);
        setError(null);
        // The App component will handle the redirect
      } else if (event === 'SIGN_IN_ERROR') {
        setLoading(false);
        setError('Sign in failed. Please check your credentials.');
      } else if (event === 'USER_UPDATED') {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center"
      >
        <div className="flex items-center justify-center">
          <Calendar className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Channel Manager
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Manage all your property bookings in one place
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-md sm:rounded-2xl sm:px-10">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          
          {loading && (
            <div className="mb-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Signing you in...</p>
            </div>
          )}
          
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3b82f6',
                    brandAccent: '#2563eb',
                  }
                }
              }
            }}
            providers={[]}
            redirectTo={`${window.location.origin}/#/dashboard`}
            onlyThirdPartyProviders={false}
            magicLink={false}
            showLinks={true}
          />
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            By signing in, you agree to our{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;