-- Case-insensitive invite code matching for robustness (links may be shared in any case)
CREATE OR REPLACE FUNCTION get_group_preview_by_invite(code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', g.id,
    'name', g.name,
    'destination', g.destination,
    'startDate', g.start_date,
    'endDate', g.end_date,
    'budgetTier', g.budget_tier,
    'itineraryJson', g.itinerary_json,
    'members', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'displayName', m.display_name,
        'avatarEmoji', m.avatar_emoji
      ) ORDER BY m.joined_at), '[]'::jsonb)
      FROM trip_group_members m
      WHERE m.group_id = g.id AND m.status = 'active'
    )
  )
  INTO result
  FROM trip_groups g
  WHERE upper(trim(g.invite_code)) = upper(trim(nullif(code, '')));

  RETURN result;
END;
$$;

-- Join group: case-insensitive invite code
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

  SELECT id INTO gid FROM trip_groups WHERE upper(trim(invite_code)) = upper(trim(code)) LIMIT 1;
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
