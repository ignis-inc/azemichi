// 「これまで作った書類」の記録と期限計算。/dashboard と、PDFを生成する各ツールから共有で使う。
// この端末のブラウザ（localStorage）だけに保存し、サーバーには送信しない。

const STORAGE_KEY = "azemichi-dashboard-v1";

export type DocType = "kaigyo" | "aoiro" | "senjusha" | "nouchi" | "kome" | "keiei" | "nenkin";

export type GeneratedDoc = {
  id: string;
  docType: DocType;
  generatedAt: string; // PDFを作成した日（YYYY-MM-DD）
  anchorDate?: string; // 期限計算の起点日（開業日・権利取得日など。無い書類もある）
};

export const DOC_META: Record<DocType, { title: string; path: string }> = {
  kaigyo: { title: "個人事業の開業届出書", path: "/kaigyo" },
  aoiro: { title: "所得税の青色申告承認申請書", path: "/aoiro" },
  senjusha: { title: "青色事業専従者給与に関する届出書", path: "/senjusha" },
  nouchi: { title: "農地法第3条の3の届出書", path: "/nouchi" },
  kome: { title: "米穀の出荷又は販売の事業開始届出書", path: "/tool" },
  keiei: { title: "経営所得安定対策等交付金交付申請書", path: "/keiei" },
  nenkin: { title: "農業者年金通常加入申込書", path: "/nenkin" },
};

function todayISO(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

export function loadGeneratedDocs(): GeneratedDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGeneratedDocs(docs: GeneratedDoc[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch {
    // 容量超過等は静かに無視する（PDF作成そのものは既に成功しているため、記録の失敗で操作は妨げない）
  }
}

// PDF生成が成功した直後に呼ぶ。anchorDate は期限計算に使う起点日（開業日など）。無い書類は省略する。
export function recordGeneratedDoc(docType: DocType, anchorDate?: string): void {
  const docs = loadGeneratedDocs();
  docs.push({
    id: crypto.randomUUID(),
    docType,
    generatedAt: todayISO(),
    anchorDate,
  });
  saveGeneratedDocs(docs);
}

// 月を加算し、対応する日が無い月は月末に丸める（例：1/31の1か月後→2/28）
function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const totalMonths = (m - 1) + months;
  const targetYear = y + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12; // 0-indexed
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  const day = Math.min(d, lastDay);
  const dt = new Date(targetYear, targetMonth, day);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function dateStatus(dueDate: string): "ok" | "soon" | "overdue" {
  const today = todayISO();
  if (dueDate < today) return "overdue";
  const diffMs = new Date(dueDate).getTime() - new Date(today).getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  return diffDays <= 14 ? "soon" : "ok";
}

export type DeadlineInfo = {
  // date: 具体的な期限日を計算する／fixed-annual: 例年同じ時期だが年により変わる／none: 期限なし
  kind: "date" | "fixed-annual" | "none";
  dueDate: string | null; // YYYY-MM-DD（kind==="date"かつ起点日がある場合のみ）
  label: string;
  note?: string;
  approx?: boolean; // 「概ね」のようにおおよその期限であることを示す
  status: "ok" | "soon" | "overdue" | "n/a";
};

// /aoiro・/senjushaに共通する「1/16以降の開業なら起点日から2か月以内、それ以外はその年の3月15日まで」を計算する。
// このツールが主に新規就農者向けであるため、起点日は「今回の開業（または専従者採用）」を表す前提で計算する。
function computeMarch15OrTwoMonths(anchorDate: string): { dueDate: string; label: string } {
  const [y, m, d] = anchorDate.split("-").map(Number);
  const isFromJan16Onward = !(m === 1 && d <= 15);
  if (isFromJan16Onward) {
    return { dueDate: addMonths(anchorDate, 2), label: "起点日から2か月以内" };
  }
  return { dueDate: `${y}-03-15`, label: `${y}年3月15日まで` };
}

export function computeDeadline(doc: GeneratedDoc): DeadlineInfo {
  switch (doc.docType) {
    case "kaigyo": {
      if (!doc.anchorDate) {
        return { kind: "date", dueDate: null, label: "開業日から1か月以内", status: "n/a" };
      }
      const dueDate = addMonths(doc.anchorDate, 1);
      return { kind: "date", dueDate, label: "開業日から1か月以内", status: dateStatus(dueDate) };
    }
    case "aoiro":
    case "senjusha": {
      if (!doc.anchorDate) {
        return { kind: "date", dueDate: null, label: "起点日が未記録のため期限を計算できません", status: "n/a" };
      }
      const { dueDate, label } = computeMarch15OrTwoMonths(doc.anchorDate);
      return { kind: "date", dueDate, label, status: dateStatus(dueDate) };
    }
    case "nouchi": {
      if (!doc.anchorDate) {
        return { kind: "date", dueDate: null, label: "権利取得日から概ね10か月以内", status: "n/a", approx: true };
      }
      const dueDate = addMonths(doc.anchorDate, 10);
      return { kind: "date", dueDate, label: "権利取得日から概ね10か月以内", status: dateStatus(dueDate), approx: true };
    }
    case "kome": {
      if (!doc.anchorDate) {
        return { kind: "date", dueDate: null, label: "事業開始前にご提出ください", status: "n/a" };
      }
      return {
        kind: "date",
        dueDate: doc.anchorDate,
        label: "事業開始前にご提出ください（事業開始予定日が期限の目安です）",
        status: dateStatus(doc.anchorDate),
      };
    }
    case "keiei": {
      return {
        kind: "fixed-annual",
        dueDate: null,
        label: "例年6月30日ごろ",
        note: "年によって変更される可能性があるため、最新の期限は農政局のサイトでご確認ください。",
        status: "n/a",
      };
    }
    case "nenkin": {
      return { kind: "none", dueDate: null, label: "期限なし", status: "n/a" };
    }
  }
}

// 今日から dueDate までの日数（マイナスなら超過日数）
export function daysUntil(dueDate: string): number {
  const diffMs = new Date(dueDate).getTime() - new Date(todayISO()).getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

export function formatDateJP(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}
