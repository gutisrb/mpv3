export const useDeleteBooking = () => {
  const qc = useQueryClient();
  const { data: clientId } = useClientId();
  return useMutation({
    mutationFn: async ({ bookingId, propertyId }: { bookingId: string; propertyId: string; }) => {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .eq('client_id', clientId!)
        .eq('source', 'manual'); // ✅ allow only manual deletions
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: (_ok, { propertyId }) => {
      qc.invalidateQueries({ queryKey: ['bookings', propertyId] });
    }
  });
};
