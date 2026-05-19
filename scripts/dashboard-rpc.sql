-- Dashboard aggregation RPCs (KST-based)

create index if not exists idx_pr_registered_at_line
  on public.production_records (registered_at, line);

create index if not exists idx_pr_registered_at_kst_date
  on public.production_records (((registered_at at time zone 'Asia/Seoul')::date));

create or replace function public.rpc_dashboard_daily_trend(
  p_start date,
  p_end date,
  p_line text default 'all'
)
returns table (
  day date,
  count bigint,
  pyung numeric,
  line1_count bigint,
  line2_count bigint
)
language sql
stable
as $$
with days as (
  select generate_series(p_start, p_end, interval '1 day')::date as day
),
agg as (
  select
    (registered_at at time zone 'Asia/Seoul')::date as day,
    count(*)::bigint as count,
    coalesce(sum(pyung), 0)::numeric as pyung,
    count(*) filter (where line = '1-LINE')::bigint as line1_count,
    count(*) filter (where line = '2-LINE')::bigint as line2_count
  from public.production_records
  where (registered_at at time zone 'Asia/Seoul')::date between p_start and p_end
    and (p_line = 'all' or line = p_line)
  group by 1
)
select
  d.day,
  coalesce(a.count, 0) as count,
  coalesce(a.pyung, 0) as pyung,
  coalesce(a.line1_count, 0) as line1_count,
  coalesce(a.line2_count, 0) as line2_count
from days d
left join agg a on a.day = d.day
order by d.day;
$$;

create or replace function public.rpc_dashboard_kpi(
  p_start date,
  p_end date,
  p_line text default 'all'
)
returns table (
  total_count bigint,
  total_pyung numeric,
  avg_daily_pyung numeric,
  line1_ratio numeric,
  line2_ratio numeric
)
language sql
stable
as $$
with base as (
  select
    count(*)::bigint as total_count,
    coalesce(sum(pyung), 0)::numeric as total_pyung,
    count(*) filter (where line = '1-LINE')::numeric as line1_count,
    count(*) filter (where line = '2-LINE')::numeric as line2_count
  from public.production_records
  where (registered_at at time zone 'Asia/Seoul')::date between p_start and p_end
    and (p_line = 'all' or line = p_line)
),
d as (
  select greatest((p_end - p_start + 1), 1)::numeric as day_cnt
)
select
  b.total_count,
  b.total_pyung,
  round(b.total_pyung / d.day_cnt, 4) as avg_daily_pyung,
  case when b.total_count = 0 then 0 else b.line1_count / b.total_count end as line1_ratio,
  case when b.total_count = 0 then 0 else b.line2_count / b.total_count end as line2_ratio
from base b, d;
$$;

create or replace function public.rpc_dashboard_yoy(
  p_start date,
  p_end date,
  p_line text default 'all'
)
returns table (
  month int,
  current_count bigint,
  prev_count bigint,
  growth_pct numeric
)
language sql
stable
as $$
with cur as (
  select
    extract(month from (registered_at at time zone 'Asia/Seoul'))::int as m,
    count(*)::bigint as c
  from public.production_records
  where (registered_at at time zone 'Asia/Seoul')::date between p_start and p_end
    and (p_line = 'all' or line = p_line)
  group by 1
),
prev as (
  select
    extract(month from (registered_at at time zone 'Asia/Seoul'))::int as m,
    count(*)::bigint as c
  from public.production_records
  where (registered_at at time zone 'Asia/Seoul')::date
    between (p_start - interval '1 year')::date and (p_end - interval '1 year')::date
    and (p_line = 'all' or line = p_line)
  group by 1
),
m as (
  select generate_series(1, 12) as month
)
select
  m.month,
  coalesce(cur.c, 0) as current_count,
  coalesce(prev.c, 0) as prev_count,
  case
    when coalesce(prev.c, 0) = 0 then null
    else round(((coalesce(cur.c, 0)::numeric - prev.c::numeric) / prev.c::numeric) * 100, 1)
  end as growth_pct
from m
left join cur on cur.m = m.month
left join prev on prev.m = m.month
order by m.month;
$$;

create or replace function public.rpc_pivot_bucketed(
  p_start date,
  p_end date,
  p_line text default 'all',
  p_unit text default 'month',
  p_dimension text default 'client',
  p_metric text default 'count'
)
returns table (
  period text,
  dim text,
  value numeric
)
language sql
stable
as $$
with src as (
  select
    case
      when p_unit = 'day'
        then to_char((registered_at at time zone 'Asia/Seoul')::date, 'YYYY-MM-DD')
      else to_char((registered_at at time zone 'Asia/Seoul')::date, 'YYYY-MM')
    end as period,
    case
      when p_dimension = 'client' then coalesce(client, '(미입력)')
      when p_dimension = 'item_code' then coalesce(nullif(item_name, ''), '(미입력)')
      when p_dimension = 'line' then coalesce(line, '(미입력)')
      when p_dimension = 'registrar' then coalesce(registrar, '(미입력)')
      else coalesce(client, '(미입력)')
    end as dim,
    case
      when p_metric = 'pyung' then coalesce(pyung, 0)::numeric
      else 1::numeric
    end as metric_value
  from public.production_records
  where (registered_at at time zone 'Asia/Seoul')::date between p_start and p_end
    and (p_line = 'all' or line = p_line)
)
select period, dim, sum(metric_value)::numeric as value
from src
group by period, dim
order by period, dim;
$$;

