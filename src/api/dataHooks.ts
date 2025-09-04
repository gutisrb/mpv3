import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import { useClientId } from './useClientId';

/** ===== Types ===== */
export interface Property {
  id: string;
  name: string;
  location: string;
  client_id: string;
  airbnb_ical: string | null;
  booking_ical: string | null;
}

export interface Booking {
  id: string;
  property_id: string;
  client_id: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD (inclusive in DB)
  source: string | null; // 'manual' | 'airbnb' | 'booking.com' | etc.
  external_uid: string | null;
  channel: string | null;
  created_at: string;
}

/** ===== Reads ===== */
export const useProperties = () => {
  const { data: clientId } = useClientId();
  return useQuery({
    queryKey: ['properties', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('client_id', clientId!)
        .order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data as Property[];
    }
  });
};

export const useBookings = (propertyId: string) => {
  const { data: clientId } = useClientId();
  return useQuery({
    queryKey: ['bookings', propertyId, clientId],
    enabled: !!clientId && !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('property_id', propertyId)
        .eq('client_id', clientId!)
        .order('start_date', { ascending: true });
      if (error) throw new Error(error.message);
      return data as Booking[];
    }
  });
};

/** ===== Mutations ===== */

export const useCreateBooking = () => {
  const qc = useQueryClient();
  const { data: clientId } = useClientId();
  return useMutation({
    mutationFn: async (booking: Omit<Booking, 'id' | 'client_id' | 'created_at'>) => {
      const payload = { ...booking, client_id: clientId! };
      const { data, error } = await supabase
        .from('bookings')
        .insert([payload])
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Booking;
    },
    onSuccess: () => {
      // Refresh ALL bookings queries (covers any property/client combinations)
      qc.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'bookings' });
    }
  });
};

/**
 * Delete one booking by ID after validating it's MANUAL and belongs to the
 * current property & client. IMPORTANT: We request the deleted rows with .select('id')
 * so if RLS blocks it (0 rows), we can show a clear error instead of “nothing happens”.
 */
export const useDeleteBooking = () => {
  const qc = useQueryClient();
  const { data: clientId } = useClientId();

  return useMutation({
    mutationFn: async ({ bookingId, propertyId }: { bookingId: string; propertyId: string }) => {
      // 1) Validate the row once for helpful messages
      const { data: found, error: findErr } = await supabase
        .from('bookings')
        .select('id, source, property_id, client_id')
        .eq('id', bookingId)
        .maybeSingle();
      if (findErr) throw new Error(findErr.message);
      if (!found) throw new Error('Booking not found.');

      const src = (found.source || '').toLowerCase();
      if (src !== 'manual') throw new Error('Only manual bookings can be deleted.');
      if (found.property_id !== propertyId) throw new Error('This booking belongs to another property.');
      if (found.client_id !== clientId) throw new Error('This booking belongs to another account.');

      // 2) Delete and RETURN the deleted row(s). If RLS blocks, data will be [].
      const { data: deleted, error: delErr } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .select('id'); // <-- forces return of deleted rows
      if (delErr) throw new Error(delErr.message);
      if (!deleted || deleted.length === 0) {
        throw new Error('Delete was blocked by database rules (RLS). Ask admin to allow deleting manual bookings.');
      }

      return true;
    },
    onSuccess: () => {
      // Refresh ALL bookings queries immediately
      qc.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'bookings' });
    }
  });
};

/** Keep this export — other parts of the app import it */
export const useUpdateProperty = () => {
  const qc = useQueryClient();
  const { data: clientId } = useClientId();
  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: Partial<Omit<Property, 'id' | 'client_id'>>;
    }) => {
      const { error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .eq('client_id', clientId!);
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: (_ok, { id }) => {
      qc.invalidateQueries({ queryKey: ['property', id] });
      qc.invalidateQueries({ queryKey: ['properties'] });
    }
  });
};
