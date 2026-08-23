"use client";

import { useEffect, useMemo, useState } from "react";
import { DOC_META, type DocType } from "../../dashboardStore";
import { BarChart } from "../../components/BarChart";
import { setNoTrack } from "../../lib/analytics";

type EventType = "page_view" | "pdf_create" | "record_save" | "record_save_free";

// タブの識別子。"other_page" は本来ページ閲覧の一部だが、「その他」タブとして分けて表示する。
type TabId = EventType | "other_page";

type TotalRow = { event_type: EventType; key: string; count: number };
type DailyRow = { event_type: EventType; key: string; day: string; count: number };
type MonthlyRow = { event_type: EventType; key: string; month: string; count: number };

type StatsData = { totals: TotalRow[]; daily: DailyRow[]; monthly: MonthlyRow[] };

const SESSION_KEY = "azemichi-admin-stats-password";

const EVENT_TABS: { id: TabId; label: string }[] = [
  { id: "page_view", label: "ページ閲覧" },
  { id: "pdf_create", label: "書類作成" },
  { id: "record_save", label: "記録保存（ログイン版）" },
  { id: "record_save_free", label: "記録保存（無料版）" },
  { id: "other_page", label: "その他" },
];

const RECORD_TOOL_LABELS: Record<string, string> = {
  kicho: "記帳",
  boujo: "農薬・肥料記録",
  nisshi: "農作業日誌",
};

// ページ閲覧（page_view）のkeyはURLのパス。運営者が分かるよう日本語のページ名に変換する。
const PAGE_LABELS: Record<string, string> = {
  "/": "トップページ",
  "/tool": "ツール一覧",
  "/kiroku": "記録メニュー",
  "/yougo": "用語集",
  "/privacy": "プライバシーポリシー",
  "/chokkura": "ちょっくら紹介",
  // 書類作成ツール
  "/kome": "米の販売届出",
  "/aoiro": "青色申告承認申請",
  "/kaigyo": "開業届",
  "/kaigyo-set": "開業まとめて作成",
  "/senjusha": "専従者給与の届出",
  "/kyuyo-jimusho": "給与支払事務所の届出",
  "/gennsen-tokurei": "源泉所得税の納期特例",
  "/nouchi": "農地法の届出",
  "/nenkin": "農業者年金の申込",
  "/keiei": "経営所得安定対策の申請",
  // 記録ツール（無料版）
  "/kicho": "記帳（無料版）",
  "/boujo": "農薬・肥料記録（無料版）",
  "/nisshi": "農作業日誌（無料版）",
  "/dashboard": "ダッシュボード（無料版）",
  // ログイン版
  "/app/kicho": "記帳（ログイン版）",
  "/app/boujo": "農薬・肥料記録（ログイン版）",
  "/app/nisshi": "農作業日誌（ログイン版）",
  "/app/dashboard": "ダッシュボード（ログイン版）",
  "/app/documents": "保存した書類（ログイン版）",
  "/app/settings": "共有設定（ログイン版）",
  // 認証まわり
  "/login": "ログイン画面",
  "/invite": "招待の承認画面",
  "/reset-password": "パスワード再設定画面",
};

// ページ閲覧の一覧を、種類ごとにまとめて並べるためのグループ番号（小さいほど上）。
//   0: 書類作成ツール ／ 1: 記録ツール（ログイン版）／ 2: 記録ツール（無料版）／ 3: その他
const DOC_PAGES = new Set([
  "/kome", "/aoiro", "/kaigyo", "/kaigyo-set", "/senjusha",
  "/kyuyo-jimusho", "/gennsen-tokurei", "/nouchi", "/nenkin", "/keiei",
]);
const FREE_RECORD_PAGES = new Set(["/kicho", "/boujo", "/nisshi", "/dashboard"]);

// ページ閲覧の一覧で、閲覧が0でも常に表示するページ（書類作成ツール・記録ツールは全部並べる）。
// これで「まだ誰にも見られていない書類・ツール」も0件として一覧に出て、全体を把握できる。
const ALWAYS_SHOWN_PAGES: string[] = [
  ...DOC_PAGES, // 書類作成ツール
  "/kicho", "/boujo", "/nisshi", "/dashboard", // 記録ツール（無料版）
  "/app/kicho", "/app/boujo", "/app/nisshi", "/app/dashboard", // 記録ツール（ログイン版）
];

// 各タブで、件数0でも常に一覧に出す対象。
//   書類作成（pdf_create）… 全書類の種類 ／ 記録保存（record_save）… 全記録ツール
const ALWAYS_SHOWN_BY_TYPE: Record<EventType, string[]> = {
  page_view: ALWAYS_SHOWN_PAGES,
  pdf_create: Object.keys(DOC_META),
  record_save: Object.keys(RECORD_TOOL_LABELS),
  record_save_free: Object.keys(RECORD_TOOL_LABELS),
};

function pageCategoryRank(key: string): number {
  if (DOC_PAGES.has(key)) return 0;
  if (key.startsWith("/app/")) return 1; // ログイン版
  if (FREE_RECORD_PAGES.has(key)) return 2; // 無料版の記録ツール
  return 3; // トップ・ログイン画面など その他
}

