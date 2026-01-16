create table
  favorites (
    id uuid default gen_random_uuid () primary key,
    user_id uuid references auth.users (id) on delete cascade,
    character_id text not null,
    character_data jsonb not null,
    created_at timestamp
    with
      time zone default now ()
  );

alter table favorites enable row level security;

create policy "read own favorites" on favorites for
select
  using (auth.uid () = user_id);

create policy "insert own favorites" on favorites for insert
with
  check (auth.uid () = user_id);

create policy "delete own favorites" on favorites for delete using (auth.uid () = user_id);