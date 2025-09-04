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
    onSuccess: (data) => {
      if (data?.property_id) {
        qc.invalidateQueries({ queryKey: ['bookings', data.property_id] });
      }
    }
  });
};

/**
 * Delete ONE booking (manual-only) with strong filters and success check.
 * If no row is deleted, throws an error so the UI can report it.
 */
export const useDeleteBooking = () => {
  const qc = useQueryClient();
  const { data: clientId } = useClientId();
  return useMutation({
    mutationFn: async ({
      bookingId,
      propertyId,
    }: {
      bookingId: string;
      propertyId: string;
    }) => {
      const { data, error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .eq('property_id', propertyId)
        .eq('client_id', clientId!)
        .eq('source', 'manual')
        .select('id'); // returns deleted rows

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) {
        throw new Error('Nothing was deleted. Check RLS and filters (manual-only).');
      }
      return true;
    },
    onSuccess: (_ok, { propertyId }) => {
      qc.invalidateQueries({ queryKey: ['bookings', propertyId] });
    }
  });
};

/** (kept here if other parts of app import it; not used on Calendar now) */
export const useUpdateProperty = () => {
  const qc = useQueryClient();
  const { data: clientId } = useClientId();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Property, 'id' | 'client_id'>> }) => {
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