// 「その他」タブで、閲覧0でも常に出すページ（トップ・案内・認証まわり）。
const OTHER_PAGES: string[] = [
  "/", "/tool", "/kiroku", "/yougo", "/privacy", "/chokkura",
  "/login", "/invite", "/reset-password",
];

// タブ→実際のイベント種別（「その他」はページ閲覧の一部）
function tabEventType(tab: TabId): EventType {
  return tab === "other_page" ? "page_view" : tab;
}

// このkeyが、選んだタブに含まれるか。
// ページ閲覧タブは「その他」を除いたツール系ページ、その他タブは「その他」ページだけを表示する（重複させない）。
function keyInTab(tab: TabId, key: string): boolean {
  if (tab === "page_view") return pageCategoryRank(key) !== 3;
  if (tab === "other_page") return pageCategoryRank(key) === 3;
  return true; // 書類作成・記録保存はそのまま
}

// そのタブで、件数0でも常に一覧に出す対象。
function alwaysShownForTab(tab: TabId): string[] {
  if (tab === "other_page") return OTHER_PAGES;
  return ALWAYS_SHOWN_BY_TYPE[tab];
}

// グラフの日付・月ラベル用の小さな変換
function toMD(iso: string): string {
  // "2026-08-11" → "8/11"
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}
function toJaDate(iso: string): string {
  // "2026-08-11" → "2026年8月11日"
  const [y, m, d] = iso.split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}
function toMonthTick(ym: string): string {
  // "2026-08" → "8月"
  return `${Number(ym.split("-")[1])}月`;
}
function toJaMonth(ym: string): string {
  // "2026-08" → "2026年8月"
  const [y, m] = ym.split("-");
  return `${y}年${Number(m)}月`;
}

// event_type・keyの組み合わせを、画面に出す日本語ラベルに変換する
function labelFor(eventType: EventType, key: string): string {
  if (eventType === "pdf_create") {
    return DOC_META[key as DocType]?.title ?? key;
  }
  if (eventType === "record_save" || eventType === "record_save_free") {
    return RECORD_TOOL_LABELS[key] ?? key;
  }
  return PAGE_LABELS[key] ?? (key || "/"); // page_view は日本語ページ名（無ければパスそのまま）
}

