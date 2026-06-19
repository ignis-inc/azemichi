"use client";

import { useState } from "react";

// Netlify Forms のフォーム名。public/__forms.html の静的フォームと一致させること。
const FORM_NAME = "azemichi-contact";

function encode(data: Record<string, string>): string {
  return Object.keys(data)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
    .join("&");
}

/**
 * 質問・ご意見箱。送信内容は Netlify Forms 経由で Netlify の管理画面に届く。
 * - honeypot（bot-field）で迷惑投稿対策。
 * - 本番（Netlify）では "/" への POST を Netlify が受け取りフォーム送信として処理する。
 * - ローカル（next dev）には Netlify の受け口が無いため POST は失敗する。
 *   その場合は送信後のお礼メッセージを確認できるよう、localhost のときだけ成功表示にする。
 */
export default function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data: Record<string, string> = {};
    fd.forEach((value, key) => {
      data[key] = typeof value === "string" ? value : "";
    });

    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode(data),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setSubmitted(true);
    } catch (err) {
      // ローカル開発では Netlify の受け口が無いので、お礼表示のプレビューだけ許可する
      const isLocal =
        typeof window !== "undefined" &&
        ["localhost", "127.0.0.1"].includes(window.location.hostname);
      if (isLocal) {
        setSubmitted(true);
      } else {
        console.error("お問い合わせ送信エラー:", err);
        setError(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="contact-thanks" role="status">
        送信ありがとうございました。
        <br />
        いただいたご意見・ご質問は、今後の改善に役立てさせていただきます。
      </div>
    );
  }

  return (
    <form
      name={FORM_NAME}
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
      className="contact-card"
    >
      {/* Netlify がどのフォームかを判別するための隠し項目 */}
      <input type="hidden" name="form-name" value={FORM_NAME} />

      {/* honeypot：人には見えない。ここに入力があればボットと判断される */}
      <p className="contact-hp" aria-hidden="true">
        <label>
          この欄は空のままにしてください
          <input name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </p>

      <div className="field">
        <label htmlFor="contact-message">
          ご意見・ご質問<span className="req">必須</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          placeholder="ご自由にお書きください。"
        />
      </div>

      <div className="field">
        <label htmlFor="contact-email">連絡先メール（任意）</label>
        <input
          id="contact-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="返信が必要な場合のみご入力ください"
        />
      </div>

      {error && (
        <p className="contact-error" role="alert">
          送信に失敗しました。お手数ですが、時間をおいて再度お試しください。
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? "送信中…" : "送信する"}
        <span className="arrow">→</span>
      </button>
    </form>
  );
}
