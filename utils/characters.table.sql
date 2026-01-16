create table
    characters (
        id uuid default gen_random_uuid () primary key,
        name text not null,
        lastname text not null,
        email text not null unique,
        phone text,
        picture text,
        gender text,
        city text,
        created_at timestamp
        with
            time zone default now ()
    );

-- Inserimento dei personaggi nel database
insert into
    characters (
        name,
        lastname,
        email,
        phone,
        picture,
        gender,
        city
    )
values
    (
        'Jerome',
        'Castillo',
        'jerome.castillo25@example.com',
        '(676)-466-5035',
        'http://api.randomuser.me/portraits/lego/2.jpg',
        'male',
        'Roanoke'
    ),
    (
        'Martha',
        'Smith',
        'martha.smith@example.com',
        '(123)-456-7890',
        'http://api.randomuser.me/portraits/lego/3.jpg',
        'female',
        'Springfield'
    ),
    (
        'Carlos',
        'Lopez',
        'carlos.lopez@example.com',
        '(234)-567-8901',
        'http://api.randomuser.me/portraits/lego/4.jpg',
        'male',
        'Austin'
    ),
    (
        'Emily',
        'Johnson',
        'emily.johnson@example.com',
        '(345)-678-9012',
        'http://api.randomuser.me/portraits/lego/5.jpg',
        'female',
        'Chicago'
    ),
    (
        'Oliver',
        'Brown',
        'oliver.brown@example.com',
        '(456)-789-0123',
        'http://api.randomuser.me/portraits/lego/6.jpg',
        'male',
        'Seattle'
    ),
    (
        'Sophia',
        'Davis',
        'sophia.davis@example.com',
        '(567)-890-1234',
        'http://api.randomuser.me/portraits/lego/7.jpg',
        'female',
        'Boston'
    ),
    (
        'Liam',
        'Miller',
        'liam.miller@example.com',
        '(678)-901-2345',
        'http://api.randomuser.me/portraits/lego/8.jpg',
        'male',
        'Denver'
    ),
    (
        'Isabella',
        'Martinez',
        'isabella.martinez@example.com',
        '(789)-012-3456',
        'http://api.randomuser.me/portraits/lego/9.jpg',
        'female',
        'Miami'
    ),
    (
        'Noah',
        'Garcia',
        'noah.garcia@example.com',
        '(890)-123-4567',
        'http://api.randomuser.me/portraits/lego/10.jpg',
        'male',
        'Phoenix'
    ),
    (
        'Ava',
        'Rodriguez',
        'ava.rodriguez@example.com',
        '(901)-234-5678',
        'http://api.randomuser.me/portraits/lego/11.jpg',
        'female',
        'Atlanta'
    );