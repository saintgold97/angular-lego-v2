create table characters (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    lastname text not null,
    email text not null unique,
    phone text,
    picture text,
    gender text,
    created_at timestamptz default now(),
    city_name text,
    
    -- Foreign Keys
    project_id uuid references projects(id),
    created_by uuid references profiles(id)
);

-- Example Seed
insert into
    characters (
        name,
        lastname,
        email,
        phone,
        picture,
        gender,
        city_name
    )
values
    (
        'Jerome',
        'Castillo',
        'jerome.castillo25@example.com',
        '(676)-466-5035',
        'http://api.randomuser.me/portraits/lego/2.jpg',
        'male',
        'Torino (TO)'
    ),
    (
        'Martha',
        'Smith',
        'martha.smith@example.com',
        '(123)-456-7890',
        'http://api.randomuser.me/portraits/lego/3.jpg',
        'female',
        'Milano (MI)'
    ),
    (
        'Carlos',
        'Lopez',
        'carlos.lopez@example.com',
        '(234)-567-8901',
        'http://api.randomuser.me/portraits/lego/4.jpg',
        'male',
        'Centuripe (EN)'
    ),
    (
        'Emily',
        'Johnson',
        'emily.johnson@example.com',
        '(345)-678-9012',
        'http://api.randomuser.me/portraits/lego/5.jpg',
        'female',
        'Paternò (CT)'
    ),
    (
        'Oliver',
        'Brown',
        'oliver.brown@example.com',
        '(456)-789-0123',
        'http://api.randomuser.me/portraits/lego/6.jpg',
        'male',
        'Roma (RM)'
    ),
    (
        'Sophia',
        'Davis',
        'sophia.davis@example.com',
        '(567)-890-1234',
        'http://api.randomuser.me/portraits/lego/7.jpg',
        'female',
        'Napoli (NA)'
    ),
    (
        'Liam',
        'Miller',
        'liam.miller@example.com',
        '(678)-901-2345',
        'http://api.randomuser.me/portraits/lego/8.jpg',
        'male',
        'Bologna (BL)'
    ),
    (
        'Isabella',
        'Martinez',
        'isabella.martinez@example.com',
        '(789)-012-3456',
        'http://api.randomuser.me/portraits/lego/9.jpg',
        'female',
        'Milano (MI)'
    ),
    (
        'Noah',
        'Garcia',
        'noah.garcia@example.com',
        '(890)-123-4567',
        'http://api.randomuser.me/portraits/lego/10.jpg',
        'male',
        'Roma (RM)'
    ),
    (
        'Ava',
        'Rodriguez',
        'ava.rodriguez@example.com',
        '(901)-234-5678',
        'http://api.randomuser.me/portraits/lego/11.jpg',
        'female',
        'Napoli (NA)'
    );