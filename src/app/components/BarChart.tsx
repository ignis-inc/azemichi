"use client";

import { useEffect, useRef } from "react";

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
  axisLabelFor,
  barWidth = 10,
  scrollToEnd = false,
}: {
  points: BarChartPoint[];
  formatTitle: (label: string, value: number) => string;
  defaultColor?: string;
  hoverColor?: string;
  // 棒の下に出す目盛り文字（いつの記録か分かるように）。空文字を返すとその棒には出さない（間引き用）。
  axisLabelFor?: (point: BarChartPoint, index: number, total: number) => string;
  // 棒1本の幅（px）。目盛りを全部出すときは広げて文字が重ならないようにする。
  barWidth?: number;
  // 横に収まらないとき、最初から右端（最新）が見えるように自動でスクロールする。
  scrollToEnd?: boolean;
}) {
  const max = Math.max(1, ...points.map((p) => Math.abs(p.value)));
  const showAxis = !!axisLabelFor;
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // 最新の日・月が右端にあるので、開いた時点で右端まで寄せて最新を見せる
    if (scrollToEnd && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [scrollToEnd, points.length]);
  return (
    <div ref={scrollRef} className="overflow-x-auto pb-1">
      <div className="flex items-end gap-[3px] h-40">
        {points.map((p, i) => (
          <div key={`${p.label}-${i}`} className="flex flex-col items-end justify-end h-full shrink-0" style={{ width: barWidth }}>
            <div
              className={`w-full rounded-t transition-colors ${p.color ?? `${defaultColor} ${hoverColor}`}`}
              style={{ height: `${(Math.abs(p.value) / max) * 100}%`, minHeight: p.value !== 0 ? 2 : 0 }}
              title={formatTitle(p.label, p.value)}
            />
          </div>
        ))}
      </div>
      {showAxis && (
        <div className="flex gap-[3px] mt-1">
          {points.map((p, i) => (
            <div
              key={`axis-${p.label}-${i}`}
              className="shrink-0 text-center text-[9px] leading-tight text-gray-400 whitespace-nowrap"
              style={{ width: barWidth }}
            >
              {axisLabelFor!(p, i, points.length)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
