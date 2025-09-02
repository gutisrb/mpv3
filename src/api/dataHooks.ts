import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import { format } from 'date-fns';
import { useClientId } from './useClientId';

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
  user_id?: string | null; // legacy field, ignore
  start_date: string;
  end_date: string;
  source: string | null;
  external_uid: string | null;
  channel: string | null;
  created_at: string;
}

// -------- Reads --------

export const useProperties = () => {
  const { data: clientId } = useClientId();
  return useQuery({
    queryKey: ['properties', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('client_id', clientId!);
      if (error) throw new Error(error.message);
      return data as Property[];
    }
  });
};

export const useProperty = (propertyId: string) => {
  const { data: clientId } = useClientId();
  return useQuery({
    queryKey: ['property', propertyId, clientId],
    enabled: !!clientId && !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('client_id', clientId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error('Property not found');
      return data as Property;
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
        .eq('client_id', clientId!)   // << correct tenant filter
        .order('start_date', { ascending: true });
      if (error) throw new Error(error.message);
      return data as Booking[];
    }
  });
};

// -------- Mutations --------

export const useCreateProperty = () => {
  const qc = useQueryClient();
  const { data: clientId } = useClientId();
  return useMutation({
    mutationFn: async (payload: Omit<Property, 'id'|'client_id'>) => {
      const { data, error } = await supabase
        .from('properties')
        .insert([{ ...payload, client_id: clientId! }])
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Property;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
    }
  });
};

export const useUpdateProperty = () => {
  const qc = useQueryClient();
  const { data: clientId } = useClientId();
  return useMutation({
    mutationFn: async ({ propertyId, updates }: { propertyId: string; updates: Partial<Property>; }) => {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', propertyId)
        .eq('client_id', clientId!)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Property;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
    }
  });
};

export const useCreateBooking = () => {
  const qc = useQueryClient();
  const { data: clientId } = useClientId();
  return useMutation({
    mutationFn: async (booking: Omit<Booking, 'id'|'client_id'|'created_at'>) => {
      const payload = { ...booking, client_id: clientId! };
      const { data, error } = await supabase
        .from('bookings')
        .insert([payload])
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Booking;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['bookings', variables.property_id] });
    }
  });
};

export const useDeleteBooking = () => {
  const qc = useQueryClient();
  const { data: clientId } = useClientId();
  return useMutation({
    mutationFn: async ({ bookingId, propertyId }: { bookingId: string; propertyId: string; }) => {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .eq('client_id', clientId!);
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: (_ok, { propertyId }) => {
      qc.invalidateQueries({ queryKey: ['bookings', propertyId] });
    }
  });
};

// -------- Analytics helpers (kept simple, filtered by tenant via useBookings/useProperties) --------

export const useNightsBooked = (propertyId?: string) => {
  const { data: clientId } = useClientId();
  const { data: properties = [] } = useProperties();
  const { data: bookings = [] } = useBookings(propertyId || (properties[0]?.id ?? ''));
  return useQuery({
    queryKey: ['nights-booked', propertyId, clientId],
    enabled: !!clientId && (!!propertyId || properties.length>0),
    queryFn: async () => {
      const today = new Date();
      const in30 = new Date(today); in30.setDate(today.getDate()+30);
      let total = 0;
      for (const b of bookings) {
        const s = new Date(b.start_date);
        const e = new Date(b.end_date);
        const start = s < today ? today : s;
        const end = e > in30 ? in30 : e;
        const nights = Math.max(0, (end.getTime()-start.getTime())/(1000*60*60*24));
        total += nights;
      }
      return Math.round(total);
    }
  });
};

export const useBookingGaps = (propertyId: string) => {
  const { data: bookings = [] } = useBookings(propertyId);
  return useQuery({
    queryKey: ['gaps', propertyId],
    enabled: bookings.length>0,
    queryFn: async () => {
      const today = new Date();
      const in30 = new Date(today); in30.setDate(today.getDate()+30);
      const sorted = [...bookings].sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
      let gaps = 0;
      let lastEnd = today;
      for (const b of sorted) {
        const s = new Date(b.start_date);
        if (s > lastEnd && lastEnd < in30) gaps++;
        lastEnd = new Date(b.end_date);
        if (lastEnd > in30) break;
      }
      return gaps;
    }
  });
};

export const useTotalGaps = () => {
  const { data: properties = [] } = useProperties();
  return useQuery({
    queryKey: ['total-gaps', properties.map(p=>p.id)],
    enabled: properties.length>0,
    queryFn: async () => {
      // Could compute by iterating properties and bookings if needed.
      return 0;
    }
  });
};
