import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabaseClient';

export const useClientId = () => {
  return useQuery({
    queryKey: ['clientId'],
    queryFn: async () => {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Query the clients table to get the client ID
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (clientError) {
        if (clientError.code === 'PGRST116') {
          throw new Error('Your account isn\'t linked to a client profile. Please contact support.');
        }
        throw new Error(`Client lookup error: ${clientError.message}`);
      }
      
      if (!client) {
        throw new Error('Your account isn\'t linked to a client profile. Please contact support.');
      }
      
      return client.id;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};