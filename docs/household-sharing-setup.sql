-- あぜみち 家族間データ共有（世帯）用セットアップ
-- Supabaseの「SQL Editor」で、このファイルの中身を全部貼り付けて実行してください。
-- 実行は1回だけでOKです（何度実行しても壊れないように書いてあります）。
--
-- 仕組み：
--   「世帯（household）」という共有グループを作り、/app/kicho・/app/boujo・/app/nisshi の
--   記録を「個人」ではなく「世帯」に紐づけます。同じ世帯のメンバーは全員、記録の
--   閲覧・追加・編集・削除ができます。他の世帯の記録は一切見えません。
--   ・新規登録すると、自動で「自分だけの世帯」ができます（その人がホスト＝オーナー）。
--   ・招待を承認すると、承認した人が招待した人の世帯に合流します（自分の記録も持って移動）。
--   ・ホストはメンバーを外せます。外された人の記録は世帯（ホスト側）に残り、外された人は
--     記録が空の新しい世帯からやり直します。ホスト自身は世帯から抜けられません。

-- ============================================================
-- 1) 世帯まわりのテーブル
-- ============================================================
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade, -- ホスト（オーナー）
  created_at timestamptz not null default now()
);

create table if not exists household_members (
  user_id uuid primary key references auth.users(id) on delete cascade, -- 1人1世帯
  household_id uuid not null references households(id) on delete cascade,
  joined_at timestamptz not null default now()
);
create index if not exists household_members_household_idx on household_members (household_id);

create table if not exists household_invitations (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(), -- 招待リンクの秘密のカギ
  household_id uuid not null references households(id) on delete cascade,
  invited_email text not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled')),
  created_at timestamptz not null default now(),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz
);
create index if not exists household_invitations_household_idx on household_invitations (household_id);

-- ============================================================
-- 2) 関数（RLSの無限ループを避けるため security definer を使う）
-- ============================================================

-- ログイン中ユーザーの世帯IDを返す（RLSを迂回してmembersを読むので再帰しない）
create or replace function public.current_household_id()
returns uuid language sql security definer stable set search_path = public as $$
  select household_id from household_members where user_id = auth.uid();
$$;

-- 新規登録時に「自分だけの世帯」を自動で作る
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_h uuid;
begin
  insert into households (owner_user_id) values (new.id) returning id into v_h;
  insert into household_members (user_id, household_id) values (new.id, v_h);
  return new;
end $$;

-- 自分の世帯のメンバー一覧（メール付き）を返す
create or replace function public.get_household_members()
returns table (user_id uuid, email text, joined_at timestamptz, is_host boolean)
language sql security definer stable set search_path = public as $$
  select m.user_id, u.email::text, m.joined_at, (h.owner_user_id = m.user_id) as is_host
  from household_members m
  join households h on h.id = m.household_id
  join auth.users u on u.id = m.user_id
  where m.household_id = public.current_household_id()
  order by (h.owner_user_id = m.user_id) desc, m.joined_at asc;
$$;

-- 招待リンクの情報（宛先メール・ホストのメール・状態）を返す（承認前の非メンバーでも見られる）
create or replace function public.get_invitation_info(p_token uuid)
returns table (invited_email text, host_email text, status text)
language sql security definer stable set search_path = public as $$
  select i.invited_email,
         (select u.email::text from auth.users u where u.id = h.owner_user_id),
         i.status
  from household_invitations i
  join households h on h.id = i.household_id
  where i.token = p_token;
$$;

