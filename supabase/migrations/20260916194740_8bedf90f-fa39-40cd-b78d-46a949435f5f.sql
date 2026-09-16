CREATE TYPE public.app_role AS ENUM ('user','admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  role public.app_role NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles select own or admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles update own or admin" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- role is never client-writable: it mirrors public.user_roles
CREATE OR REPLACE FUNCTION public.profiles_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.role := COALESCE(
    (SELECT 'admin'::public.app_role FROM public.user_roles WHERE user_id = NEW.id AND role = 'admin' LIMIT 1),
    'user'::public.app_role
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_guard_trg BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard();

CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles p
  SET role = COALESCE(
    (SELECT 'admin'::public.app_role FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin' LIMIT 1),
    'user'::public.app_role
  )
  WHERE p.id = COALESCE(NEW.user_id, OLD.user_id);
  RETURN NULL;
END;
$$;
CREATE TRIGGER sync_profile_role_trg AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role();

CREATE TABLE public.game_progress (
  user_id uuid PRIMARY KEY,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  xp_to_next integer,
  character_name text,
  class_id text,
  avatar text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  backpack jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_quests jsonb NOT NULL DEFAULT '[]'::jsonb,
  mastered_quests jsonb NOT NULL DEFAULT '[]'::jsonb,
  achievements jsonb NOT NULL DEFAULT '[]'::jsonb,
  unlocked_regions jsonb NOT NULL DEFAULT '[]'::jsonb,
  diagnostic jsonb,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  weekly_boss jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  checkpoint jsonb,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  save_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_saved_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_progress TO authenticated;
GRANT ALL ON public.game_progress TO service_role;
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress select own or admin" ON public.game_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "progress insert own" ON public.game_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "progress update own or admin" ON public.game_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "progress delete own or admin" ON public.game_progress FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  event_type text NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_log_user_created_idx ON public.activity_log (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity select own or admin" ON public.activity_log FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "activity insert own or admin" ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')));