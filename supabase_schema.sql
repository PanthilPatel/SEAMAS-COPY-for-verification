-- Supabase Schema for SEAMAS

-- 1. Profiles Table
CREATE TABLE public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Search History Table
CREATE TABLE public.search_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  query text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for search_history
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own history" ON public.search_history FOR ALL USING (auth.uid() = user_id);

-- 3. Wishlists Table
CREATE TABLE public.wishlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_name text not null,
  marketplace text,
  extracted_price numeric,
  original_price numeric,
  url text,
  image_url text,
  is_verified boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id);

-- 4. Cached Results Table (Global)
CREATE TABLE public.cached_results (
  query text primary key,
  result_payload jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for cached_results (Read-only for public, writable only via service role / backend)
ALTER TABLE public.cached_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cache" ON public.cached_results FOR SELECT USING (true);

-- Function to handle new user signups and automatically insert into profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run the handle_new_user function when a new auth user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
