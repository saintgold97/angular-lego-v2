create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  created_at timestamp with time zone default now()
);

create unique index cities_name_country_unique
on public.cities (name, country);

insert into public.cities (name, country) values
('Roma', 'Italia'),
('Milano', 'Italia'),
('Torino', 'Italia'),
('Napoli', 'Italia'),
('Bologna', 'Italia'),
('Springfield', 'USA'),
('Austin', 'USA'),
('Denver', 'USA'),
('Seattle', 'USA'),
('Boston', 'USA'),
('Miami', 'USA'),
('New York', 'USA'),
('Los Angeles', 'USA'),
('Chicago', 'USA'),
('Houston', 'USA'),
('Atlanta', 'USA'),
('Phoenix', 'USA');