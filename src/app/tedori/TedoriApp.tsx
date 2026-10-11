"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadCropOptions } from "../fieldCropStore";
import { QuickChips } from "../components/QuickChips";

// 入力内容はこの端末のブラウザだけに保存する（サーバーには送信しない）
const STORAGE_KEY = "azemichi-tedori-v1";

// 入力欄はすべて文字列のまま持つ（空欄と0を区別し、入力途中の値も保存できるようにする）
type Inputs = {
  crop: string;
  quantity: string;
  shipPrice: string;
  shipRate: string;
  shipCost: string;
  shipHours: string;
  directPrice: string;
  directRate: string;
  directShipping: string;
  directPacking: string;
  directHours: string;
};

const EMPTY: Inputs = {
  crop: "",
  quantity: "",
  shipPrice: "",
  shipRate: "",
  shipCost: "",
  shipHours: "",
  directPrice: "",
  directRate: "",
  directShipping: "",
  directPacking: "",
  directHours: "",
};

// このコンポーネントは next/dynamic({ ssr: false }) 経由でのみ描画される（常にブラウザ環境）
function loadInputs(): Inputs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY;
    const result: Inputs = { ...EMPTY };
    for (const k of Object.keys(EMPTY) as (keyof Inputs)[]) {
      if (typeof parsed[k] === "string") result[k] = parsed[k];
    }
    return result;
  } catch {
    return EMPTY;
  }
}

function saveInputs(inputs: Inputs) {
  try {
    // 全部空欄なら保存内容も残さない（リセット後に空のデータが残らないようにする）
    if (Object.values(inputs).every((v) => v === "")) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    }
  } catch {
    // 容量超過等は静かに無視する（保存されないだけで、計算は妨げない）
  }
}

function formatYen(n: number): string {
  return n.toLocaleString("ja-JP");
}

// マイナスの金額は、内訳の表示とそろえて全角の「－」を付ける
function formatSignedYen(n: number): string {
  return n < 0 ? `－${formatYen(-n)}` : formatYen(n);
}

// 内訳で差し引く金額。0円のときはマイナス記号を付けない
function formatDeduction(n: number): string {
  return n > 0 ? `－${formatYen(n)}` : formatYen(n);
}

// 数値の読み取り結果。value=null は空欄、error があれば入力が正しくない
type Parsed = { value: number | null; error?: string };

// 円単位の金額・数量（0以上の整数）
function parseInteger(v: string, label: string): Parsed {
  if (v.trim() === "") return { value: null };
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return { value: null, error: `${label}を正しく入力してください` };
  if (!Number.isInteger(n)) return { value: null, error: `${label}は整数で入力してください` };
  return { value: n };
}

// 手数料率（%）。小数第2位まで。浮動小数点の誤差を避けるため「%×100」の整数で返す（例：8.5% → 850）
function parseRate(v: string, label: string): Parsed {
  if (v.trim() === "") return { value: null };
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 100) return { value: null, error: `${label}は0〜100の範囲で入力してください` };
  const scaled = Math.round(n * 100);
  if (Math.abs(n * 100 - scaled) > 1e-6) return { value: null, error: `${label}は小数第2位までで入力してください` };
  return { value: scaled };
}

// 作業時間（時間）。0より大きい数（小数可）
function parseHours(v: string, label: string): Parsed {
  if (v.trim() === "") return { value: null };
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return { value: null, error: `${label}は0より大きい数で入力してください` };
  return { value: n };
}

type SideResult = {
  sales: number;
  rate: number; // %×100
  fee: number;
  costs: number;
  net: number;
  perHour: number | null;
};

// 手取り＝売上 −（売上×手数料率、1円未満切り捨て）− 経費
function calcSide(price: number, quantity: number, rate: number, costs: number, hours: number | null): SideResult {
  const sales = price * quantity;
  const fee = Math.floor((sales * rate) / 10000);
  const net = sales - fee - costs;
  // 1円未満切り捨て（マイナスのときも0の方向へ切り捨てる。-0 は 0 にそろえる）
  const perHour = hours === null ? null : Math.trunc(net / hours) || 0;
  return { sales, rate, fee, costs, net, perHour };
}

function formatRate(rate: number): string {
  return String(rate / 100);
}

