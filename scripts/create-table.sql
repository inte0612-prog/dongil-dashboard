-- production_records 테이블 생성
CREATE TABLE IF NOT EXISTS production_records (
  id            bigserial PRIMARY KEY,
  s_flag        boolean,
  registered_at timestamptz NOT NULL,
  pid           varchar(20),
  process       varchar(50),
  item_code     varchar(20),
  item_name     text,
  width         integer,
  height        integer,
  quantity      integer,
  pyung         numeric(10, 4),
  order_no      varchar(20),
  seq_no        integer,
  client        text,
  site          text,
  line          varchar(10),
  registrar     varchar(20),
  remark        text
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_registered_at ON production_records (registered_at);
CREATE INDEX IF NOT EXISTS idx_line          ON production_records (line);
CREATE INDEX IF NOT EXISTS idx_item_code     ON production_records (item_code);
CREATE INDEX IF NOT EXISTS idx_client        ON production_records (client);
CREATE INDEX IF NOT EXISTS idx_order_no      ON production_records (order_no);

-- RLS 활성화 (서버 측에서만 접근)
ALTER TABLE production_records ENABLE ROW LEVEL SECURITY;

-- 서비스 롤은 RLS 우회, anon/authenticated 는 SELECT 만 허용
CREATE POLICY "anon read" ON production_records
  FOR SELECT USING (true);
