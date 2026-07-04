-- Browser push notifications (roadmap Phase 3c): a user's push subscription
-- (one browser/device registration each). Same per-user RLS pattern as
-- saved_opportunities/followed_filters.

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

create policy "users select own push subscriptions"
  on push_subscriptions for select
  to authenticated
  using (user_id = auth.uid());

create policy "users insert own push subscriptions"
  on push_subscriptions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users delete own push subscriptions"
  on push_subscriptions for delete
  to authenticated
  using (user_id = auth.uid());
