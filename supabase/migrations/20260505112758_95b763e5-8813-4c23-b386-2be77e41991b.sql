alter table public.subscriptions add column pickup_day smallint;
alter table public.subscriptions add constraint pickup_day_range check (pickup_day is null or (pickup_day between 0 and 6));