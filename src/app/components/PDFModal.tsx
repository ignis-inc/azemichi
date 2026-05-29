"use client";

type ModalButton = {
  label: string;
  href?: string;
  variant: "green" | "outline" | "gray";
  onClick?: () => void;
};

type PDFModalProps = {
  steps: string[];
  note?: string;
  buttons: ModalButton[];
  onClose: () => void;
};

export default function PDFModal({ steps, note, buttons, onClose }: PDFModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* タイトル */}
        <h2 className="text-xl font-bold text-gray-900 mb-5 text-center">
          ✅ PDFが作成されました
        </h2>

        {/* 次のステップ */}
        <p className="text-base font-bold text-green-800 mb-3">次のステップ</p>
        <ol className="space-y-3 mb-4">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="shrink-0 w-7 h-7 rounded-full bg-green-600 text-white text-base font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-base text-gray-800 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        {/* 注記 */}
        {note && (
          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3 mb-5 leading-relaxed">
            {note}
          </p>
        )}

        {/* ボタン群 */}
        <div className="space-y-3 mt-5">
          {buttons.map((btn, i) => {
            const baseClass = "w-full text-center text-lg font-bold py-4 px-4 rounded-xl transition-colors block";
            const variantClass =
              btn.variant === "green"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : btn.variant === "outline"
                ? "border-2 border-green-600 text-green-700 hover:bg-green-50 bg-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600";

            if (btn.href) {
              return (
                <a key={i} href={btn.href} target="_blank" rel="noopener noreferrer"
                  className={`${baseClass} ${variantClass}`}>
                  {btn.label}
                </a>
              );
            }
            return (
              <button key={i} onClick={btn.onClick ?? onClose}
                className={`${baseClass} ${variantClass}`}>
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
