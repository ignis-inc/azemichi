-- あぜみち 匿名アクセス集計（閲覧数カウント機能）用セットアップ
-- Supabaseの「SQL Editor」で、このファイルの中身を全部貼り付けて実行してください。
-- 実行は1回だけでOKです（つくり直したいときは down.sql を先に実行してから）。

-- 1) 記録用テーブル
--    個人を特定できる情報（IPアドレス・氏名・メールなど）は一切保存しません。
--    event_type: "page_view"（ページ閲覧）／"pdf_create"（PDF作成）／"record_save"（記録保存）
--    key: ページのパス（例：/kome）や、ツール名（例：kicho）
create table if not exists analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('page_view', 'pdf_create', 'record_save')),
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_type_key_created_idx
  on analytics_events (event_type, key, created_at);

-- 2) 行レベルセキュリティ（RLS）
--    「記録の追加（insert）」は誰でもできる（匿名の利用者もカウント対象にするため）。
--    「読み取り（select）」は誰にも許可しない＝管理画面はservice_role（秘密鍵）経由でのみ読む。
alter table analytics_events enable row level security;

drop policy if exists "anyone can insert analytics events" on analytics_events;
create policy "anyone can insert analytics events"
  on analytics_events for insert
  to anon, authenticated
  with check (true);

-- 念のため、テーブルへの読み取り権限も明示的に外しておく（RLSと二重の守り）
revoke select on analytics_events from anon, authenticated;
grant insert on analytics_events to anon, authenticated;

-- 3) 集計用ビュー（合計・日別・月別）
--    security_invoker = true にすることで、ビュー越しに見るときも上と同じRLSが効くようにする
--    （こうしないと、閲覧者の権限に関わらずビューの持ち主の権限で見えてしまうため）
create or replace view analytics_totals
  with (security_invoker = true) as
  select event_type, key, count(*)::bigint as count
  from analytics_events
  group by event_type, key;

create or replace view analytics_daily
  with (security_invoker = true) as
  select event_type, key, date_trunc('day', created_at)::date as day, count(*)::bigint as count
  from analytics_events
  group by event_type, key, day;

create or replace view analytics_monthly
  with (security_invoker = true) as
  select event_type, key, date_trunc('month', created_at)::date as month, count(*)::bigint as count
  from analytics_events
  group by event_type, key, month;

revoke select on analytics_totals, analytics_daily, analytics_monthly from anon, authenticated;