export default function TedoriApp() {
  const [inputs, setInputs] = useState<Inputs>(loadInputs);
  const [cropOptions] = useState<string[]>(loadCropOptions);

  useEffect(() => {
    saveInputs(inputs);
  }, [inputs]);

  function set<K extends keyof Inputs>(key: K, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function resetInputs() {
    if (!window.confirm("入力した内容をすべて消して、最初の状態に戻します。よろしいですか？")) return;
    setInputs(EMPTY);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 消せなくても画面の入力は空になる
    }
  }

  // 入力の読み取り（未入力の経費は0円、未入力の手数料率は0%として扱う）
  const quantity = parseInteger(inputs.quantity, "数量");
  const shipPrice = parseInteger(inputs.shipPrice, "出荷単価");
  const shipRate = parseRate(inputs.shipRate, "出荷手数料率");
  const shipCost = parseInteger(inputs.shipCost, "出荷経費");
  const shipHours = parseHours(inputs.shipHours, "作業時間");
  const directPrice = parseInteger(inputs.directPrice, "直販単価");
  const directRate = parseRate(inputs.directRate, "販売手数料率");
  const directShipping = parseInteger(inputs.directShipping, "送料");
  const directPacking = parseInteger(inputs.directPacking, "梱包資材費");
  const directHours = parseHours(inputs.directHours, "作業時間");

  const shipReady =
    quantity.value !== null && shipPrice.value !== null &&
    !shipRate.error && !shipCost.error && !shipHours.error;
  const directReady =
    quantity.value !== null && directPrice.value !== null &&
    !directRate.error && !directShipping.error && !directPacking.error && !directHours.error;

  const ship = shipReady
    ? calcSide(shipPrice.value!, quantity.value!, shipRate.value ?? 0, shipCost.value ?? 0, shipHours.value)
    : null;
  const direct = directReady
    ? calcSide(
        directPrice.value!,
        quantity.value!,
        directRate.value ?? 0,
        (directShipping.value ?? 0) + (directPacking.value ?? 0),
        directHours.value,
      )
    : null;

  const inputClass =
    "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 transition-colors";
  const labelClass = "block text-base font-bold text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-6";
  const hintClass = "text-sm text-gray-500 mt-2";

  // 単位つきの入力欄（金額・%・時間）
  function unitInput(
    id: string,
    key: keyof Inputs,
    unit: string,
    parsed: Parsed,
    opts: { step?: string; inputMode?: "numeric" | "decimal"; placeholder?: string } = {},
  ) {
    return (
      <>
        <div className="flex items-center gap-3">
          <input
            id={id}
            type="number"
            min="0"
            step={opts.step ?? "1"}
            inputMode={opts.inputMode ?? "numeric"}
            value={inputs[key]}
            onChange={(e) => set(key, e.target.value)}
            placeholder={opts.placeholder}
            className={`${inputClass} flex-1`}
            aria-invalid={parsed.error ? true : undefined}
            aria-describedby={parsed.error ? `${id}-error` : undefined}
          />
          <span className="text-lg text-gray-600 whitespace-nowrap">{unit}</span>
        </div>
        {parsed.error && (
          <p id={`${id}-error`} className="text-red-600 text-base mt-2">{parsed.error}</p>
        )}
      </>
    );
  }

  // 手取りの表示（マイナスは赤字とわかるように赤色＋「赤字」）
  function netText(n: number) {
    return n < 0 ? (
      <span className="text-rose-600">{formatSignedYen(n)}円（赤字）</span>
    ) : (
      <span className="text-green-800">{formatYen(n)}円</span>
    );
  }

  function resultCard(title: string, r: SideResult | null, costLabel: string, waiting: string) {
    return (
      <div className="rounded-xl border-2 border-green-200 p-4">
        <h3 className="text-lg font-bold text-gray-700 mb-2">{title}</h3>
        {r ? (
          <>
            <p className="text-2xl font-bold">{netText(r.net)}</p>
            <dl className="mt-3 space-y-1 text-base text-gray-600">
              <div className="flex justify-between gap-3"><dt>売上</dt><dd>{formatYen(r.sales)}円</dd></div>
              <div className="flex justify-between gap-3"><dt>手数料（{formatRate(r.rate)}%）</dt><dd>{formatDeduction(r.fee)}円</dd></div>
              <div className="flex justify-between gap-3"><dt>{costLabel}</dt><dd>{formatDeduction(r.costs)}円</dd></div>
              {r.perHour !== null && (
                <div className="flex justify-between gap-3 pt-1 border-t border-green-100">
                  <dt>1時間あたりの手取り</dt>
                  <dd className={r.perHour < 0 ? "text-rose-600 font-bold" : "text-green-800 font-bold"}>
                    {formatSignedYen(r.perHour)}円
                  </dd>
                </div>
              )}
            </dl>
          </>
        ) : (
          <p className="text-base text-gray-500">{waiting}</p>
        )}
      </div>
    );
  }

  let diffText: React.ReactNode = null;
  if (ship && direct) {
    const diff = direct.net - ship.net;
    diffText =
      diff === 0 ? (
        <>どちらも同じ手取りです。</>
      ) : (
        <>
          {diff > 0 ? "直販" : "出荷"}のほうが
          <span className="text-2xl font-bold text-green-800 mx-1">{formatYen(Math.abs(diff))}円</span>
          多く手元に残ります。
        </>
      );
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* ヘッダー */}
      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">出荷と直販の手取り比較</h1>
        <p className="mt-2 text-green-100 text-base">手元に残るお金を比べる（無料・ログイン不要）</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="border-2 border-yellow-300 bg-yellow-50 rounded-xl px-5 py-4">
          <p className="text-base font-bold text-yellow-900 leading-relaxed">
            この計算は概算です。実際の手数料・送料・取引条件によって変わります。税金や社会保険料は含んでいません。
          </p>
        </div>
        <div className="mt-4">
          <Link href="/tool" className="text-base font-bold text-green-700 underline underline-offset-4 hover:text-green-800">
            ← あぜみちの書類作成ツールへ
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 共通の入力 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">作物と数量</h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="tedori-crop">品目名</label>
              <QuickChips options={cropOptions.slice(0, 12)} value={inputs.crop} onPick={(v) => set("crop", v)} />
              <input
                id="tedori-crop"
                type="text"
                list="tedori-crop-list"
                value={inputs.crop}
                onChange={(e) => set("crop", e.target.value)}
                placeholder="例：トマト"
                className={inputClass}
              />
              <datalist id="tedori-crop-list">
                {cropOptions.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className={labelClass} htmlFor="tedori-quantity">数量<span className="req">必須</span></label>
              {unitInput("tedori-quantity", "quantity", "個・kg など", quantity, { placeholder: "例：100" })}
              <p className={hintClass}>単価と同じ単位（1個あたりなら個数、1kgあたりならkg数）で入力してください。</p>
            </div>
          </div>
        </section>

        {/* 出荷側 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">JA・市場に出荷する場合</h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="tedori-ship-price">出荷単価<span className="req">必須</span></label>
              {unitInput("tedori-ship-price", "shipPrice", "円", shipPrice, { placeholder: "例：200" })}
            </div>
            <div>
              <label className={labelClass} htmlFor="tedori-ship-rate">出荷手数料率</label>
              {unitInput("tedori-ship-rate", "shipRate", "%", shipRate, { step: "0.01", inputMode: "decimal", placeholder: "例：8.5" })}
              <p className={hintClass}>ご自身の取引条件の手数料率を入力してください。空欄の場合は0%として計算します。</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="tedori-ship-cost">出荷経費の合計</label>
              {unitInput("tedori-ship-cost", "shipCost", "円", shipCost, { placeholder: "例：3000" })}
              <p className={hintClass}>箱代・運賃など。空欄の場合は0円として計算します。</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="tedori-ship-hours">作業時間（任意）</label>
              {unitInput("tedori-ship-hours", "shipHours", "時間", shipHours, { step: "0.1", inputMode: "decimal", placeholder: "例：2" })}
              <p className={hintClass}>入力すると、1時間あたりの手取りも表示します。</p>
            </div>
          </div>
        </section>

        {/* 直販側 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">自分で直販する場合</h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="tedori-direct-price">直販単価<span className="req">必須</span></label>
              {unitInput("tedori-direct-price", "directPrice", "円", directPrice, { placeholder: "例：300" })}
            </div>
            <div>
              <label className={labelClass} htmlFor="tedori-direct-rate">販売手数料率</label>
              {unitInput("tedori-direct-rate", "directRate", "%", directRate, { step: "0.01", inputMode: "decimal", placeholder: "例：10" })}
              <p className={hintClass}>ご自身の取引条件の手数料率を入力してください。空欄の場合は0%として計算します。</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="tedori-direct-shipping">送料の合計（農家負担分）</label>
              {unitInput("tedori-direct-shipping", "directShipping", "円", directShipping, { placeholder: "例：5000" })}
              <p className={hintClass}>空欄の場合は0円として計算します。</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="tedori-direct-packing">梱包資材費の合計</label>
              {unitInput("tedori-direct-packing", "directPacking", "円", directPacking, { placeholder: "例：2000" })}
              <p className={hintClass}>空欄の場合は0円として計算します。</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="tedori-direct-hours">作業時間（任意）</label>
              {unitInput("tedori-direct-hours", "directHours", "時間", directHours, { step: "0.1", inputMode: "decimal", placeholder: "例：5" })}
              <p className={hintClass}>入力すると、1時間あたりの手取りも表示します。</p>
            </div>
          </div>
        </section>

        {/* 結果 */}
        <section className={sectionClass} aria-live="polite">
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            手取りの比較{inputs.crop.trim() && `（${inputs.crop.trim()}）`}
          </h2>
          {diffText && (
            <p className="text-lg text-gray-700 leading-relaxed mb-5 bg-green-50 rounded-xl px-4 py-3">{diffText}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {resultCard("出荷した場合の手取り", ship, "出荷経費", "数量と出荷単価を入力すると表示されます。")}
            {resultCard("直販した場合の手取り", direct, "送料・梱包資材費", "数量と直販単価を入力すると表示されます。")}
          </div>
        </section>

        {/* リセット */}
        <section className={sectionClass}>
          <button
            onClick={resetInputs}
            className="w-full bg-white border-2 border-green-500 text-green-700 hover:bg-green-50 text-lg font-bold py-4 px-6 rounded-2xl shadow-sm transition-colors"
          >
            入力をリセット
          </button>
          <p className={hintClass}>
            入力した内容は、この端末のこのブラウザだけに保存されます。次に開いたときも続きから使えます。
          </p>
        </section>
      </main>
    </div>
  );
}
