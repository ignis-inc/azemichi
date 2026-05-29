"use client";

import { useRouter } from "next/navigation";

type DocNavProps = {
  current: string;
};

const NAV_ITEMS = [
  { href: "/", label: "お米を売り始めるときの届出", formal: "米穀の出荷又は販売の事業開始届出書" },
  { href: "/nenkin", label: "農業者年金に加入するときの申込書", formal: "農業者年金通常加入申込書（様式第1号）" },
  { href: "/nouchi", label: "農地を相続・売買したときの届出", formal: "農地法第3条の3第1項の規定による届出書" },
  { href: "/aoiro", label: "青色申告をはじめるときの申請書", formal: "所得税の青色申告承認申請書" },
  { href: "/keiei", label: "経営所得安定対策（補助金）の申請書", formal: "経営所得安定対策等交付金交付申請書（様式第1号A）" },
];

export default function DocNav({ current }: DocNavProps) {
  const router = useRouter();
  const currentIndex = NAV_ITEMS.findIndex((item) => item.href === current);
  const currentItem = NAV_ITEMS[currentIndex];

  const goPrev = () => {
    if (currentIndex > 0) router.push(NAV_ITEMS[currentIndex - 1].href);
  };

  const goNext = () => {
    if (currentIndex < NAV_ITEMS.length - 1) router.push(NAV_ITEMS[currentIndex + 1].href);
  };

  return (
    <nav className="max-w-2xl mx-auto px-4 pt-6">
      <div className="flex items-center gap-3">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-xl border-2 border-green-300 bg-white text-green-700 text-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:not-disabled:bg-green-50 hover:not-disabled:border-green-500 transition-colors"
          aria-label="前の書類"
        >
          ◀
        </button>

        <div className="flex-1 text-center py-2">
          <p className="text-xl font-bold text-green-800 leading-snug">{currentItem.label}</p>
          <p className="text-xs text-gray-400 mt-1">{currentItem.formal}</p>
          <p className="text-sm text-gray-500 mt-1 font-medium">{currentIndex + 1} / {NAV_ITEMS.length}</p>
        </div>

        <button
          onClick={goNext}
          disabled={currentIndex === NAV_ITEMS.length - 1}
          className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-xl border-2 border-green-300 bg-white text-green-700 text-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:not-disabled:bg-green-50 hover:not-disabled:border-green-500 transition-colors"
          aria-label="次の書類"
        >
          ▶
        </button>
      </div>
    </nav>
  );
}
