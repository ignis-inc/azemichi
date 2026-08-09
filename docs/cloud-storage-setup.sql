-- あぜみち ログイン版のクラウド保存用セットアップ
-- Supabaseの「SQL Editor」で、このファイルの中身を全部貼り付けて実行してください。
-- 実行は1回だけでOKです。
--
-- 仕組み：
--   /app/kicho・/app/boujo・/app/nisshi で記録したデータを、ユーザーごとに保存します。
--   各記録は data(jsonb) に「無料版と同じかたち」でそのまま入ります（項目名・型はそのまま）。
--   RLS（行レベルセキュリティ）で、ログイン中の本人の記録だけを読み書きできます。
--   他のユーザーの記録は見えません／触れません。

-- 共通のかたち：
--   id         … 記録ごとの識別子（アプリが作るUUID。重複取り込み防止にも使う）
--   user_id    … 持ち主（ログイン中のユーザー。自動で入る）
--   data       … 記録の中身そのもの（無料版のデータ構造をそのまま保存）
--   created_at … 作成日時

-- ============ 記帳（/app/kicho）============
create table if not exists kicho_entries (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists kicho_entries_user_idx on kicho_entries (user_id, created_at);
alter table kicho_entries enable row level security;

drop policy if exists "kicho own select" on kicho_entries;
drop policy if exists "kicho own insert" on kicho_entries;
drop policy if exists "kicho own update" on kicho_entries;
drop policy if exists "kicho own delete" on kicho_entries;
create policy "kicho own select" on kicho_entries for select to authenticated using (user_id = auth.uid());
create policy "kicho own insert" on kicho_entries for insert to authenticated with check (user_id = auth.uid());
create policy "kicho own update" on kicho_entries for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "kicho own delete" on kicho_entries for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on kicho_entries to authenticated;
revoke all on kicho_entries from anon;

-- ============ 農薬・肥料記録（/app/boujo）============
create table if not exists boujo_entries (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists boujo_entries_user_idx on boujo_entries (user_id, created_at);
alter table boujo_entries enable row level security;

drop policy if exists "boujo own select" on boujo_entries;
drop policy if exists "boujo own insert" on boujo_entries;
drop policy if exists "boujo own update" on boujo_entries;
drop policy if exists "boujo own delete" on boujo_entries;
create policy "boujo own select" on boujo_entries for select to authenticated using (user_id = auth.uid());
create policy "boujo own insert" on boujo_entries for insert to authenticated with check (user_id = auth.uid());
create policy "boujo own update" on boujo_entries for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "boujo own delete" on boujo_entries for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on boujo_entries to authenticated;
revoke all on boujo_entries from anon;

-- ============ 農作業日誌（/app/nisshi）============
create table if not exists nisshi_entries (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists nisshi_entries_user_idx on nisshi_entries (user_id, created_at);
alter table nisshi_entries enable row level security;

drop policy if exists "nisshi own select" on nisshi_entries;
drop policy if exists "nisshi own insert" on nisshi_entries;
drop policy if exists "nisshi own update" on nisshi_entries;
drop policy if exists "nisshi own delete" on nisshi_entries;
create policy "nisshi own select" on nisshi_entries for select to authenticated using (user_id = auth.uid());
create policy "nisshi own insert" on nisshi_entries for insert to authenticated with check (user_id = auth.uid());
create policy "nisshi own update" on nisshi_entries for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "nisshi own delete" on nisshi_entries for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on nisshi_entries to authenticated;
revoke all on nisshi_entries from anon;
