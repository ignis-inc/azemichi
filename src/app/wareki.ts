// 和暦の生年月日などが「暦に実在する日付」かを確認する共通ヘルパー。
// 2月31日・4月31日・うるう年でない2月29日などを弾く。
// 元号の期間外（例：令和1年1月）は慣用的な記載として許容する
// （フォームの初期値にも「令和1年1月1日」があり、厳密に弾くと正常な利用を妨げるため）。
const ERA_BASE: Record<string, number> = {
  大正: 1911,
  昭和: 1925,
  平成: 1988,
  令和: 2018,
};

// 西暦の年月日を和暦表記にする。年だけでなく月日も見て、
// 元号の変わり目（例：2019年4月30日まで＝平成31年）を正しく判定する。
export function toWarekiDate(y: number, m: number, d: number): string {
  const t = new Date(y, m - 1, d).getTime();
  let era: string;
  let eraYear: number;
  if (t >= new Date(2019, 4, 1).getTime()) { era = "令和"; eraYear = y - 2018; }
  else if (t >= new Date(1989, 0, 8).getTime()) { era = "平成"; eraYear = y - 1988; }
  else if (t >= new Date(1926, 11, 25).getTime()) { era = "昭和"; eraYear = y - 1925; }
  else { era = "大正"; eraYear = y - 1911; }
  return `${era}${eraYear}年${m}月${d}日`;
}

// 和暦（元号・年・月・日）をISO日付（YYYY-MM-DD）に変換する。
// 判定材料が揃わない・実在しない日付の場合は undefined を返す（呼び出し側で「起点日なし」として扱う）。
export function warekiToISO(era: string, year: number, month: number, day: number): string | undefined {
  const base = ERA_BASE[era];
  if (!base || !year || !month || !day) return undefined;
  if (!isValidWarekiDate(era, year, month, day)) return undefined;
  const y = base + year;
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isValidWarekiDate(era: string, year: number, month: number, day: number): boolean {
  const base = ERA_BASE[era];
  // 判定材料が揃わないものはここでは弾かない（未入力の扱いは呼び出し側の責務）
  if (!base || !year || !month || !day) return true;
  const y = base + year;
  const dt = new Date(y, month - 1, day);
  // 2月31日→3月3日のように繰り上がったら実在しない日付
  return dt.getFullYear() === y && dt.getMonth() === month - 1 && dt.getDate() === day;
}
