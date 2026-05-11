-- =====================================================================
-- Supabase SQL Editor에서 실행하세요
-- Dashboard API용 집계 RPC 함수
-- =====================================================================

-- 날짜별 생산 집계: trend API, anomaly API 공용
CREATE OR REPLACE FUNCTION get_daily_trend(
  p_start text,
  p_end   text,
  p_line  text DEFAULT 'all'
)
RETURNS TABLE(
  day       text,
  cnt       bigint,
  pyung_sum numeric,
  line1_cnt bigint,
  line2_cnt bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    (registered_at AT TIME ZONE 'UTC')::date::text AS day,
    COUNT(*)::bigint                                AS cnt,
    COALESCE(SUM(pyung), 0)::numeric               AS pyung_sum,
    COUNT(*) FILTER (WHERE line = '1-LINE')::bigint AS line1_cnt,
    COUNT(*) FILTER (WHERE line = '2-LINE')::bigint AS line2_cnt
  FROM production_records
  WHERE
    registered_at >= (p_start || 'T00:00:00Z')::timestamptz
    AND registered_at <= (p_end || 'T23:59:59.999Z')::timestamptz
    AND (p_line = 'all' OR line = p_line)
  GROUP BY (registered_at AT TIME ZONE 'UTC')::date
  ORDER BY 1;
$$;

-- 기간 합계: KPI API용
CREATE OR REPLACE FUNCTION get_period_stats(
  p_start text,
  p_end   text,
  p_line  text DEFAULT 'all'
)
RETURNS TABLE(
  total_count bigint,
  total_pyung numeric,
  line1_count bigint,
  line2_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*)::bigint                                AS total_count,
    COALESCE(SUM(pyung), 0)::numeric               AS total_pyung,
    COUNT(*) FILTER (WHERE line = '1-LINE')::bigint AS line1_count,
    COUNT(*) FILTER (WHERE line = '2-LINE')::bigint AS line2_count
  FROM production_records
  WHERE
    registered_at >= (p_start || 'T00:00:00Z')::timestamptz
    AND registered_at <= (p_end || 'T23:59:59.999Z')::timestamptz
    AND (p_line = 'all' OR line = p_line);
$$;

-- =====================================================================
-- 검증 쿼리 (실행 후 세 값이 일치해야 함)
-- =====================================================================
-- SELECT COUNT(*) FROM production_records
--   WHERE registered_at >= '2024-01-01T00:00:00Z'
--     AND registered_at <= '2024-12-31T23:59:59.999Z';
--
-- SELECT * FROM get_period_stats('2024-01-01', '2024-12-31', 'all');
--
-- SELECT SUM(cnt) FROM get_daily_trend('2024-01-01', '2024-12-31', 'all');
