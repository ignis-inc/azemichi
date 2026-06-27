import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "../components/Reveal";
import { CHOKKURA_NOTIFY_URL, pageMetadata } from "../site";

export const metadata: Metadata = pageMetadata({
  title: "ちょっくら（農家のための直販のしくみ）",
  description:
    "ちょっくらは、農家が自分の値段でお客さんに直接届けるための直販のしくみです（近日公開）。注文・発送・売上の管理をスマホ一台で行えるよう準備しています。",
  path: "/chokkura",
});

export default function ChokkuraPage() {
  return (
    <div className="landing chokkura-page">
      {/* ============ ヒーロー ============ */}
      <header className="chokkura-hero">
        <div className="chokkura-hero-inner">
          <div className="eyebrow amber">
            <span className="dot" />
            ちょっくら <span className="ja">／ 農家のための直販のしくみ</span>
          </div>
          <h1>
            つくったものを、
            <br />
            自分の値段で。
          </h1>
          <p className="chokkura-hero-sub">
            ちょっくら／農家のための直販のしくみ（近日公開）
          </p>
        </div>
      </header>

      {/* ============ ① 共感（直販の壁） ============ */}
      <section className="section">
        <div className="road">
          <Reveal className="seg amber">
            <div className="eyebrow amber">直販の壁</div>
            <p className="body">
              丹精込めてつくっても値段は自分で決められず、手間に見合う手取りが残らない。直販はそれを越える手段ですが、いざ始めると「売り先の見つけ方」「注文や発送の管理」でつまずきがちです。
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ ② ちょっくらで目指していること（開発中） ============ */}
      <section className="section">
        <div className="road">
          <Reveal className="seg amber">
            <div className="eyebrow amber">
              目指していること <span className="ja">／ 開発中</span>
            </div>
            <h2>ちょっくらで目指していること</h2>
            <p className="body">
              つくった人が、自分の値段で、お客さんに直接届ける。注文・発送・売上の管理をスマホ一台で行えるよう準備しています。
            </p>
            <div className="ck-prep">
              <div className="ck-prep-label">準備中の機能</div>
              <ul>
                <li>自分のお店ページ</li>
                <li>注文・発送の管理</li>
                <li>売上の把握</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ ③ 手取りを残す ============ */}
      <section className="section">
        <div className="road">
          <Reveal className="seg amber">
            <div className="eyebrow amber">手取りを残す</div>
            <p className="body">
              何枚も中間を挟まず、つくった人の手元にきちんと残る売り方を目指します。
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ ④ 正直に：まだ準備中 ＋ ⑤ CTA ============ */}
      <section className="section">
        <div className="road">
          <Reveal className="seg amber">
            <div className="eyebrow amber">まだ準備中</div>
            <p className="body">
              ちょっくらは現在準備中です。「使ってみたい」「話を聞きたい」という方は、お知らせ登録を。公開のご案内や、先行してお試しいただける機会をお届けします。
            </p>
            <a
              className="btn btn-amber"
              href={CHOKKURA_NOTIFY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="btn-label">
                興味がある方はこちら<wbr />（お知らせ登録）
              </span>
              <span className="arrow">→</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ============ ⑥ あぜみちへ戻す導線 ============ */}
      <section className="finale">
        <Reveal className="wrap">
          <p>
            「まず手続きから」という方へ。販売に必要な届出は、あぜみちで無料でつくれます。
          </p>
          <Link className="btn btn-primary" href="/tool">
            書類をつくる<span className="arrow">→</span>
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
