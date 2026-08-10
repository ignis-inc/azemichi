import { getSupabaseBrowser } from "./supabaseBrowser";

// ログイン版の3ツール（/app/kicho・/app/boujo・/app/nisshi）のクラウド保存を扱う共通モジュール。
// テーブルは kicho_entries / boujo_entries / nisshi_entries。
// 各行は { id: 記録のid(uuid), user_id: 持ち主, data: 記録の中身そのもの(jsonb), created_at }。
// RLSにより、ログイン中の本人の行だけを読み書きできる（他人のデータは見えない・触れない）。

export type ToolName = "kicho" | "boujo" | "nisshi";

const TABLE: Record<ToolName, string> = {
  kicho: "kicho_entries",
  boujo: "boujo_entries",
  nisshi: "nisshi_entries",
};

// 記録は必ず文字列の id を持つ（無料版と同じく crypto.randomUUID() で作られる）
type WithId = { id: string };

export type CloudStore<T extends WithId> = {
  load: () => Promise<T[]>;
  add: (entry: T) => Promise<void>;
  remove: (id: string) => Promise<void>;
  replaceAll: (entries: T[]) => Promise<void>;
};

export function createCloudStore<T extends WithId>(tool: ToolName): CloudStore<T> {
  const table = TABLE[tool];
  const supabase = getSupabaseBrowser();

  return {
    // 自分の記録を古い順に読み込む（画面側で日付順に並べ替えるので、ここでは作成順でよい）
    async load() {
      const { data, error } = await supabase
        .from(table)
        .select("data")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => (row as { data: T }).data);
    },

    // 記録を1件追加する
    async add(entry) {
      const { error } = await supabase.from(table).insert({ id: entry.id, data: entry });
      if (error) throw error;
    },

    // 記録を1件削除する（自分の行だけRLSで対象になる）
    async remove(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },

    // 全件を入れ替える（CSV読み込み用）。「自分が入れた記録」だけを消してから入れ直す。
    // 世帯共有では他のメンバーの記録も同じテーブルにあるため、user_idで自分の分に限定し、
    // CSV読み込みで家族全員のデータを消してしまわないようにする。
    async replaceAll(entries) {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      const del = supabase.from(table).delete();
      // 自分のuser_idの行だけを削除（uidが取れない場合のみ、従来通り自分が触れる全行）
      const { error: delError } = uid ? await del.eq("user_id", uid) : await del.not("id", "is", null);
      if (delError) throw delError;
      if (entries.length > 0) {
        const rows = entries.map((e) => ({ id: e.id, data: e }));
        const { error: insError } = await supabase.from(table).insert(rows);
        if (insError) throw insError;
      }
    },
  };
}

// 無料版（localStorage）の記録を、クラウドに重複なく取り込む。
// 同じ id が既にあれば無視する（何度押しても重複しない）。
// 返り値：imported=新しく取り込んだ件数、skipped=すでにあってスキップした件数
export async function migrateLocalToCloud<T extends WithId>(
  tool: ToolName,
  localEntries: T[],
): Promise<{ imported: number; skipped: number }> {
  if (localEntries.length === 0) return { imported: 0, skipped: 0 };
  const supabase = getSupabaseBrowser();
  const table = TABLE[tool];
  const rows = localEntries.map((e) => ({ id: e.id, data: e }));
  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true })
    .select("id");
  if (error) throw error;
  const imported = data?.length ?? 0;
  return { imported, skipped: localEntries.length - imported };
}
