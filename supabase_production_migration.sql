-- SEAMAS production schema migration. Apply to a dedicated test project first.
-- Safe to rerun: tables/indexes/policies/functions/triggers are created or replaced.
BEGIN;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 50;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_start_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_renew_at timestamptz;
DO $$ DECLARE fk record; BEGIN
  FOR fk IN SELECT conname FROM pg_constraint WHERE conrelid='public.profiles'::regclass
    AND contype='f' AND confrelid='auth.users'::regclass LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', fk.conname);
  END LOOP;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_auth_user_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_credits_nonnegative CHECK (credits >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS profiles_tier_idx ON public.profiles(tier);

CREATE TABLE IF NOT EXISTS public.search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS search_history_user_created_idx ON public.search_history(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('purchase','search_usage','refund','admin_adjustment','bonus')),
  amount integer NOT NULL CHECK (amount <> 0),
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  reference_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credit_transactions_user_created_idx ON public.credit_transactions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  razorpay_payment_link_id text UNIQUE,
  razorpay_payment_id text UNIQUE,
  plan_type text NOT NULL CHECK (plan_type IN ('pro_monthly','topup')),
  credits integer NOT NULL CHECK (credits > 0),
  amount integer NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  status text NOT NULL CHECK (status IN ('creating','pending','completed','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);
COMMENT ON COLUMN public.payment_transactions.amount IS 'Razorpay minor currency units (paise for INR).';
CREATE INDEX IF NOT EXISTS payment_transactions_user_created_idx ON public.payment_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_transactions_status_created_idx ON public.payment_transactions(status, created_at);

CREATE TABLE IF NOT EXISTS public.cached_results (
  query text PRIMARY KEY,
  result_payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cached_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read cache" ON public.cached_results;
REVOKE ALL ON public.cached_results FROM anon, authenticated;
GRANT ALL ON public.cached_results TO service_role;

CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  product_name text,
  url text NOT NULL,
  extracted_price numeric,
  original_price numeric,
  marketplace text,
  image_url text,
  rating numeric,
  reviews_count integer,
  is_verified boolean DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wishlists_user_url_unique UNIQUE (user_id, url)
);
CREATE INDEX IF NOT EXISTS wishlists_user_created_idx ON public.wishlists(user_id, created_at DESC);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can add own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can update own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.wishlists;
CREATE POLICY "Users can view own wishlist" ON public.wishlists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add own wishlist" ON public.wishlists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wishlist" ON public.wishlists FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlist" ON public.wishlists FOR DELETE TO authenticated USING (auth.uid() = user_id);
REVOKE ALL ON public.wishlists FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can manage own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can view own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can add own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can delete own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can manage own history" ON public.search_history;
CREATE POLICY "Users can view own search history" ON public.search_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add own search history" ON public.search_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own search history" ON public.search_history FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can read own credit ledger" ON public.credit_transactions;
CREATE POLICY "Users can read own credit ledger" ON public.credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can read own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can read own payment transactions" ON public.payment_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON public.profiles, public.search_history, public.credit_transactions, public.payment_transactions FROM anon;
GRANT SELECT ON public.profiles TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.search_history TO authenticated;
GRANT SELECT ON public.credit_transactions, public.payment_transactions TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.credit_transactions, public.payment_transactions FROM authenticated;
GRANT ALL ON public.profiles, public.search_history, public.credit_transactions, public.payment_transactions TO service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  INSERT INTO public.profiles(id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, auth AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  DELETE FROM auth.users WHERE id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'user_not_found'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id uuid, p_amount integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE new_balance integer;
BEGIN
  IF p_amount <= 0 THEN RETURN false; END IF;
  UPDATE public.profiles SET credits = credits - p_amount
    WHERE id = p_user_id AND credits >= p_amount RETURNING credits INTO new_balance;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO public.credit_transactions(user_id,type,amount,balance_after)
    VALUES (p_user_id,'search_usage',-p_amount,new_balance);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_payment_and_credit(p_transaction_id uuid, p_user_id uuid, p_payment_id text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE tx public.payment_transactions%ROWTYPE; new_balance integer;
BEGIN
  SELECT * INTO tx FROM public.payment_transactions WHERE id = p_transaction_id FOR UPDATE;
  IF NOT FOUND OR tx.user_id <> p_user_id THEN RAISE EXCEPTION 'transaction_not_found'; END IF;
  IF tx.status = 'completed' THEN
    SELECT credits INTO new_balance FROM public.profiles WHERE id = p_user_id;
    RETURN new_balance;
  END IF;
  IF tx.status <> 'pending' THEN RAISE EXCEPTION 'transaction_not_payable'; END IF;
  UPDATE public.profiles SET credits = credits + tx.credits,
    tier = CASE WHEN tx.plan_type = 'pro_monthly' THEN 'pro' ELSE tier END,
    subscription_start_at = CASE WHEN tx.plan_type = 'pro_monthly' THEN now() ELSE subscription_start_at END,
    subscription_renew_at = CASE WHEN tx.plan_type = 'pro_monthly' THEN now() + interval '30 days' ELSE subscription_renew_at END
    WHERE id = p_user_id RETURNING credits INTO new_balance;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile_not_found'; END IF;
  UPDATE public.payment_transactions SET status='completed', razorpay_payment_id=p_payment_id, verified_at=now()
    WHERE id=p_transaction_id;
  INSERT INTO public.credit_transactions(user_id,type,amount,balance_after,reference_id,metadata)
    VALUES (p_user_id,'purchase',tx.credits,new_balance,p_payment_id,
      jsonb_build_object('payment_transaction_id',tx.id,'plan_type',tx.plan_type));
  RETURN new_balance;
END;
$$;
CREATE OR REPLACE FUNCTION public.refund_credits(p_user_id uuid, p_amount integer, p_reference_id text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE new_balance integer; existing_ref uuid;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'amount_must_be_positive'; END IF;
  -- Idempotency check: if reference_id is provided, verify it has not been refunded already
  IF p_reference_id IS NOT NULL THEN
    SELECT id INTO existing_ref FROM public.credit_transactions
      WHERE user_id = p_user_id AND type = 'refund' AND reference_id = p_reference_id LIMIT 1;
    IF existing_ref IS NOT NULL THEN
      SELECT credits INTO new_balance FROM public.profiles WHERE id = p_user_id;
      RETURN new_balance;
    END IF;
  END IF;

  UPDATE public.profiles SET credits = credits + p_amount
    WHERE id = p_user_id RETURNING credits INTO new_balance;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile_not_found'; END IF;

  INSERT INTO public.credit_transactions(user_id, type, amount, balance_after, reference_id, metadata)
    VALUES (p_user_id, 'refund', p_amount, new_balance, p_reference_id,
      jsonb_build_object('reason', 'pipeline_failure_or_disconnect'));
  RETURN new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_credits(uuid,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_credits(uuid,integer,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_payment_and_credit(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid,integer,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_payment_and_credit(uuid,uuid,text) TO service_role;

-- The readiness RPC checks capabilities the API actually uses, not table existence alone.
CREATE OR REPLACE FUNCTION public.seamas_schema_is_ready()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT
    to_regclass('public.profiles') IS NOT NULL
    AND to_regclass('public.search_history') IS NOT NULL
    AND to_regclass('public.credit_transactions') IS NOT NULL
    AND to_regclass('public.payment_transactions') IS NOT NULL
    AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.profiles'::regclass AND attname='credits' AND NOT attisdropped)
    AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.profiles'::regclass AND attname='tier' AND NOT attisdropped)
    AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.profiles'::regclass AND attname='subscription_renew_at' AND NOT attisdropped)
    AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.search_history'::regclass AND attname='user_id' AND NOT attisdropped)
    AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.search_history'::regclass AND attname='query' AND NOT attisdropped)
    AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.credit_transactions'::regclass AND attname='balance_after' AND NOT attisdropped)
    AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.payment_transactions'::regclass AND attname='razorpay_payment_link_id' AND NOT attisdropped)
    AND to_regclass('public.search_history_user_created_idx') IS NOT NULL
    AND to_regclass('public.credit_transactions_user_created_idx') IS NOT NULL
    AND to_regclass('public.payment_transactions_user_created_idx') IS NOT NULL
    AND to_regclass('public.cached_results') IS NOT NULL
    AND NOT EXISTS (SELECT required.column_name FROM (VALUES
      ('id'),('email'),('full_name'),('avatar_url'),('created_at'),('tier'),('credits'),
      ('subscription_start_at'),('subscription_renew_at')
    ) AS required(column_name) WHERE NOT EXISTS (
      SELECT 1 FROM pg_attribute a WHERE a.attrelid='public.profiles'::regclass
        AND a.attname=required.column_name AND NOT a.attisdropped))
    AND NOT EXISTS (SELECT required.column_name FROM (VALUES
      ('id'),('user_id'),('query'),('created_at')
    ) AS required(column_name) WHERE NOT EXISTS (
      SELECT 1 FROM pg_attribute a WHERE a.attrelid='public.search_history'::regclass
        AND a.attname=required.column_name AND NOT a.attisdropped))
    AND NOT EXISTS (SELECT required.column_name FROM (VALUES
      ('id'),('user_id'),('type'),('amount'),('balance_after'),('reference_id'),('metadata'),('created_at')
    ) AS required(column_name) WHERE NOT EXISTS (
      SELECT 1 FROM pg_attribute a WHERE a.attrelid='public.credit_transactions'::regclass
        AND a.attname=required.column_name AND NOT a.attisdropped))
    AND NOT EXISTS (SELECT required.column_name FROM (VALUES
      ('id'),('user_id'),('razorpay_payment_link_id'),('razorpay_payment_id'),('plan_type'),
      ('credits'),('amount'),('currency'),('status'),('created_at'),('verified_at')
    ) AS required(column_name) WHERE NOT EXISTS (
      SELECT 1 FROM pg_attribute a WHERE a.attrelid='public.payment_transactions'::regclass
        AND a.attname=required.column_name AND NOT a.attisdropped))
    AND NOT EXISTS (SELECT required.column_name FROM (VALUES
      ('query'),('result_payload'),('created_at')
    ) AS required(column_name) WHERE NOT EXISTS (
      SELECT 1 FROM pg_attribute a WHERE a.attrelid='public.cached_results'::regclass
        AND a.attname=required.column_name AND NOT a.attisdropped))
    AND (SELECT relrowsecurity FROM pg_class WHERE oid='public.profiles'::regclass)
    AND (SELECT relrowsecurity FROM pg_class WHERE oid='public.search_history'::regclass)
    AND (SELECT relrowsecurity FROM pg_class WHERE oid='public.credit_transactions'::regclass)
    AND (SELECT relrowsecurity FROM pg_class WHERE oid='public.payment_transactions'::regclass)
    AND (SELECT relrowsecurity FROM pg_class WHERE oid='public.cached_results'::regclass)
    AND EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.profiles'::regclass
      AND c.confrelid='auth.users'::regclass AND c.contype='f' AND c.confdeltype='c'
      AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.profiles'::regclass AND attname='id')]
      AND c.confkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='auth.users'::regclass AND attname='id')])
    AND EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.search_history'::regclass
      AND c.confrelid='public.profiles'::regclass AND c.contype='f' AND c.confdeltype='c'
      AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.search_history'::regclass AND attname='user_id')]
      AND c.confkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.profiles'::regclass AND attname='id')])
    AND EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.credit_transactions'::regclass
      AND c.confrelid='public.profiles'::regclass AND c.contype='f' AND c.confdeltype='c'
      AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.credit_transactions'::regclass AND attname='user_id')]
      AND c.confkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.profiles'::regclass AND attname='id')])
    AND EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.payment_transactions'::regclass
      AND c.confrelid='public.profiles'::regclass AND c.contype='f' AND c.confdeltype='c'
      AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.payment_transactions'::regclass AND attname='user_id')]
      AND c.confkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.profiles'::regclass AND attname='id')])
    AND EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.payment_transactions'::regclass AND c.contype='u'
      AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.payment_transactions'::regclass AND attname='razorpay_payment_link_id')])
    AND EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.payment_transactions'::regclass AND c.contype='u'
      AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.payment_transactions'::regclass AND attname='razorpay_payment_id')])
    AND EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.profiles'::regclass AND c.contype='c'
      AND pg_get_constraintdef(c.oid) LIKE '%credits >= 0%')
    AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can view own profile' AND cmd='SELECT')
    AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='search_history' AND policyname='Users can view own search history' AND cmd='SELECT')
    AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='search_history' AND policyname='Users can add own search history' AND cmd='INSERT')
    AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='search_history' AND policyname='Users can delete own search history' AND cmd='DELETE')
    AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='credit_transactions' AND policyname='Users can read own credit ledger' AND cmd='SELECT')
    AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_transactions' AND policyname='Users can read own payment transactions' AND cmd='SELECT')
    AND to_regprocedure('public.deduct_credits(uuid,integer)') IS NOT NULL
    AND to_regprocedure('public.complete_payment_and_credit(uuid,uuid,text)') IS NOT NULL
    AND to_regprocedure('public.delete_user()') IS NOT NULL
    AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created' AND tgrelid='auth.users'::regclass AND NOT tgisinternal);
$$;
REVOKE ALL ON FUNCTION public.seamas_schema_is_ready() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seamas_schema_is_ready() TO service_role;

COMMIT;
