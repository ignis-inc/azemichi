import { toHiragana } from "wanakana";
import type { CompositionEvent, FormEvent } from "react";

// 氏名欄に入力しながら、下のふりがな欄へリアルタイムで読みの下書きを反映する仕組み。
//
// 考え方：漢字→読みの辞書変換（kuroshiro等）は使わない。
// 人名の読みは辞書変換だと誤りやすいため、IME変換の「変換前にユーザーが打った読み」を
// そのまま使う（compositionupdate/compositionendイベントで拾える）。これは実際にユーザーが
// 打った読みそのものなので、辞書変換より正確になりやすい。
//
// あくまで「下書き」なので、ふりがな欄を手動で編集した後は自動反映を止める
// （notifyManualKanaEdit）。ふりがな欄を空にすると、また自動反映が始まる。

type Segment = { text: string; kana: string };

// ひらがな・カタカナ・長音符のみの文字列か（＝IME変換前の「読み」段階かどうかの判定に使う）
const KANA_LIKE_RE = /^[぀-ゟ゠-ヿー]*$/;

export type FuriganaTracker = {
  handleCompositionUpdate: (e: CompositionEvent<HTMLInputElement>) => void;
  handleCompositionEnd: (e: CompositionEvent<HTMLInputElement>) => void;
  handleInput: (e: FormEvent<HTMLInputElement>) => void;
  notifyManualKanaEdit: () => void;
};

export function createFuriganaTracker(onDraftKana: (kana: string) => void): FuriganaTracker {
  let segments: Segment[] = [];
  let candidateReading = "";
  let touched = false;

  const currentValue = () => segments.map((s) => s.text).join("");
  const currentKana = () => segments.map((s) => s.kana).join("");

  function emit(previewExtra = "") {
    if (touched) return;
    onDraftKana(toHiragana(currentKana() + previewExtra));
  }

  function handleCompositionUpdate(e: CompositionEvent<HTMLInputElement>) {
    const data = e.data ?? "";
    if (KANA_LIKE_RE.test(data)) {
      candidateReading = data;
      emit(data);
    } else {
      // 変換候補が漢字になった後は、直前まで打っていた読み（candidateReading）をプレビューに使う
      emit(candidateReading);
    }
  }

  function handleCompositionEnd(e: CompositionEvent<HTMLInputElement>) {
    const committed = e.data ?? "";
    const reading = KANA_LIKE_RE.test(committed) ? committed : (candidateReading || committed);
    segments.push({ text: committed, kana: toHiragana(reading) });
    candidateReading = "";
    emit();
  }

  function handleInput(e: FormEvent<HTMLInputElement>) {
    // IME変換中のinputイベントはcompositionupdate側で処理済みなのでここでは無視する
    if ((e.nativeEvent as InputEvent).isComposing) return;

    const newValue = e.currentTarget.value;
    const oldValue = currentValue();
    if (newValue === oldValue) return;

    if (newValue === "") {
      segments = [];
      candidateReading = "";
      touched = false; // 氏名欄を空にしたら下書き機能をリセットする
      emit();
      return;
    }

    if (newValue.length > oldValue.length && newValue.startsWith(oldValue)) {
      // 末尾に直接入力された分（姓と名の間のスペースなど、変換を伴わない文字）をそのまま読みとして追加する
      const added = newValue.slice(oldValue.length);
      segments.push({ text: added, kana: toHiragana(added) });
      emit();
      return;
    }

    if (newValue.length < oldValue.length && oldValue.startsWith(newValue)) {
      // 末尾からの削除（Backspaceなど）：削除された分だけ末尾のセグメントを比率でつめる
      let remaining = newValue.length;
      const kept: Segment[] = [];
      for (const seg of segments) {
        if (remaining <= 0) break;
        if (seg.text.length <= remaining) {
          kept.push(seg);
          remaining -= seg.text.length;
        } else {
          const ratio = remaining / seg.text.length;
          const kanaKeepLen = Math.max(0, Math.round(seg.kana.length * ratio));
          kept.push({ text: seg.text.slice(0, remaining), kana: seg.kana.slice(0, kanaKeepLen) });
          remaining = 0;
        }
      }
      segments = kept;
      emit();
      return;
    }

    // 途中への貼り付けなど、上記以外の変化は追いきれないため、
    // 今の入力値をそのまま読みの下書きとして使う（漢字はそのまま残るので手動修正が前提）
    segments = [{ text: newValue, kana: toHiragana(newValue) }];
    candidateReading = "";
    emit();
  }

  // ふりがな欄をユーザーが直接編集したら、以降は氏名欄を空にするまで自動反映しない
  // （中途半端に自動反映を再開すると、意図しない上書きが起きやすいため）
  function notifyManualKanaEdit() {
    touched = true;
  }

  return { handleCompositionUpdate, handleCompositionEnd, handleInput, notifyManualKanaEdit };
}