-- 招待を承認する（承認者は自分の記録を持って、招待元の世帯に合流する）
create or replace function public.accept_invitation(p_token uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_inv household_invitations;
  v_caller uuid := auth.uid();
  v_caller_email text;
  v_old_household uuid;
  v_member_count int;
begin
  if v_caller is null then raise exception 'ログインが必要です'; end if;

  select * into v_inv from household_invitations where token = p_token;
  if not found then raise exception '招待が見つかりません'; end if;
  if v_inv.status <> 'pending' then raise exception 'この招待はすでに使用済みか、取り消されています'; end if;

  select email into v_caller_email from auth.users where id = v_caller;
  if lower(v_caller_email) <> lower(v_inv.invited_email) then
    raise exception 'この招待は別のメールアドレス宛てです';
  end if;

  select household_id into v_old_household from household_members where user_id = v_caller;
  if v_old_household = v_inv.household_id then
    raise exception 'すでにこの世帯に参加しています';
  end if;

  select count(*) into v_member_count from household_members where household_id = v_old_household;
  if v_member_count > 1 then
    raise exception 'すでに他の家族と共有している世帯にいるため、この招待は承認できません';
  end if;

  -- 承認者の記録を、新しい世帯へ付け替え（データを持って合流）
  update kicho_entries set household_id = v_inv.household_id where user_id = v_caller and household_id = v_old_household;
  update boujo_entries set household_id = v_inv.household_id where user_id = v_caller and household_id = v_old_household;
  update nisshi_entries set household_id = v_inv.household_id where user_id = v_caller and household_id = v_old_household;

  -- 所属を移動し、空になった元の世帯を削除
  update household_members set household_id = v_inv.household_id, joined_at = now() where user_id = v_caller;
  delete from households where id = v_old_household;

  update household_invitations set status = 'accepted', accepted_by = v_caller, accepted_at = now() where id = v_inv.id;
end $$;

-- メンバーを世帯から外す（外された人の記録は世帯に残す。外された人は空の新世帯へ）
create or replace function public.remove_member(p_target uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_caller uuid := auth.uid();
  v_household uuid;
  v_owner uuid;
  v_target_household uuid;
  v_new_household uuid;
begin
  if v_caller is null then raise exception 'ログインが必要です'; end if;

  select household_id into v_household from household_members where user_id = v_caller;
  if v_household is null then raise exception '世帯が見つかりません'; end if;
  select owner_user_id into v_owner from households where id = v_household;

  select household_id into v_target_household from household_members where user_id = p_target;
  if v_target_household is distinct from v_household then
    raise exception '対象のメンバーが見つかりません';
  end if;

  if p_target = v_owner then
    if v_caller = v_owner then
      raise exception 'ホストは世帯から抜けられません（世帯の解散・ホストの譲渡は今後対応予定です）';
    else
      raise exception 'ホストを外すことはできません';
    end if;
  end if;

  -- ホストは他メンバーを外せる。ホスト以外は自分自身だけ外せる（自分から抜ける）。
  if v_caller <> v_owner and p_target <> v_caller then
    raise exception 'メンバーを外せるのはホストだけです';
  end if;

  -- 対象の記録は世帯（ホスト側）にそのまま残し、対象を記録が空の新しい世帯へ移す
  insert into households (owner_user_id) values (p_target) returning id into v_new_household;
  update household_members set household_id = v_new_household, joined_at = now() where user_id = p_target;
end $$;

-- ============================================================
-- 3) 既存ユーザー・既存データの移行（データを失わない）
-- ============================================================

-- まだ世帯を持たない既存ユーザーに「自分だけの世帯」を作る
do $$
declare u record; v_h uuid;
begin
  for u in select id from auth.users where id not in (select user_id from household_members) loop
    insert into households (owner_user_id) values (u.id) returning id into v_h;
    insert into household_members (user_id, household_id) values (u.id, v_h);
  end loop;
end $$;

-- 記録テーブルに household_id を追加し、各自の世帯で埋める
alter table kicho_entries  add column if not exists household_id uuid references households(id) on delete cascade;
alter table boujo_entries  add column if not exists household_id uuid references households(id) on delete cascade;
alter table nisshi_entries add column if not exists household_id uuid references households(id) on delete cascade;

update kicho_entries  e set household_id = m.household_id from household_members m where m.user_id = e.user_id and e.household_id is null;
update boujo_entries  e set household_id = m.household_id from household_members m where m.user_id = e.user_id and e.household_id is null;
update nisshi_entries e set household_id = m.household_id from household_members m where m.user_id = e.user_id and e.household_id is null;

-- 今後の挿入では自動で世帯IDが入るようにし、NOT NULL化・索引を付ける
alter table kicho_entries  alter column household_id set default public.current_household_id();
alter table boujo_entries  alter column household_id set default public.current_household_id();
alter table nisshi_entries alter column household_id set default public.current_household_id();
alter table kicho_entries  alter column household_id set not null;
alter table boujo_entries  alter column household_id set not null;
alter table nisshi_entries alter column household_id set not null;
create index if not exists kicho_entries_household_idx  on kicho_entries  (household_id, created_at);
create index if not exists boujo_entries_household_idx  on boujo_entries  (household_id, created_at);
create index if not exists nisshi_entries_household_idx on nisshi_entries (household_id, created_at);

-- 招待テーブルも、挿入時に自動で自分の世帯IDが入るようにする
alter table household_invitations alter column household_id set default public.current_household_id();

-- ============================================================
-- 4) RLS（他の世帯は一切見えない）
-- ============================================================
alter table households enable row level security;
alter table household_members enable row level security;
alter table household_invitations enable row level security;

