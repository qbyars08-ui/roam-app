// =============================================================================
// ROAM — Document Vault: trip document storage & expiry tracking
// =============================================================================
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAppStore } from './store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type DocType =
  | 'passport'
  | 'visa'
  | 'insurance'
  | 'booking'
  | 'ticket'
  | 'reservation'
  | 'vaccination'
  | 'other';

export type TripDocument = {
  id: string;
  tripId: string | null;
  userId: string;
  docType: DocType;
  title: string;
  notes: string | null;
  fileUrl: string | null;
  expiryDate: string | null;
  createdAt: string;
};

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  passport: 'Passport',
  visa: 'Visa',
  insurance: 'Insurance',
  booking: 'Booking',
  ticket: 'Ticket',
  reservation: 'Reservation',
  vaccination: 'Vaccination',
  other: 'Other',
};

const DOC_TYPE_ORDER: Record<DocType, number> = {
  passport: 0,
  visa: 1,
  insurance: 2,
  booking: 3,
  ticket: 4,
  reservation: 5,
  vaccination: 6,
  other: 7,
};

// ---------------------------------------------------------------------------
// Row mapper — Supabase rows to TripDocument (immutable)
// ---------------------------------------------------------------------------
function rowToDoc(row: Record<string, unknown>): TripDocument {
  return {
    id: String(row.id ?? ''),
    tripId: row.trip_id != null ? String(row.trip_id) : null,
    userId: String(row.user_id ?? ''),
    docType: (row.doc_type ?? 'other') as DocType,
    title: String(row.title ?? ''),
    notes: row.notes != null ? String(row.notes) : null,
    fileUrl: row.file_url != null ? String(row.file_url) : null,
    expiryDate: row.expiry_date != null ? String(row.expiry_date) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------
type NewDocInput = {
  docType: DocType;
  title: string;
  notes?: string;
  fileUrl?: string;
  expiryDate?: string;
};

export async function addDocument(
  tripId: string | null,
  doc: NewDocInput,
): Promise<TripDocument | null> {
  const userId = useAppStore.getState().session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('trip_documents')
    .insert({
      user_id: userId,
      trip_id: tripId,
      doc_type: doc.docType,
      title: doc.title.trim(),
      notes: doc.notes?.trim() || null,
      file_url: doc.fileUrl?.trim() || null,
      expiry_date: doc.expiryDate || null,
    })
    .select()
    .single();

  if (error || !data) {
    console.warn('[DocumentVault] Insert failed:', error?.message);
    return null;
  }
  return rowToDoc(data as Record<string, unknown>);
}

export async function getDocuments(tripId: string): Promise<TripDocument[]> {
  const userId = useAppStore.getState().session?.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('trip_documents')
    .select('*')
    .eq('user_id', userId)
    .eq('trip_id', tripId)
    .is('deleted_at', null)
    .order('doc_type', { ascending: true })
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('[DocumentVault] Fetch failed:', error?.message);
    return [];
  }
  return (data as Record<string, unknown>[])
    .map(rowToDoc)
    .sort((a, b) => (DOC_TYPE_ORDER[a.docType] ?? 7) - (DOC_TYPE_ORDER[b.docType] ?? 7));
}

export async function deleteDocument(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('trip_documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.warn('[DocumentVault] Soft delete failed:', error.message);
    return false;
  }
  return true;
}

export async function getExpiringDocuments(
  userId: string,
  daysAhead: number,
): Promise<TripDocument[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('trip_documents')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .in('doc_type', ['passport', 'visa', 'insurance'])
    .not('expiry_date', 'is', null)
    .lte('expiry_date', cutoffStr)
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToDoc);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useDocumentVault(tripId: string | null) {
  const [docs, setDocs] = useState<TripDocument[]>([]);
  const [expiring, setExpiring] = useState<TripDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAppStore((s) => s.session?.user?.id);

  const refresh = useCallback(async () => {
    if (!tripId) { setDocs([]); setLoading(false); return; }
    setLoading(true);
    const [fetched, exp] = await Promise.all([
      getDocuments(tripId),
      userId ? getExpiringDocuments(userId, 30) : Promise.resolve([]),
    ]);
    setDocs(fetched);
    setExpiring(exp);
    setLoading(false);
  }, [tripId, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(
    async (doc: NewDocInput) => {
      const created = await addDocument(tripId, doc);
      if (created) await refresh();
      return created;
    },
    [tripId, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const ok = await deleteDocument(id);
      if (ok) setDocs((prev) => prev.filter((d) => d.id !== id));
      return ok;
    },
    [],
  );

  return { docs, expiring, loading, add, remove, refresh };
}
