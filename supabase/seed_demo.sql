-- ============================================================================
-- デモ環境用のダミーデータ投入スクリプト
-- ※ 必ず「デモ用の Supabase プロジェクト」でのみ実行してください（本番では実行しない）。
-- ※ schema.sql を実行済みの状態で、このスクリプトを1回だけ実行します。
--    （複数回実行すると重複登録されます）
-- 実在の学校とは無関係の架空データです。座標は東京都板橋区付近。
-- ============================================================================

with s as (
  insert into public.schools (name, lat, lng, url) values
    ('デモ第一小学校', 35.7512, 139.7090, 'https://example.com/'),
    ('デモ第二小学校', 35.7462, 139.7162, null)
  returning id, name
),
l as (
  insert into public.locations (school_id, spot, lat, lng)
  select id, spot, lat, lng from (
    select (select id from s where name = 'デモ第一小学校') as id, '正門西側'::text as spot,
           35.7514::float8 as lat, 139.7085::float8 as lng
    union all
    select (select id from s where name = 'デモ第一小学校'), '南門前', 35.7505, 139.7098
    union all
    select (select id from s where name = 'デモ第二小学校'), '通用口', 35.7462, 139.7162
  ) x
  returning id, spot
)
insert into public.visits (location_id, date, start_time, end_time, count, rating, memo)
select id, d, st, et, c, r, nullif(m, '') from (
  select (select id from l where spot = '正門西側') as id,
         date '2026-06-10' as d, time '14:20' as st, time '14:50' as et,
         52 as c, 'good'::text as r, '初回実施'::text as m
  union all
  select (select id from l where spot = '正門西側'), date '2026-06-24', time '15:00', time '15:20', 30, 'normal', ''
  union all
  select (select id from l where spot = '南門前'), date '2026-06-11', time '08:00', time '08:20', 0, 'bad', '警備員に注意され配布できず'
  union all
  select (select id from l where spot = '通用口'), date '2026-06-15', time '16:00', time '16:40', 80, 'good', '反応良好'
  union all
  select (select id from l where spot = '通用口'), date '2026-06-29', time '16:10', time '16:35', 45, 'normal', ''
) y;

insert into public.map_notes (lat, lng, color, label, memo) values
  (35.7509, 139.7101, 'yellow', '掲示板前', '人通りが多い時間帯あり'),
  (35.7475, 139.7148, 'purple', '次回候補', '次回はこの辺りで配りたい');
