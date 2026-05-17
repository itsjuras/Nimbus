-- Push tokens
create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  token text not null,
  created_at timestamptz default now(),
  unique(profile_id, token)
);

alter table push_tokens enable row level security;

create policy "crew can manage own push tokens"
  on push_tokens for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "owners/managers can read company push tokens"
  on push_tokens for select
  using (
    profile_id in (
      select id from profiles
      where company_id = (select company_id from profiles where id = auth.uid())
    )
  );

-- Time off requests
create table time_off_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz default now()
);

alter table time_off_requests enable row level security;

create policy "crew can manage own time off requests"
  on time_off_requests for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "owners/managers can view company time off requests"
  on time_off_requests for select
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) in ('owner', 'manager')
  );

create policy "owners/managers can update company time off requests"
  on time_off_requests for update
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) in ('owner', 'manager')
  );

-- Crew availability
create table crew_availability (
  profile_id uuid references profiles(id) on delete cascade,
  day_of_week smallint check (day_of_week between 0 and 6),
  available boolean default true,
  primary key (profile_id, day_of_week)
);

alter table crew_availability enable row level security;

create policy "crew can manage own availability"
  on crew_availability for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "owners/managers can view company availability"
  on crew_availability for select
  using (
    profile_id in (
      select id from profiles
      where company_id = (select company_id from profiles where id = auth.uid())
    )
    and (select role from profiles where id = auth.uid()) in ('owner', 'manager')
  );
