REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.profiles_guard() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.sync_profile_role() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.profiles_guard() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_profile_role() TO service_role;