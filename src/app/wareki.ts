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

export function isValidWarekiDate(era: string, year: number, month: number, day: number): boolean {
  const base = ERA_BASE[era];
  // 判定材料が揃わないものはここでは弾かない（未入力の扱いは呼び出し側の責務）
  if (!base || !year || !month || !day) return true;
  const y = base + year;
  const dt = new Date(y, month - 1, day);
  // 2月31日→3月3日のように繰り上がったら実在しない日付
  return dt.getFullYear() === y && dt.getMonth() === month - 1 && dt.getDate() === day;
}
