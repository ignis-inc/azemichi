"use client";

// /admin/stats で使っている自作の軽量バーチャートを共通化したもの。
// 外部のグラフライブラリは使わず、ただのdivの高さで棒グラフを表現する。
export type BarChartPoint = {
  label: string;
  value: number;
  // 点ごとに色を変えたいとき（例：差引がプラスなら緑・マイナスなら赤）に指定する
  color?: string;
};

export function BarChart({
  points,
  formatTitle,
  defaultColor = "bg-green-500",
  hoverColor = "hover:bg-green-600",
}: {
  points: BarChartPoint[];
  formatTitle: (label: string, value: number) => string;
  defaultColor?: string;
  hoverColor?: string;
}) {
  const max = Math.max(1, ...points.map((p) => Math.abs(p.value)));
  return (
    <div className="flex items-end gap-[3px] h-40 overflow-x-auto pb-1">
      {points.map((p, i) => (
        <div key={`${p.label}-${i}`} className="flex flex-col items-end justify-end h-full shrink-0" style={{ width: 10 }}>
          <div
            className={`w-full rounded-t transition-colors ${p.color ?? `${defaultColor} ${hoverColor}`}`}
            style={{ height: `${(Math.abs(p.value) / max) * 100}%`, minHeight: p.value !== 0 ? 2 : 0 }}
            title={formatTitle(p.label, p.value)}
          />
        </div>
      ))}
    </div>
  );
}
