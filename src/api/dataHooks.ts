import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import { format } from 'date-fns';

// Types
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
  start_date: string;
  end_date: string;
  source: 'airbnb' | 'booking.com' | 'manual' | 'web';
  created_at: string;
  property_name?: string;
}

// Fetch properties for the current user
export const useProperties = () => {
  return useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*');
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Property[];
    },
    enabled: true,
  });
};

// Fetch a single property by ID
export const useProperty = (propertyId: string) => {
  return useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Property;
    },
    enabled: !!propertyId,
  });
};

// Fetch bookings for a specific property
export const useBookings = (propertyId: string) => {
  return useQuery({
    queryKey: ['bookings', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('property_id', propertyId)
        .order('start_date', { ascending: true });
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Booking[];
    },
    enabled: !!propertyId,
  });
};

// Calculate booking gaps for the next 30 days
export const useBookingGaps = (propertyId: string) => {
  const { data: bookings } = useBookings(propertyId);
  
  return useQuery({
    queryKey: ['booking-gaps', propertyId],
    queryFn: () => {
      if (!bookings) return 0;
      
      // Logic to calculate gaps between bookings
      // This is a simplified version - in a real app, you'd want more sophisticated logic
      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      // Sort bookings by start date
      const sortedBookings = [...bookings].sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
      
      let gapCount = 0;
      let lastEndDate = today;
      
      for (const booking of sortedBookings) {
        const startDate = new Date(booking.start_date);
        
        // If there's a gap between the last end date and this booking's start date
        if (startDate > lastEndDate && startDate <= thirtyDaysLater) {
          gapCount++;
        }
        
        lastEndDate = new Date(booking.end_date);
        
        // If we've gone past our 30-day window, stop counting
        if (lastEndDate > thirtyDaysLater) {
          break;
        }
      }
      
      return gapCount;
    },
    enabled: !!bookings,
  });
};

// Calculate total nights booked in the next 30 days
export const useNightsBooked = (propertyId?: string) => {
  const { data: bookings } = useBookings(propertyId || '');
  const { data: properties } = useProperties();
  
  return useQuery({
    queryKey: ['nights-booked', propertyId],
    queryFn: async () => {
      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      let totalNights = 0;
      
      // If propertyId is provided, calculate for that property only
      if (propertyId && bookings) {
        for (const booking of bookings) {
          const startDate = new Date(booking.start_date);
          const endDate = new Date(booking.end_date);
          
          // Only count nights within our 30-day window
          const effectiveStartDate = startDate < today ? today : startDate;
          const effectiveEndDate = endDate > thirtyDaysLater ? thirtyDaysLater : endDate;
          
          if (effectiveStartDate < effectiveEndDate) {
            const nights = Math.ceil(
              (effectiveEndDate.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            totalNights += nights;
          }
        }
      } 
      // Otherwise, calculate for all properties
      else if (properties) {
        for (const property of properties) {
          const { data } = await supabase
            .from('bookings')
            .select('*')
            .eq('property_id', property.id);
            
          const propertyBookings = data as Booking[];
          
          for (const booking of propertyBookings) {
            const startDate = new Date(booking.start_date);
            const endDate = new Date(booking.end_date);
            
            // Only count nights within our 30-day window
            const effectiveStartDate = startDate < today ? today : startDate;
            const effectiveEndDate = endDate > thirtyDaysLater ? thirtyDaysLater : endDate;
            
            if (effectiveStartDate < effectiveEndDate) {
              const nights = Math.ceil(
                (effectiveEndDate.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              totalNights += nights;
            }
          }
        }
      }
      
      return totalNights;
    },
    enabled: !!propertyId ? !!bookings : !!properties,
  });
};

// Create a new booking
export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (booking: Omit<Booking, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Get property name
      const { data: property } = await supabase
        .from('properties')
        .select('name')
        .eq('id', booking.property_id)
        .single();
      
      // Call webhook with booking data
      const webhookUrl = import.meta.env.VITE_ICS_WEBHOOK_BASE || 'https://hook.eu2.make.com/1p4gelkvs573a5au5sngbc2jtlvmou9d';
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: booking.property_id,
          file: 'feed.ics',
          property_name: property?.name,
          source: 'Manual'
        })
      });
      
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to trigger refetches
      queryClient.invalidateQueries({ queryKey: ['bookings', variables.property_id] });
      queryClient.invalidateQueries({ queryKey: ['booking-gaps', variables.property_id] });
      queryClient.invalidateQueries({ queryKey: ['nights-booked', variables.property_id] });
      queryClient.invalidateQueries({ queryKey: ['nights-booked'] });
    },
  });
};

// Delete a booking
export const useDeleteBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bookingId: string) => {
      // Get the booking data from the cache instead of making a new request
      const bookings = queryClient.getQueryData<Booking[]>(['bookings']) || [];
      const booking = bookings.find(b => b.id === bookingId);
      
      // Delete the booking
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);
        
      if (error) {
        throw new Error(error.message);
      }
      
      // If we found the booking in cache, call the webhook
      if (booking) {
        // Get property name
        const { data: property } = await supabase
          .from('properties')
          .select('name')
          .eq('id', booking.property_id)
          .single();
        
        const webhookUrl = import.meta.env.VITE_ICS_WEBHOOK_BASE || 'https://hook.eu2.make.com/1p4gelkvs573a5au5sngbc2jtlvmou9d';
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            property_id: booking.property_id,
            file: 'feed.ics',
            property_name: property?.name,
            source: 'Manual'
          })
        });
      }
      
      return booking?.property_id;
    },
    onSuccess: (propertyId) => {
      if (propertyId) {
        queryClient.invalidateQueries({ queryKey: ['bookings', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['booking-gaps', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['nights-booked', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['nights-booked'] });
      }
    },
  });
};

// Calculate total open gaps across all properties
export const useTotalGaps = () => {
  const { data: properties } = useProperties();
  
  return useQuery({
    queryKey: ['total-gaps'],
    queryFn: async () => {
      if (!properties) return 0;
      
      let totalGaps = 0;
      
      for (const property of properties) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('property_id', property.id)
          .order('start_date', { ascending: true });
          
        if (!bookings) continue;
        
        // Logic to calculate gaps between bookings
        const today = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(today.getDate() + 30);
        
        // Sort bookings by start date
        const sortedBookings = [...bookings].sort((a, b) => 
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
        
        let lastEndDate = today;
        
        for (const booking of sortedBookings) {
          const startDate = new Date(booking.start_date);
          
          // If there's a gap between the last end date and this booking's start date
          if (startDate > lastEndDate && startDate <= thirtyDaysLater) {
            totalGaps++;
          }
          
          lastEndDate = new Date(booking.end_date);
          
          // If we've gone past our 30-day window, stop counting
          if (lastEndDate > thirtyDaysLater) {
            break;
          }
        }
      }
      
      return totalGaps;
    },
    enabled: !!properties,
  });
};

// Create a new property
export const useCreateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (property: { name: string; location: string; airbnb_ical?: string; booking_ical?: string }) => {
      const { data, error } = await supabase
        .from('properties')
        .insert([property])
        .select()
        .single();
        
      if (error) {
        throw new Error('Failed to create property: ' + error.message);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}