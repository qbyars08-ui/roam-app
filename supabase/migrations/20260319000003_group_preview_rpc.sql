-- Allow unauthenticated users to fetch group preview by invite code (for deferred signup flow)
CREATE OR REPLACE FUNCTION get_group_preview_by_invite(code text)
RETURNS TABLE (id uuid, name text, destination text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.name, g.destination
  FROM trip_groups g
  WHERE g.invite_code = upper(trim(code));
$$;

-- Join group by invite code (bypasses RLS for trip_groups read; user must be authenticated)
CREATE OR REPLACE FUNCTION join_group_by_invite(code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gid uuid;
  grow trip_groups%ROWTYPE;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO gid FROM trip_groups WHERE invite_code = upper(trim(code)) LIMIT 1;
  IF gid IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  INSERT INTO trip_group_members (group_id, user_id, role, display_name, status)
  VALUES (gid, uid, 'member', 'Traveler', 'active')
  ON CONFLICT (group_id, user_id) DO UPDATE SET status = 'active'
  RETURNING group_id INTO gid;

  SELECT * INTO grow FROM trip_groups WHERE id = gid;
  RETURN jsonb_build_object(
    'id', grow.id, 'name', grow.name, 'owner_id', grow.owner_id, 'trip_id', grow.trip_id,
    'invite_code', grow.invite_code, 'destination', grow.destination,
    'start_date', grow.start_date, 'end_date', grow.end_date,
    'budget_tier', grow.budget_tier, 'status', grow.status,
    'itinerary_json', grow.itinerary_json, 'created_at', grow.created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_group_preview_by_invite(text) TO anon;
GRANT EXECUTE ON FUNCTION get_group_preview_by_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION join_group_by_invite(text) TO authenticated;
