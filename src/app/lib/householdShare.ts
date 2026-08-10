import { getSupabaseBrowser } from "./supabaseBrowser";

// 家族間データ共有（世帯）まわりの共通API。
// テーブル household_members / household_invitations と、サーバー側関数（RPC）を呼ぶ。
// RLS・関数側で「自分の世帯だけ」に限定されるため、他の世帯の情報は取得できない。

export type Member = { user_id: string; email: string; joined_at: string; is_host: boolean };
export type Invitation = { id: string; token: string; invited_email: string; created_at: string };
export type InvitationInfo = { invited_email: string; host_email: string; status: string };

export async function getMyUserId(): Promise<string | null> {
  const { data } = await getSupabaseBrowser().auth.getUser();
  return data.user?.id ?? null;
}

// 自分の世帯のメンバー一覧（メール付き。ホストが先頭）
export async function listMembers(): Promise<Member[]> {
  const { data, error } = await getSupabaseBrowser().rpc("get_household_members");
  if (error) throw error;
  return (data ?? []) as Member[];
}

// 未使用（pending）の招待一覧
export async function listInvitations(): Promise<Invitation[]> {
  const { data, error } = await getSupabaseBrowser()
    .from("household_invitations")
    .select("id, token, invited_email, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invitation[];
}

// 招待を作成する（相手のメールを指定）。世帯ID・作成者・トークンはサーバー側で自動設定される。
export async function createInvitation(email: string): Promise<Invitation> {
  const { data, error } = await getSupabaseBrowser()
    .from("household_invitations")
    .insert({ invited_email: email.trim() })
    .select("id, token, invited_email, created_at")
    .single();
  if (error) throw error;
  return data as Invitation;
}

// 招待を取り消す（削除）
export async function cancelInvitation(id: string): Promise<void> {
  const { error } = await getSupabaseBrowser().from("household_invitations").delete().eq("id", id);
  if (error) throw error;
}

// メンバーを世帯から外す（ホストのみ他メンバーを外せる。関数側で権限判定）
export async function removeMember(userId: string): Promise<void> {
  const { error } = await getSupabaseBrowser().rpc("remove_member", { p_target: userId });
  if (error) throw error;
}

// 招待リンクの情報（宛先メール・ホストのメール・状態）。承認前の非メンバーでも取得できる。
export async function getInvitationInfo(token: string): Promise<InvitationInfo | null> {
  const { data, error } = await getSupabaseBrowser().rpc("get_invitation_info", { p_token: token });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? (row as InvitationInfo) : null;
}

// 招待を承認する（承認者は自分の記録を持って招待元の世帯へ合流）
export async function acceptInvitation(token: string): Promise<void> {
  const { error } = await getSupabaseBrowser().rpc("accept_invitation", { p_token: token });
  if (error) throw error;
}

// Supabase/Postgresのエラーを、利用者向けの日本語メッセージに整える
export function shareErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = String((err as { message: unknown }).message);
    if (m) return m;
  }
  return fallback;
}
