-- Initial schema for Stoneverse immo-invest-app
-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create portfolios table
create table public.portfolios (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  base_currency text default 'EUR',
  baseline_date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create legal_entities table
create table public.legal_entities (
  id uuid default uuid_generate_v4() primary key,
  portfolio_id uuid references public.portfolios(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('lmnp', 'lmp', 'sci_ir', 'sci_is', 'sarl', 'sas')),
  incorporation_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create properties table
create table public.properties (
  id uuid default uuid_generate_v4() primary key,
  portfolio_id uuid references public.portfolios(id) on delete cascade not null,
  legal_entity_id uuid references public.legal_entities(id) on delete cascade,
  address text not null,
  city text not null,
  postal_code text,
  country text default 'FR',
  property_type text not null check (property_type in ('apartment', 'house', 'commercial', 'parking', 'land')),
  property_subtype text,
  surface_area numeric(10,2),
  number_of_rooms integer,
  acquisition_date date not null,
  acquisition_price numeric(15,2) not null,
  current_value numeric(15,2) not null,
  rental_type text check (rental_type in ('furnished', 'unfurnished')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create loans table
create table public.loans (
  id uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  bank_name text not null,
  loan_type text default 'mortgage',
  initial_amount numeric(15,2) not null,
  current_balance numeric(15,2) not null,
  interest_rate numeric(5,4) not null,
  monthly_payment numeric(10,2) not null,
  start_date date not null,
  end_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create transactions table
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  portfolio_id uuid references public.portfolios(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete cascade,
  legal_entity_id uuid references public.legal_entities(id) on delete cascade,
  type text not null check (type in ('rental_income', 'expense', 'loan_payment', 'tax_payment', 'insurance', 'maintenance', 'other')),
  category text,
  description text not null,
  amount numeric(12,2) not null,
  transaction_date date not null,
  is_recurring boolean default false,
  recurring_frequency text check (recurring_frequency in ('monthly', 'quarterly', 'yearly')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create alerts table
create table public.alerts (
  id uuid default uuid_generate_v4() primary key,
  portfolio_id uuid references public.portfolios(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete cascade,
  legal_entity_id uuid references public.legal_entities(id) on delete cascade,
  type text not null check (type in ('payment_due', 'maintenance_required', 'tax_deadline', 'lease_expiry', 'market_opportunity', 'compliance_issue')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  title text not null,
  message text not null,
  status text default 'active' check (status in ('active', 'acknowledged', 'resolved', 'dismissed')),
  due_date date,
  acknowledged_at timestamp with time zone,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create fiscal_settings table
create table public.fiscal_settings (
  id uuid default uuid_generate_v4() primary key,
  legal_entity_id uuid references public.legal_entities(id) on delete cascade not null,
  regime_type text not null check (regime_type in ('lmnp', 'lmp', 'sci_ir', 'sci_is', 'sarl', 'sas')),
  tax_year integer not null,
  land_percentage numeric(5,2) default 20.00,
  depreciation_components jsonb default '{
    "building": {"rate": 2.5, "base_amount": 0},
    "furniture": {"rate": 10.0, "base_amount": 0},
    "equipment": {"rate": 20.0, "base_amount": 0}
  }'::jsonb,
  deduction_limits jsonb default '{
    "deficit_carryforward": 10700,
    "interest_deduction": 0.85
  }'::jsonb,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(legal_entity_id, tax_year)
);

-- Create RLS policies
alter table public.portfolios enable row level security;
alter table public.legal_entities enable row level security;
alter table public.properties enable row level security;
alter table public.loans enable row level security;
alter table public.transactions enable row level security;
alter table public.alerts enable row level security;
alter table public.fiscal_settings enable row level security;

-- Policies for portfolios
create policy "Users can view their own portfolios" on public.portfolios
  for select using (auth.uid() = user_id);

create policy "Users can insert their own portfolios" on public.portfolios
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own portfolios" on public.portfolios
  for update using (auth.uid() = user_id);

create policy "Users can delete their own portfolios" on public.portfolios
  for delete using (auth.uid() = user_id);

-- Policies for legal_entities
create policy "Users can view legal entities in their portfolios" on public.legal_entities
  for select using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = legal_entities.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can insert legal entities in their portfolios" on public.legal_entities
  for insert with check (
    exists (
      select 1 from public.portfolios
      where portfolios.id = legal_entities.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can update legal entities in their portfolios" on public.legal_entities
  for update using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = legal_entities.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can delete legal entities in their portfolios" on public.legal_entities
  for delete using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = legal_entities.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

-- Policies for properties
create policy "Users can view properties in their portfolios" on public.properties
  for select using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = properties.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can insert properties in their portfolios" on public.properties
  for insert with check (
    exists (
      select 1 from public.portfolios
      where portfolios.id = properties.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can update properties in their portfolios" on public.properties
  for update using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = properties.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can delete properties in their portfolios" on public.properties
  for delete using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = properties.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

-- Policies for loans
create policy "Users can view loans for their properties" on public.loans
  for select using (
    exists (
      select 1 from public.properties
      join public.portfolios on portfolios.id = properties.portfolio_id
      where properties.id = loans.property_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can insert loans for their properties" on public.loans
  for insert with check (
    exists (
      select 1 from public.properties
      join public.portfolios on portfolios.id = properties.portfolio_id
      where properties.id = loans.property_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can update loans for their properties" on public.loans
  for update using (
    exists (
      select 1 from public.properties
      join public.portfolios on portfolios.id = properties.portfolio_id
      where properties.id = loans.property_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can delete loans for their properties" on public.loans
  for delete using (
    exists (
      select 1 from public.properties
      join public.portfolios on portfolios.id = properties.portfolio_id
      where properties.id = loans.property_id
      and portfolios.user_id = auth.uid()
    )
  );

-- Policies for transactions
create policy "Users can view transactions in their portfolios" on public.transactions
  for select using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = transactions.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can insert transactions in their portfolios" on public.transactions
  for insert with check (
    exists (
      select 1 from public.portfolios
      where portfolios.id = transactions.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can update transactions in their portfolios" on public.transactions
  for update using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = transactions.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can delete transactions in their portfolios" on public.transactions
  for delete using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = transactions.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

-- Policies for alerts
create policy "Users can view alerts in their portfolios" on public.alerts
  for select using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = alerts.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can insert alerts in their portfolios" on public.alerts
  for insert with check (
    exists (
      select 1 from public.portfolios
      where portfolios.id = alerts.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can update alerts in their portfolios" on public.alerts
  for update using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = alerts.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can delete alerts in their portfolios" on public.alerts
  for delete using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = alerts.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

-- Policies for fiscal_settings
create policy "Users can view fiscal settings for their legal entities" on public.fiscal_settings
  for select using (
    exists (
      select 1 from public.legal_entities
      join public.portfolios on portfolios.id = legal_entities.portfolio_id
      where legal_entities.id = fiscal_settings.legal_entity_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can insert fiscal settings for their legal entities" on public.fiscal_settings
  for insert with check (
    exists (
      select 1 from public.legal_entities
      join public.portfolios on portfolios.id = legal_entities.portfolio_id
      where legal_entities.id = fiscal_settings.legal_entity_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can update fiscal settings for their legal entities" on public.fiscal_settings
  for update using (
    exists (
      select 1 from public.legal_entities
      join public.portfolios on portfolios.id = legal_entities.portfolio_id
      where legal_entities.id = fiscal_settings.legal_entity_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can delete fiscal settings for their legal entities" on public.fiscal_settings
  for delete using (
    exists (
      select 1 from public.legal_entities
      join public.portfolios on portfolios.id = legal_entities.portfolio_id
      where legal_entities.id = fiscal_settings.legal_entity_id
      and portfolios.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
create index idx_portfolios_user_id on public.portfolios(user_id);
create index idx_legal_entities_portfolio_id on public.legal_entities(portfolio_id);
create index idx_properties_portfolio_id on public.properties(portfolio_id);
create index idx_properties_legal_entity_id on public.properties(legal_entity_id);
create index idx_loans_property_id on public.loans(property_id);
create index idx_transactions_portfolio_id on public.transactions(portfolio_id);
create index idx_transactions_property_id on public.transactions(property_id);
create index idx_transactions_date on public.transactions(transaction_date);
create index idx_alerts_portfolio_id on public.alerts(portfolio_id);
create index idx_alerts_status on public.alerts(status);
create index idx_fiscal_settings_legal_entity_id on public.fiscal_settings(legal_entity_id);

-- Create functions for updated_at triggers
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at before update on public.portfolios
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.legal_entities
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.properties
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.loans
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.transactions
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.alerts
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.fiscal_settings
  for each row execute function public.handle_updated_at();