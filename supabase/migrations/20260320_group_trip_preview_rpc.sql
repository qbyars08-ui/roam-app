-- =============================================================================
-- ROAM — Group Trip Preview (Deferred Signup)
-- Allows unauthenticated users to see trip preview by invite code
-- =============================================================================

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
  WHERE g.invite_code = upper(trim(nullif(code, '')));

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_group_preview_by_invite(text) TO anon;
GRANT EXECUTE ON FUNCTION get_group_preview_by_invite(text) TO authenticated;