drop policy if exists "household select" on households;
create policy "household select" on households for select to authenticated using (id = public.current_household_id());

drop policy if exists "members select" on household_members;
create policy "members select" on household_members for select to authenticated using (household_id = public.current_household_id());

drop policy if exists "invitations select" on household_invitations;
drop policy if exists "invitations insert" on household_invitations;
drop policy if exists "invitations delete" on household_invitations;
create policy "invitations select" on household_invitations for select to authenticated using (household_id = public.current_household_id());
create policy "invitations insert" on household_invitations for insert to authenticated with check (household_id = public.current_household_id() and created_by = auth.uid());
create policy "invitations delete" on household_invitations for delete to authenticated using (household_id = public.current_household_id());

-- 記録テーブルのRLSを「個人」から「世帯」基準に張り替える
drop policy if exists "kicho own select" on kicho_entries;
drop policy if exists "kicho own insert" on kicho_entries;
drop policy if exists "kicho own update" on kicho_entries;
drop policy if exists "kicho own delete" on kicho_entries;
create policy "kicho household select" on kicho_entries for select to authenticated using (household_id = public.current_household_id());
create policy "kicho household insert" on kicho_entries for insert to authenticated with check (household_id = public.current_household_id());
create policy "kicho household update" on kicho_entries for update to authenticated using (household_id = public.current_household_id()) with check (household_id = public.current_household_id());
create policy "kicho household delete" on kicho_entries for delete to authenticated using (household_id = public.current_household_id());

drop policy if exists "boujo own select" on boujo_entries;
drop policy if exists "boujo own insert" on boujo_entries;
drop policy if exists "boujo own update" on boujo_entries;
drop policy if exists "boujo own delete" on boujo_entries;
create policy "boujo household select" on boujo_entries for select to authenticated using (household_id = public.current_household_id());
create policy "boujo household insert" on boujo_entries for insert to authenticated with check (household_id = public.current_household_id());
create policy "boujo household update" on boujo_entries for update to authenticated using (household_id = public.current_household_id()) with check (household_id = public.current_household_id());
create policy "boujo household delete" on boujo_entries for delete to authenticated using (household_id = public.current_household_id());

drop policy if exists "nisshi own select" on nisshi_entries;
drop policy if exists "nisshi own insert" on nisshi_entries;
drop policy if exists "nisshi own update" on nisshi_entries;
drop policy if exists "nisshi own delete" on nisshi_entries;
create policy "nisshi household select" on nisshi_entries for select to authenticated using (household_id = public.current_household_id());
create policy "nisshi household insert" on nisshi_entries for insert to authenticated with check (household_id = public.current_household_id());
create policy "nisshi household update" on nisshi_entries for update to authenticated using (household_id = public.current_household_id()) with check (household_id = public.current_household_id());
create policy "nisshi household delete" on nisshi_entries for delete to authenticated using (household_id = public.current_household_id());

-- ============================================================
-- 5) 権限（grant）とトリガー
-- ============================================================
grant select on households to authenticated;
grant select on household_members to authenticated;
grant select, insert, delete on household_invitations to authenticated;
revoke all on households from anon;
revoke all on household_members from anon;
revoke all on household_invitations from anon;

grant execute on function public.current_household_id() to authenticated;
grant execute on function public.get_household_members() to authenticated;
grant execute on function public.get_invitation_info(uuid) to authenticated;
grant execute on function public.accept_invitation(uuid) to authenticated;
grant execute on function public.remove_member(uuid) to authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
