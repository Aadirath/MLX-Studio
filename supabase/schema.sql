-- MLX Studio usage log. Run this once in the Supabase SQL editor.
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  sid        text        not null,            -- random id for one browser tab, no personal data
  type       text        not null,            -- page_view, experiment, prediction, coach_question, pretest_done, ...
  topic      text        not null default '', -- linear-regression, k-means, gradient-descent, teacher
  data       jsonb       not null default '{}'::jsonb
);

create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_sid_idx        on public.events (sid);

-- Row level security on with no policies: the public (anon) key can neither read nor write.
-- Only the server, using the service role key stored in Vercel, can.
alter table public.events enable row level security;
