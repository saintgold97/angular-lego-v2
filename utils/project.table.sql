create table
  public.projects (
    id uuid primary key default gen_random_uuid (),
    name text not null,
    description text,
    start_date date not null,
    end_date date,
    created_at timestamptz default now ()
  );

alter table public.characters
add column project_id uuid;

alter table public.characters add constraint characters_project_fk foreign key (project_id) references public.projects (id) on delete set null;

INSERT INTO
  public.projects (name, description, start_date, end_date)
VALUES
  (
    'Lego City Expansion',
    'Expansion of the Lego City environment with new buildings and characters',
    '2025-01-01',
    '2025-06-30'
  ),
  (
    'Lego Space Adventure',
    'Create a space-themed adventure set with astronauts and aliens',
    '2025-02-15',
    '2025-08-31'
  ),
  (
    'Lego Medieval Kingdom',
    'Develop a medieval kingdom with knights, castles, and dragons',
    '2025-03-01',
    '2025-09-30'
  ),
  (
    'Lego Underwater World',
    'Build an underwater city with submarines, mermaids, and sea creatures',
    '2025-04-01',
    '2025-10-31'
  ),
  (
    'Lego Superheroes',
    'Design superhero characters and action scenes for Lego sets',
    '2025-05-01',
    '2025-12-31'
  );