import Link from "next/link";

type DocNavProps = {
  current: string;
};

const NAV_ITEMS = [
  { href: "/", label: "お米を売り始めるときの届出" },
  { href: "/nenkin", label: "農業者年金に加入するときの申込書" },
  { href: "/nouchi", label: "農地を相続・売買したときの届出" },
  { href: "/aoiro", label: "青色申告をはじめるときの申請書" },
  { href: "/keiei", label: "経営所得安定対策（補助金）の申請書" },
];

export default function DocNav({ current }: DocNavProps) {
  return (
    <nav className="max-w-2xl mx-auto px-4 pt-6">
      <div className="grid grid-cols-3 gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === current;
          if (isActive) {
            return (
              <div
                key={item.href}
                className="flex items-center justify-center text-center py-4 px-2 rounded-xl border-2 border-green-600 bg-green-600 text-white font-bold text-base min-h-[64px]"
              >
                {item.label} ✓
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-center text-center py-4 px-2 rounded-xl border-2 border-green-200 bg-white text-green-700 font-medium text-base hover:border-green-400 hover:bg-green-50 transition-colors min-h-[64px]"
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
