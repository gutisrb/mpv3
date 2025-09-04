import React, { useEffect, useMemo, useState } from 'react';
import { parseISO, isValid, format } from 'date-fns';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    guest_name: string;
    guest_email: string;
    guest_phone?: string;
    start_date: string; // YYYY-MM-DD
    end_date: string;   // YYYY-MM-DD
    notes?: string;
  }) => Promise<void> | void;
  initialStartDate?: string | null; // ISO date or YYYY-MM-DD
  initialEndDate?: string | null;   // ISO date or YYYY-MM-DD
};

function toYMD(value?: string | null): string {
  if (!value) return '';
  // Accept YYYY-MM-DD or full ISO; convert to YYYY-MM-DD if valid
  const d = value.length > 10 ? parseISO(value) : parseISO(value + 'T00:00:00Z');
  if (!isValid(d)) return '';
  return format(d, 'yyyy-MM-dd');
}

const BookingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialStartDate,
  initialEndDate
}) => {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      const s = toYMD(initialStartDate);
      const e = toYMD(initialEndDate);
      setStart(s || '');
      setEnd((e || s) || '');
      setGuestName('');
      setGuestEmail('');
      setGuestPhone('');
      setNotes('');
      setSubmitting(false);
    }
  }, [isOpen, initialStartDate, initialEndDate]);

  // Keep range sane (end >= start)
  useEffect(() => {
    if (start && end && end < start) setEnd(start);
  }, [start, end]);

  const canSubmit = useMemo(() => {
    return !!guestName && !!guestEmail && !!start && !!end;
  }, [guestName, guestEmail, start, end]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        guest_phone: guestPhone.trim() || undefined,
        start_date: start,
        end_date: end,
        notes: notes.trim() || undefined
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/30">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Nova rezervacija</h3>
          <button onClick={onClose} className="text-sm text-slate-600 hover:text-slate-900">Zatvori</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Dolazak</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Odlazak</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Ime i prezime</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ime gosta"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded-md px-3 py-2"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="gost@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Telefon (opciono)</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="+381 6x xxx xxxx"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Beleške (opciono)</label>
            <textarea
              className="w-full border rounded-md px-3 py-2 min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Posebni zahtevi, napomene…"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-md border"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="px-3 py-2 rounded-md bg-slate-900 text-white disabled:opacity-50"
            >
              {submitting ? 'Čuvanje…' : 'Sačuvaj rezervaciju'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
