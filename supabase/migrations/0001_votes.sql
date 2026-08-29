  -- The vote store. One table, and deliberately nothing else (D30, D35).
  --
  -- No accounts, no user table, no profiles. The room id IS the secret: 128 bits,
  -- unguessable, the same model the shared-day links already use. Anything that
  -- knows a room id may vote in it; nothing can enumerate rooms.

  create table if not exists public.votes (
    id          bigint generated always as identity primary key,
    -- Not a foreign key to anything. The ballot lives in the URL, so the
    -- candidate list is never a row here and the store can be wiped without
    -- losing anything an organiser cannot regenerate by re-sending their link.
    room_id     text        not null check (char_length(room_id) between 16 and 128),
    voter       text        not null check (char_length(voter) between 1 and 40),
    -- { spotId: "yes" | "maybe" | "no" }. Shape is enforced in the route, which
    -- is the only writer; a check constraint here would duplicate that and drift.
    marks       jsonb       not null,
    created_at  timestamptz not null default now()
  );

  create index if not exists votes_room_id_idx on public.votes (room_id);
  -- Supports the 24-hour sweep below without a sequential scan.
  create index if not exists votes_created_at_idx on public.votes (created_at);

  -- RLS on with NO policies at all: this denies every anon and authenticated
  -- request outright. That is intentional and is the whole security model.
  --
  -- Reads and writes go through an API route holding the service key, which
  -- bypasses RLS. The browser never touches this table — live updates arrive over
  -- Realtime Broadcast on a channel named by the room id, precisely so that no
  -- policy expressing "knows the room id" has to exist. Such a policy is not an
  -- auth claim and is the shape that gets written permissively and passes review.
  alter table public.votes enable row level security;

  -- 24-hour expiry. Postgres has no TTL, so the property D30 wanted has to be
  -- built rather than intended: it is what makes "v1 has no history"
  -- architectural instead of a policy someone has to remember.
  --
  -- The API route also sweeps opportunistically on write, so this stopping
  -- silently degrades the guarantee rather than breaking it.
  create or replace function public.delete_expired_votes()
  returns void
  language sql
  security definer
  set search_path = public
  as $$
    delete from public.votes where created_at < now() - interval '24 hours';
  $$;

  -- Requires pg_cron (Database → Extensions). Optional: the route's own sweep
  -- covers rooms that are still in use. This catches rooms that were abandoned.
  --
  --   select cron.schedule(
  --     'delete-expired-votes', '17 * * * *',
  --     $$select public.delete_expired_votes()$$
  --   );
