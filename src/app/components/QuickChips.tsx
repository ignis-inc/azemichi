"use client";

// よく使う候補をワンタップで入力するためのボタン列（スマホで手打ちを減らす）。
// 下の自由入力欄と併用でき、タップすると入力欄にその値が入る。今の値と一致する候補は強調表示する。
// options が空のときは何も表示しない（履歴がまだ無いときにすき間を作らない）。
export function QuickChips({
  options,
  value,
  onPick,
}: {
  options: string[];
  value: string;
  onPick: (v: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onPick(o)}
          className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${
            value === o
              ? "border-green-500 bg-green-100 text-green-800 font-bold"
              : "border-green-200 bg-white text-gray-600 hover:border-green-400"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
