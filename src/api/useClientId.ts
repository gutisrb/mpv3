import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabaseClient';

/**
 * Returns the current tenant's client_id for the logged-in user.
 * Robust: handles zero or multiple rows by picking the first match and
 * throwing a friendly error if nothing is linked.
 */
export const useClientId = () => {
  return useQuery({
    queryKey: ['clientId'],
    queryFn: async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw new Error(`Auth error: ${userErr.message}`);
      if (!user) throw new Error('You are not signed in.');

      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .order('id', { ascending: true })
        .limit(1);

      if (error) throw new Error(`Client lookup error: ${error.message}`);
      if (!data || data.length === 0) {
        throw new Error("Your account isn't linked to a client profile. Please contact support.");
      }
      return data[0].id as string;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};
