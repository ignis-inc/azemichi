// PDF生成APIの受信データ検証（サーバー側の防御）。
// - 項目ごとの型と長さ上限をチェックし、超過・型違い・必須欠落は 400 で返す
// - ルールに無いキーは捨てる（ホワイトリスト方式）
// - エラーメッセージに入力値そのものは含めない（プライバシー維持）

export type FieldRule = {
  label: string;
  // 省略時は "string"
  type?: "string" | "strings" | "number" | "boolean" | "objects";
  required?: boolean;
  // string: 最大文字数 / strings・objects: 各要素の最大文字数（stringsのみ）
  max?: number;
  // strings・objects: 最大件数
  maxItems?: number;
  // number: 許容範囲
  min?: number;
  maxNum?: number;
  // objects: 配列の各要素が満たすべきサブスキーマ（例：専従者1人分の項目群）
  fields?: Record<string, FieldRule>;
};

export type ValidationResult =
  // 検証済みデータ。既存ルートが form.xxx 形式で参照するため any 値のレコードで返す
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { ok: true; form: Record<string, any> }
  | { ok: false; error: string };

export function validateForm(raw: unknown, rules: Record<string, FieldRule>): ValidationResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "送信データの形式が正しくありません" };
  }
  const src = raw as Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form: Record<string, any> = {};

  for (const [key, rule] of Object.entries(rules)) {
    const { label } = rule;
    const type = rule.type ?? "string";
    const v = src[key];

    // 未送信・null は空として扱う（画面側は常に全キーを送るため通常は通らない）
    if (v === undefined || v === null) {
      if (rule.required) return { ok: false, error: `「${label}」を入力してください` };
      form[key] = type === "strings" || type === "objects" ? [] : type === "boolean" ? false : type === "number" ? undefined : "";
      continue;
    }

    if (type === "string") {
      if (typeof v !== "string") return { ok: false, error: `「${label}」の形式が正しくありません` };
      if (rule.required && !v.trim()) return { ok: false, error: `「${label}」を入力してください` };
      const max = rule.max ?? 100;
      if (v.length > max) return { ok: false, error: `「${label}」が長すぎます（${max}文字以内で入力してください）` };
      form[key] = v;
    } else if (type === "strings") {
      if (!Array.isArray(v)) return { ok: false, error: `「${label}」の形式が正しくありません` };
      if (v.length > (rule.maxItems ?? 20)) return { ok: false, error: `「${label}」の選択数が多すぎます` };
      const max = rule.max ?? 50;
      for (const item of v) {
        if (typeof item !== "string") return { ok: false, error: `「${label}」の形式が正しくありません` };
        if (item.length > max) return { ok: false, error: `「${label}」が長すぎます（各${max}文字以内）` };
      }
      form[key] = v;
    } else if (type === "number") {
      if (typeof v !== "number" || !Number.isFinite(v)) {
        return { ok: false, error: `「${label}」の形式が正しくありません` };
      }
      if ((rule.min !== undefined && v < rule.min) || (rule.maxNum !== undefined && v > rule.maxNum)) {
        return { ok: false, error: `「${label}」の値が範囲外です` };
      }
      form[key] = v;
    } else if (type === "objects") {
      if (!Array.isArray(v)) return { ok: false, error: `「${label}」の形式が正しくありません` };
      if (v.length > (rule.maxItems ?? 20)) return { ok: false, error: `「${label}」の件数が多すぎます` };
      const subRules = rule.fields ?? {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: Record<string, any>[] = [];
      for (const item of v) {
        if (typeof item !== "object" || item === null || Array.isArray(item)) {
          return { ok: false, error: `「${label}」の形式が正しくありません` };
        }
        const sub = validateForm(item, subRules);
        if (!sub.ok) return { ok: false, error: sub.error };
        items.push(sub.form);
      }
      form[key] = items;
    } else {
      if (typeof v !== "boolean") return { ok: false, error: `「${label}」の形式が正しくありません` };
      form[key] = v;
    }
  }

  return { ok: true, form };
}

// 5書類で共通の基本項目
export const COMMON_RULES: Record<string, FieldRule> = {
  name: { label: "氏名", required: true, max: 50 },
  nameKana: { label: "ふりがな", max: 50 },
  prefecture: { label: "都道府県", required: true, max: 10 },
  cityAddress: { label: "市区町村・番地", required: true, max: 100 },
  phone: { label: "電話番号", max: 20 },
};

// 和暦日付（年号・年・月・日のセレクト値）
export function warekiRules(prefix: string, label: string): Record<string, FieldRule> {
  return {
    [`${prefix}Era`]: { label: `${label}（年号）`, max: 5 },
    [`${prefix}Year`]: { label: `${label}（年）`, max: 4 },
    [`${prefix}Month`]: { label: `${label}（月）`, max: 4 },
    [`${prefix}Day`]: { label: `${label}（日）`, max: 4 },
  };
}
