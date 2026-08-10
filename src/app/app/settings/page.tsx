"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthBar from "../../components/AuthBar";
import {
  listMembers,
  listInvitations,
  createInvitation,
  cancelInvitation,
  removeMember,
  getMyUserId,
  shareErrorMessage,
  type Member,
  type Invitation,
} from "../../lib/householdShare";

export default function SettingsPage() {
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function reload() {
    setLoadError(null);
    try {
      const [uid, mem, inv] = await Promise.all([getMyUserId(), listMembers(), listInvitations()]);
      setMyUserId(uid);
      setMembers(mem);
      setInvitations(inv);
    } catch (err) {
      console.error(err);
      setLoadError(shareErrorMessage(err, "読み込みに失敗しました。画面を再読み込みしてお試しください。"));
    }
  }

  useEffect(() => {
    // 効果内での同期的なsetStateを避けるため、マイクロタスクにずらして呼び出す
    void Promise.resolve().then(() => reload());
  }, []);

  const iAmHost = !!members?.find((m) => m.user_id === myUserId)?.is_host;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setNewLink(null);
    setCopied(false);
    setInviteBusy(true);
    try {
      const inv = await createInvitation(inviteEmail);
      const link = `${window.location.origin}/invite?token=${inv.token}`;
      setNewLink(link);
      setInviteEmail("");
      await reload();
    } catch (err) {
      console.error(err);
      setInviteError(shareErrorMessage(err, "招待の作成に失敗しました。もう一度お試しください。"));
    } finally {
      setInviteBusy(false);
    }
  }

  async function handleCopy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function handleCancelInvitation(id: string) {
    if (!window.confirm("この招待を取り消します。よろしいですか？")) return;
    setActionError(null);
    try {
      await cancelInvitation(id);
      await reload();
    } catch (err) {
      console.error(err);
      setActionError(shareErrorMessage(err, "取り消しに失敗しました。"));
    }
  }

  async function handleRemove(member: Member) {
    const isSelf = member.user_id === myUserId;
    const msg = isSelf
      ? "この世帯から抜けます。あなたの記録は世帯に残り、あなたは記録が空の新しい世帯からやり直します。よろしいですか？"
      : `${member.email} さんを世帯から外します。この方の記録は世帯に残ります。よろしいですか？`;
    if (!window.confirm(msg)) return;
    setActionError(null);
    try {
      await removeMember(member.user_id);
      await reload();
    } catch (err) {
      console.error(err);
      setActionError(shareErrorMessage(err, "処理に失敗しました。"));
    }
  }

  const sectionClass = "bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-6";
  const inputClass =
    "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 focus:outline-none transition-colors";

  return (
    <div className="min-h-screen bg-green-50">
      <AuthBar />

      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">家族・世帯の共有設定</h1>
        <p className="mt-2 text-green-100 text-base">記帳・農薬肥料記録・農作業日誌を家族で共有できます</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="border-2 border-green-300 bg-green-50 rounded-xl px-5 py-4">
          <p className="text-base font-bold text-green-900 leading-relaxed">
            同じ世帯のメンバーは、記帳・農薬肥料記録・農作業日誌のデータを全員で共有します。
          </p>
          <p className="text-sm text-green-800 leading-relaxed mt-1">
            招待したい方のメールアドレスを入力してリンクを作り、そのリンクをLINEやメールで相手に送ってください。相手は先にログイン（新規登録）してからリンクを開くと承認できます。
          </p>
        </div>
        <div className="mt-4">
          <Link href="/app/dashboard" className="text-base font-bold text-green-700 underline underline-offset-4 hover:text-green-800">
            ← ダッシュボードへ
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loadError && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-xl px-5 py-4 mb-6">
            <p className="text-base text-rose-800">{loadError}</p>
          </div>
        )}

        {/* メンバー一覧 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">世帯のメンバー</h2>
          {members === null && !loadError ? (
            <p className="text-base text-gray-500">読み込み中…</p>
          ) : (
            <div className="space-y-3">
              {members?.map((m) => {
                const isSelf = m.user_id === myUserId;
                const canRemove = !m.is_host && (iAmHost || isSelf);
                return (
                  <div key={m.user_id} className="flex items-center justify-between gap-3 border-2 border-green-100 rounded-xl p-4">
                    <div className="min-w-0">
                      <p className="text-base font-bold text-gray-800 truncate">{m.email}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {m.is_host ? "ホスト" : "メンバー"}
                        {isSelf && "・あなた"}
                      </p>
                    </div>
                    {canRemove && (
                      <button
                        onClick={() => handleRemove(m)}
                        className="shrink-0 text-rose-600 underline text-sm"
                      >
                        {isSelf ? "この世帯から抜ける" : "外す"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {actionError && <p className="text-red-600 text-base mt-4">{actionError}</p>}
        </section>

        {/* 招待する */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">家族を招待する</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-base font-bold text-gray-700 mb-1" htmlFor="invite-email">
                招待する方のメールアドレス
              </label>
              <input
                id="invite-email"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="例：family@example.com"
                className={inputClass}
              />
              <p className="text-sm text-gray-500 mt-1">
                このメールアドレスで登録・ログインした方だけが承認できます。
              </p>
            </div>
            {inviteError && (
              <p className="text-red-600 text-base bg-red-50 border border-red-200 rounded-lg px-3 py-2">{inviteError}</p>
            )}
            <button
              type="submit"
              disabled={inviteBusy}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-60 text-white text-lg font-bold py-4 rounded-2xl shadow-md transition-colors"
            >
              {inviteBusy ? "作成中…" : "招待リンクを作る"}
            </button>
          </form>

          {newLink && (
            <div className="mt-5 border-2 border-green-300 bg-green-50 rounded-xl p-4">
              <p className="text-base font-bold text-green-900 mb-2">招待リンクができました</p>
              <p className="text-sm text-green-800 mb-3">
                このリンクをLINEやメールで相手に送ってください。相手がログイン後に開いて承認すると、共有が始まります。
              </p>
              <p className="break-all bg-white border border-green-200 rounded-lg px-3 py-2 text-sm text-gray-700">{newLink}</p>
              <button
                onClick={() => handleCopy(newLink)}
                className="mt-3 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              >
                {copied ? "コピーしました" : "リンクをコピー"}
              </button>
            </div>
          )}
        </section>

        {/* 送信済みの招待 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">送信中の招待</h2>
          {invitations.length === 0 ? (
            <p className="text-base text-gray-500">送信中の招待はありません。</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => {
                const link = `${typeof window !== "undefined" ? window.location.origin : ""}/invite?token=${inv.token}`;
                return (
                  <div key={inv.id} className="border-2 border-green-100 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-bold text-gray-800 truncate">{inv.invited_email}</p>
                      <button onClick={() => handleCancelInvitation(inv.id)} className="shrink-0 text-rose-600 underline text-sm">
                        取り消す
                      </button>
                    </div>
                    <p className="break-all text-xs text-gray-500 mt-2">{link}</p>
                    <button
                      onClick={() => handleCopy(link)}
                      className="mt-2 text-green-700 underline text-sm"
                    >
                      リンクをコピー
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <p className="text-xs text-gray-600 leading-relaxed text-center max-w-lg mx-auto mb-10 px-2">
          共有されるのは、記帳・農薬肥料記録・農作業日誌のデータです。作成したPDF（/app/documents）は共有されず、各自のものになります。
        </p>
      </main>
    </div>
  );
}
