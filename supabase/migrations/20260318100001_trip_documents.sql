-- =============================================================================
-- ROAM — Trip Documents vault (passports, visas, bookings, tickets, etc.)
-- =============================================================================

CREATE TABLE trip_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  trip_id uuid REFERENCES trips,
  doc_type text NOT NULL CHECK (doc_type IN ('passport','visa','insurance','booking','ticket','reservation','vaccination','other')),
  title text NOT NULL,
  notes text,
  file_url text,
  expiry_date date,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trip_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own docs" ON trip_documents
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_trip_docs_user ON trip_documents(user_id);
CREATE INDEX idx_trip_docs_trip ON trip_documents(trip_id);
