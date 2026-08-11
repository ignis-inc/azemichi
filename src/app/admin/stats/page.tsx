"use client";

import { useEffect, useMemo, useState } from "react";
import { DOC_META, type DocType } from "../../dashboardStore";
import { BarChart } from "../../components/BarChart";
import { setNoTrack } from "../../lib/analytics";

type EventType = "page_view" | "pdf_create" | "record_save";

type TotalRow = { event_type: EventType; key: string; count: number };
type DailyRow = { event_type: EventType; key: string; day: string; count: number };
type MonthlyRow = { event_type: EventType; key: string; month: string; count: number };

type StatsData = { totals: TotalRow[]; daily: DailyRow[]; monthly: MonthlyRow[] };

const SESSION_KEY = "azemichi-admin-stats-password";

const EVENT_TABS: { type: EventType; label: string }[] = [
  { type: "page_view", label: "ページ閲覧" },
  { type: "pdf_create", label: "書類作成" },
  { type: "record_save", label: "記録保存" },
];

const RECORD_TOOL_LABELS: Record<string, string> = {
  kicho: "記帳",
  boujo: "農薬・肥料記録",
  nisshi: "農作業日誌",
};

// event_type・keyの組み合わせを、画面に出す日本語ラベルに変換する
function labelFor(eventType: EventType, key: string): string {
  if (eventType === "pdf_create") {
    return DOC_META[key as DocType]?.title ?? key;
  }
  if (eventType === "record_save") {
    return RECORD_TOOL_LABELS[key] ?? key;
  }
  return key || "/"; // page_view はパスそのまま
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
  const [activeType, setActiveType] = useState<EventType>("page_view");
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
    return data.totals
      .filter((t) => t.event_type === activeType)
      .map((t) => ({ ...t, label: labelFor(t.event_type, t.key) }))
      .sort((a, b) => b.count - a.count);
  }, [data, activeType]);

  const dailyPoints = useMemo(() => {
    if (!data) return [];
    const days = lastNDaysISO(30);
    const rows = data.daily.filter(
      (d) => d.event_type === activeType && (selectedKey === "__all__" || d.key === selectedKey),
    );
    const byDay = new Map<string, number>();
    for (const r of rows) {
      byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.count);
    }
    return days.map((day) => ({ label: day, value: byDay.get(day) ?? 0 }));
  }, [data, activeType, selectedKey]);

  const monthlyPoints = useMemo(() => {
    if (!data) return [];
    const months = lastNMonths(12);
    const rows = data.monthly.filter(
      (m) => m.event_type === activeType && (selectedKey === "__all__" || m.key === selectedKey),
    );
    const byMonth = new Map<string, number>();
    for (const r of rows) {
      const ym = r.month.slice(0, 7);
      byMonth.set(ym, (byMonth.get(ym) ?? 0) + r.count);
    }
    return months.map((ym) => ({ label: ym, value: byMonth.get(ym) ?? 0 }));
  }, [data, activeType, selectedKey]);

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
              key={t.type}
              type="button"
              onClick={() => {
                setActiveType(t.type);
                setSelectedKey("__all__");
              }}
              className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors ${
                activeType === t.type
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
                    <td className="py-2 text-gray-800">{t.label}</td>
                    <td className="py-2 text-right font-bold text-gray-800">{t.count.toLocaleString()}</td>
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
          <h2 className="text-lg font-bold text-gray-800 mb-3">日別（直近30日）</h2>
          {dailyPoints.some((p) => p.value > 0) ? (
            <BarChart
              points={dailyPoints}
              formatTitle={(label, value) => `${label}：${value}件`}
            />
          ) : (
            <p className="text-gray-500 text-sm">データがありません。</p>
          )}
        </div>

        {/* 月別グラフ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-3">月別（直近12か月）</h2>
          {monthlyPoints.some((p) => p.value > 0) ? (
            <BarChart
              points={monthlyPoints}
              formatTitle={(label, value) => `${label}：${value}件`}
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
