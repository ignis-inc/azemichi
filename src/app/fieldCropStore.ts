// /boujo・/nisshi で共有する「圃場名・作物名」の候補リスト。
// 入力欄の候補（datalist）だけに使う。各ツールの記録データ本体は今まで通り別々のキーに保存する。
// この端末のブラウザ（localStorage）だけに保存し、サーバーには送信しない。

const STORAGE_KEY = "azemichi-field-crop-v1";
const BOUJO_KEY = "azemichi-boujo-v1";
const NISSHI_KEY = "azemichi-nisshi-v1";

type FieldCropList = {
  fields: string[];
  crops: string[];
};

function readEntries(key: string): Record<string, unknown>[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// 初回アクセス時だけ実行：/boujo・/nisshiそれぞれの既存データから圃場名・作物名を集めて統合する
// （どちらのデータも消さず、両方の値を合わせた一覧にする）
function migrateFromExistingTools(): FieldCropList {
  const fields = new Set<string>();
  const crops = new Set<string>();
  for (const key of [BOUJO_KEY, NISSHI_KEY]) {
    for (const entry of readEntries(key)) {
      const field = typeof entry.field === "string" ? entry.field.trim() : "";
      const crop = typeof entry.crop === "string" ? entry.crop.trim() : "";
      if (field) fields.add(field);
      if (crop) crops.add(crop);
    }
  }
  return { fields: [...fields], crops: [...crops] };
}

function saveList(list: FieldCropList) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // 容量超過等は静かに無視する（候補が増えないだけで、記録自体は妨げない）
  }
}

function loadList(): FieldCropList {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.fields) && Array.isArray(parsed.crops)) {
        return { fields: parsed.fields, crops: parsed.crops };
      }
    }
  } catch {
    // 壊れている場合は下の移行処理でつくり直す
  }
  const migrated = migrateFromExistingTools();
  saveList(migrated);
  return migrated;
}

export function loadFieldOptions(): string[] {
  return [...loadList().fields].sort((a, b) => a.localeCompare(b, "ja"));
}

export function loadCropOptions(): string[] {
  return [...loadList().crops].sort((a, b) => a.localeCompare(b, "ja"));
}

// 記録の追加・CSV読み込みのたびに呼び、新しい圃場名・作物名があれば候補リストに加える
export function registerFieldCrop(field: string, crop: string): void {
  const list = loadList();
  const fields = new Set(list.fields);
  const crops = new Set(list.crops);
  let changed = false;
  const f = field.trim();
  const c = crop.trim();
  if (f && !fields.has(f)) { fields.add(f); changed = true; }
  if (c && !crops.has(c)) { crops.add(c); changed = true; }
  if (changed) saveList({ fields: [...fields], crops: [...crops] });
}