function lastNDaysISO(n: number): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function lastNMonths(n: number): string[] {
  const months: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export default function AdminStatsPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StatsData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("page_view");
  const [selectedKey, setSelectedKey] = useState<string>("__all__");
  // 管理画面にログインした端末は、集計から除外する（B・自分のアクセスを数えない）
  const [excluded, setExcluded] = useState(false);

  async function fetchStats(pw: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAuthorized(false);
        setError(json.error || "取得に失敗しました。");
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }
      setData(json);
      setAuthorized(true);
      sessionStorage.setItem(SESSION_KEY, pw);
      // 管理画面に入れた（＝運営者の）端末は、自分のアクセスを数えないよう除外する
      setNoTrack(true);
      setExcluded(true);
    } catch {
      setError("通信に失敗しました。時間をおいてもう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  // 前回入力したパスワードが残っていれば、自動で読み込む
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      // 効果内での同期的なsetStateを避けるため、マイクロタスクにずらして呼び出す
      void Promise.resolve().then(() => fetchStats(saved));
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchStats(password);
  }

  function handleLock() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthorized(false);
    setData(null);
    setPassword("");
  }

  const totalsForType = useMemo(() => {
    if (!data) return [];
    // 各タブの対象を、実データ＋「件数0でも常に出す対象」を重複なくまとめる。
    // 無いものは0件として補い、まだ使われていない書類・ツールも一覧に出す（全体を把握するため）。
    const et = tabEventType(activeTab);
    const counts = new Map<string, number>();
    for (const t of data.totals) {
      if (t.event_type === et && keyInTab(activeTab, t.key)) counts.set(t.key, t.count);
    }
    const keys = new Set<string>([...alwaysShownForTab(activeTab), ...counts.keys()]);
    const merged = [...keys].map((key) => ({
      event_type: et,
      key,
      count: counts.get(key) ?? 0,
      label: labelFor(et, key),
    }));
    if (activeTab === "page_view") {
      // 「書類作成→ログイン版→無料版」のグループ順、各グループ内は多い順（同数はページ名順）
      return merged.sort(
        (a, b) =>
          pageCategoryRank(a.key) - pageCategoryRank(b.key) ||
          b.count - a.count ||
          a.label.localeCompare(b.label, "ja"),
      );
    }
    // 書類作成・記録保存・その他は多い順（同数は名前順）
    return merged.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"));
  }, [data, activeTab]);

  const dailyPoints = useMemo(() => {
    if (!data) return [];
    const et = tabEventType(activeTab);
    const days = lastNDaysISO(30);
    const rows = data.daily.filter(
      (d) =>
        d.event_type === et &&
        keyInTab(activeTab, d.key) &&
        (selectedKey === "__all__" || d.key === selectedKey),
    );
    const byDay = new Map<string, number>();
    for (const r of rows) {
      byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.count);
    }
    return days.map((day) => ({ label: day, value: byDay.get(day) ?? 0 }));
  }, [data, activeTab, selectedKey]);

  const monthlyPoints = useMemo(() => {
    if (!data) return [];
    const et = tabEventType(activeTab);
    const months = lastNMonths(12);
    const rows = data.monthly.filter(
      (m) =>
        m.event_type === et &&
        keyInTab(activeTab, m.key) &&
        (selectedKey === "__all__" || m.key === selectedKey),
    );
    const byMonth = new Map<string, number>();
    for (const r of rows) {
      const ym = r.month.slice(0, 7);
      byMonth.set(ym, (byMonth.get(ym) ?? 0) + r.count);
    }
    return months.map((ym) => ({ label: ym, value: byMonth.get(ym) ?? 0 }));
  }, [data, activeTab, selectedKey]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4"
        >
          <h1 className="text-xl font-bold text-gray-800">管理画面ログイン</h1>
          <p className="text-sm text-gray-500">利用状況の集計を見るには、管理パスワードを入力してください。</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            autoFocus
            className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-lg focus:border-gray-500 focus:outline-none"
          />
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? "確認中…" : "開く"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">利用状況（あぜみち）</h1>
          <button
            type="button"
            onClick={handleLock}
            className="text-sm text-gray-500 underline underline-offset-4 hover:text-gray-700"
          >
            ロックする
          </button>
        </div>

        {/* この端末の集計除外の状態と切り替え */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-sm">
          <span className="text-gray-600">
            {excluded
              ? "この端末（ブラウザ）のアクセスは集計に数えていません。"
              : "この端末のアクセスは集計に数えられます。"}
          </span>
          <button
            type="button"
            onClick={() => {
              const next = !excluded;
              setNoTrack(next);
              setExcluded(next);
            }}
            className="shrink-0 rounded-lg border-2 border-gray-300 px-3 py-1.5 font-bold text-gray-700 hover:border-gray-500 transition-colors"
          >
            {excluded ? "この端末を集計に含める" : "この端末を除外する"}
          </button>
        </div>

        {/* イベント種別タブ */}
        <div className="flex gap-2 flex-wrap">
          {EVENT_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTab(t.id);
                setSelectedKey("__all__");
              }}
              className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors ${
                activeTab === t.id
                  ? "bg-gray-800 border-gray-800 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 合計表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-3">合計</h2>
          {totalsForType.length === 0 ? (
            <p className="text-gray-500 text-sm">まだ記録がありません。</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 font-normal">対象</th>
                  <th className="py-2 font-normal text-right">合計</th>
                </tr>
              </thead>
              <tbody>
                {totalsForType.map((t) => (
                  <tr key={t.key} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 text-gray-800">
                      {t.label}
                      {t.label !== t.key && (
                        <span className="block text-xs text-gray-400">{t.key}</span>
                      )}
                    </td>
                    <td className="py-2 text-right font-bold text-gray-800 align-top">{t.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 絞り込み */}
        {totalsForType.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="key-filter" className="text-sm text-gray-600">
              グラフの対象：
            </label>
            <select
              id="key-filter"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="rounded-lg border-2 border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value="__all__">すべて合計</option>
              {totalsForType.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 日別グラフ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-gray-800">日別（直近30日）</h2>
            {dailyPoints.length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                {toJaDate(dailyPoints[0].label)} 〜 {toJaDate(dailyPoints[dailyPoints.length - 1].label)}（左が古い日→右が最新）
              </p>
            )}
          </div>
          {dailyPoints.some((p) => p.value > 0) ? (
            <BarChart
              points={dailyPoints}
              formatTitle={(label, value) => `${toJaDate(label)}：${value}件`}
              axisLabelFor={(p) => toMD(p.label)}
              barWidth={24}
              scrollToEnd
            />
          ) : (
            <p className="text-gray-500 text-sm">データがありません。</p>
          )}
        </div>

        {/* 月別グラフ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-gray-800">月別（直近12か月）</h2>
            {monthlyPoints.length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                {toJaMonth(monthlyPoints[0].label)} 〜 {toJaMonth(monthlyPoints[monthlyPoints.length - 1].label)}（左が古い月→右が最新）
              </p>
            )}
          </div>
          {monthlyPoints.some((p) => p.value > 0) ? (
            <BarChart
              points={monthlyPoints}
              formatTitle={(label, value) => `${toJaMonth(label)}：${value}件`}
              axisLabelFor={(p) => toMonthTick(p.label)}
              barWidth={28}
              scrollToEnd
            />
          ) : (
            <p className="text-gray-500 text-sm">データがありません。</p>
          )}
        </div>

        <p className="text-xs text-gray-400">
          このページは運営専用です。利用者には表示・案内していません。個人情報やIPアドレスは記録していません。
        </p>
      </div>
    </div>
  );
}
