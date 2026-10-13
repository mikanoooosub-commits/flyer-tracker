-- ============================================================================
-- WO-004 の戻し SQL（app_settings を消す）
--
-- ⚠️ 流す順番: 先にコードを戻す（COOLDOWN_DAYS のある WO-004 より前の版を本番に出す）→ その後でこの SQL を流す。
--    逆にすると、本番の小学校マスタが「クールダウンの日数を読み込めなかった…」になる（WO-004 前提・不変条件）。
-- ⚠️ 画面から変えた日数の値も消える（記録は残さない仕様＝ Q-2）。流す前に今の値を控えておく:
--      select 'public' as schema, cooldown_days from public.app_settings
--      union all select 'demo', cooldown_days from demo.app_settings;
-- 流すのはオーナー（使う場面が来たとき）。
-- ============================================================================
drop table if exists demo.app_settings;
drop table if exists public.app_settings;
