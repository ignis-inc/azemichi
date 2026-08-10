-- あぜみち PDFクラウド保管用セットアップ
-- Supabaseの「SQL Editor」で、このファイルの中身を全部貼り付けて実行してください。
-- 実行は1回だけでOKです。
--
-- 仕組み：
--   書類作成ツール（9ツール＋開業4点セット）でPDFを作成したとき、ログイン中であれば
--   そのPDFファイル本体をSupabase Storageに、種類・作成日時などの情報をテーブルに保存します。
--   ログインしていない場合（無料版の使い方）は、これまで通りダウンロードのみで、何も保存されません。
--   RLS（行レベルセキュリティ／Storageのアクセス制御）で、ログイン中の本人のPDFだけを
--   読み書きできます。他のユーザーのPDFは見えません／触れません。

-- 1) PDFファイル本体を置く場所（Storageバケット）
--    公開バケットではないため、URLを知っていても他人はアクセスできません。
insert into storage.buckets (id, name, public)
values ('generated-pdfs', 'generated-pdfs', false)
on conflict (id) do nothing;

-- 2) Storageのアクセス制御：自分のフォルダ（ユーザーID名のフォルダ）だけ読み書きできる
drop policy if exists "own pdfs select" on storage.objects;
drop policy if exists "own pdfs insert" on storage.objects;
drop policy if exists "own pdfs delete" on storage.objects;

create policy "own pdfs select" on storage.objects for select to authenticated
  using (bucket_id = 'generated-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own pdfs insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'generated-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own pdfs delete" on storage.objects for delete to authenticated
  using (bucket_id = 'generated-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3) PDFの情報（種類・作成日時・保存場所）を記録するテーブル
create table if not exists generated_documents (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  doc_type text not null,
  title text not null,
  filename text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index if not exists generated_documents_user_idx on generated_documents (user_id, created_at);
alter table generated_documents enable row level security;

drop policy if exists "generated_documents own select" on generated_documents;
drop policy if exists "generated_documents own insert" on generated_documents;
drop policy if exists "generated_documents own delete" on generated_documents;
create policy "generated_documents own select" on generated_documents for select to authenticated using (user_id = auth.uid());
create policy "generated_documents own insert" on generated_documents for insert to authenticated with check (user_id = auth.uid());
create policy "generated_documents own delete" on generated_documents for delete to authenticated using (user_id = auth.uid());

grant select, insert, delete on generated_documents to authenticated;
revoke all on generated_documents from anon;
