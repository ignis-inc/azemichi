"use client";

import { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  /** 付加クラス（例 "seg" / "seg amber"）。.reveal と併せて付く */
  className?: string;
};

/**
 * スクロールで現れる演出。IntersectionObserver で可視になったら .in を付ける。
 * prefers-reduced-motion や IO 非対応では最初から表示する（演出なし）。
 */
export default function Reveal({ children, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce || typeof IntersectionObserver === "undefined") {
      // 演出なしで表示する。効果内で同期的に setState せず次フレームで反映する
      // （reduce-motion 時は CSS 側でも最初から表示される）。
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            setShown(true);
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${shown ? "in" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}
