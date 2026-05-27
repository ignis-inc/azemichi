import Link from "next/link";

type DocNavProps = {
  current: string;
};

const NAV_ITEMS = [
  { href: "/", label: "米穀販売届出書" },
  { href: "/nenkin", label: "農業者年金申込書" },
  { href: "/nouchi", label: "農地法届出書" },
  { href: "/aoiro", label: "青色申告申請書" },
];

export default function DocNav({ current }: DocNavProps) {
  return (
    <nav className="max-w-2xl mx-auto px-4 pt-6">
      <div className="grid grid-cols-2 gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === current;
          if (isActive) {
            return (
              <div
                key={item.href}
                className="text-center py-3 px-4 rounded-xl border-2 border-green-600 bg-green-600 text-white font-bold text-sm sm:text-base"
              >
                {item.label} ✓
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className="text-center py-3 px-4 rounded-xl border-2 border-green-200 bg-white text-green-700 font-medium text-sm sm:text-base hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
