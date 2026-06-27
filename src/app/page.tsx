import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ContactForm from "./components/ContactForm";
import Reveal from "./components/Reveal";
import { CHOKKURA_NOTIFY_URL, pageMetadata } from "./site";

export const metadata: Metadata = pageMetadata({
  title: "つくる人が、ちゃんと報われる農業へ。｜あぜみち・ちょっくら / IGNIS",
  description:
    "農業の手続き書類を、スマホでかんたんにPDF化できる無料ツール「あぜみち」。米の販売届出・青色申告・農地の届出・農業者年金・補助金申請に対応。登録不要で、つくる人の最初の一歩を軽くします。",
  path: "/",
  absoluteTitle: true,
});

// よくある質問。画面表示とFAQPageのJSON-LDを同じデータから生成し、文面を完全一致させる。
const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "あぜみちは無料ですか？",
    a: "はい、完全に無料でお使いいただけます。会員登録も必要ありません。",
  },
  {
    q: "どんな書類が作れますか？",
    a: "次の5種類に対応しています。米の販売届出・青色申告・農地の届出・農業者年金・補助金申請。",
  },
  {
    q: "PDFを作ったあと、どうすればいいですか？",
    a: "①まず内容をご確認ください。②印刷して提出先の窓口に持参するか、対応している手続きならオンライン申請もできます。様式に沿って作成しますが、記載内容の最終確認はご自身でお願いします。",
  },
  {
    q: "作ったPDFはどこに保存される？印刷やコピーはできますか？",
    a: "作成したPDFは、あぜみちのサーバーには保存されません。入力内容からその場でPDFを作り、お使いの端末（ブラウザのダウンロード先。多くは「ダウンロード」フォルダ）に保存されます。あなたの端末のファイルなので、印刷もコピーも自由です。スマホで作った場合は、コンビニのプリントサービスでも印刷できます。",
  },
  {
    q: "行政書士・税理士のサービスですか？",
    a: "いいえ。あぜみちは書類の作成を補助するツールで、行政書士・税理士などの専門業務ではありません。手続きの可否や内容については、提出先の窓口や専門家にご確認ください。",
  },
  {
    q: "入力した個人情報はどう扱われますか？",
    a: "入力された内容は、PDFを作成するためだけに使われます。あぜみちのサーバーに保存・記録することはなく、作成後のPDFもお使いの端末に保存されるだけで、こちらには残りません。会員登録も不要です。",
  },
  {
    q: "ちょっくらとは？",
    a: "農家が中間を通さず、自分の値段でお客さんに直接販売できるサービスです（近日公開）。あぜみちとは別のサービスです。",
  },
];

// FAQ構造化データ（FAQPage）。質問・回答は上の FAQ_ITEMS と同一なので画面と完全一致する。
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function Home() {
  return (
    <div className="landing">
      {/* ============ ヒーロー ============ */}
      <header className="hero">
        {/*
          ヒーロー背景：豊後大野を思わせる里山の田園風景（フリー素材 / Unsplash License）。
          アクセスが増えたら、ここの src を実写写真（例: /hero-bungoono.jpg）に差し替える。
          左からの薄い白いかすみ（.hero-photo::after）で見出し文字を読みやすく保っている。
        */}
        <div className="hero-photo" aria-hidden="true">
          <Image
            className="hero-img"
            src="/hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="hero-inner">
          <div className="brandmark">
            <span className="dot" />
            IGNIS ／ 大分・豊後大野
          </div>
          <h1>
            つくる人が、
            <br />
            ちゃんと<span className="em">報われる</span>農業へ。
          </h1>
          <p className="hero-sub">
            <span className="nw">手続きの壁をなくす「あぜみち」と、</span>
            <span className="nw">自分の値段で直接売る「ちょっくら」。</span>
            <br />
            <span className="nw">農家の“つくる”と“売る”を、</span>
            <span className="nw">もっと身軽に。</span>
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/tool">
              あぜみちを無料で使う<span className="arrow">→</span>
            </Link>
            <a className="btn btn-ghost" href="#omoi">
              私たちの想い ↓
            </a>
          </div>
        </div>
      </header>

      {/* ============ 現状 ============ */}
      <section className="section reality">
        <div className="road">
          <Reveal className="seg">
            <div className="eyebrow">
              現在地 <span className="ja">／ いま、農業の現場で</span>
            </div>
            <h2>
              <span className="nw">「農業は、</span>
              <span className="nw">割に合わない」</span>
              <br />
              <span className="nw">——本当に、</span>
              <span className="nw">そうだろうか。</span>
            </h2>
            <p className="body">
              朝早くから手をかけ、天候と向き合い、ようやく実ったもの。それを出荷しても、手元にいくら残るのかが見えにくい。価格も売り先も、自分では決められない。
            </p>
            <div className="stats">
              <div className="stat">
                <div className="n">
                  102<small>万人</small>
                </div>
                <div className="l">基幹的農業従事者。25年で約6割減（2025年農林業センサス）</div>
              </div>
              <div className="stat">
                <div className="n">
                  67.6<small>歳</small>
                </div>
                <div className="l">平均年齢。65歳以上が約7割を占める</div>
              </div>
              <div className="stat">
                <div className="n">
                  約1<small>割</small>
                </div>
                <div className="l">49歳以下の担い手の割合</div>
              </div>
            </div>
            <p className="turn">
              でも私たちは、こう考えています。
              <br />
              農業が割に合わないのではなく、
              <span className="hl">「売り方」と「手続きの重さ」</span>
              が、つくる人の取り分と最初の一歩を奪っているだけではないか、と。
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ 想い ============ */}
      <section id="omoi" className="section">
        <div className="road">
          <Reveal className="seg">
            <div className="eyebrow">
              私たちの想い <span className="ja">／ なぜ、つくるのか</span>
            </div>
            <h2>
              つくった人の手元に、
              <br />
              ちゃんと残る農業を。
            </h2>
            <div className="voices">
              <p>
                「JAに出しても、いくら手元に残るかわからない」
                <br />
                「直接売りたいけど、どうすればいいかわからない」
                <br />
                「もう歳だから、難しいことはできない」
              </p>
            </div>
            <p className="body">
              私たちIGNISは、大分県豊後大野市の小さなIT会社です。一生懸命つくったものが正当に評価されない——その現実を変えたくて、道具をつくっています。
            </p>
            <p className="body">
              そして気づいたのは、変える前にもう一つ壁があること。「手続きの難しさ」です。だから私たちは、その壁をできるだけ低く、まずは誰でも無料で使える形にしました。難しいことは、こちらで引き受けます。
            </p>
            <p className="sign">— 株式会社IGNIS</p>
          </Reveal>
        </div>
      </section>

      {/* ============ あぜみち ============ */}
      <section id="azemichi" className="section">
        <div className="road">
          <Reveal className="seg">
            <div className="eyebrow">
              道具その一 <span className="ja">／ 無料・登録不要</span>
            </div>
            <h2>書類の壁を、なくす。</h2>
            <div className="tool green">
              <span className="tag">あぜみち</span>
              <h3>
                役所の手続き書類を、
                <br />
                入力するだけでPDFに。
              </h3>
              <p className="desc">
                お米を売り始めるときの届出も、青色申告も、補助金の申請も。難しい様式とにらめっこする時間を、できるだけ短くします。
              </p>
              <ul className="toollist">
                <li>米の販売届出</li>
                <li>青色申告</li>
                <li>農地の届出</li>
                <li>農業者年金</li>
                <li>補助金申請</li>
              </ul>
              <Link className="btn btn-primary" href="/tool">
                <span className="btn-label">
                  あぜみちを使う<wbr />（無料）
                </span>
                <span className="arrow">→</span>
              </Link>
              <p className="note">会員登録もお金もいりません。誰でも、必要なときにすぐ使えます。</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ ちょっくら ============ */}
      <section className="section">
        <div className="road">
          <Reveal className="seg amber">
            <div className="eyebrow amber">
              道具その二 <span className="ja">／ 近日公開</span>
            </div>
            <h2>
              つくったものを、
              <br />
              自分の値段で。
            </h2>
            <div className="tool amber">
              <span className="tag">ちょっくら</span>
              <h3>
                中間を通さず、
                <br />
                お客さんに直接売る。
              </h3>
              <p className="desc">
                注文も発送も売上の管理も、スマホ一台で。つくった人の手元に、きちんと残る売り方を目指しています。手続きを整えたら、次は売る場所へ。
              </p>
              <div className="cta-row">
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
                <Link className="btn btn-ghost" href="/chokkura">
                  詳しくはこちら<span className="arrow">→</span>
                </Link>
              </div>
              <p className="note">※ ちょっくらはあぜみちとは別のサービスです。</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ よくある質問（FAQ） ============ */}
      <section id="faq" className="section">
        <div className="road">
          <Reveal className="seg">
            <div className="eyebrow">
              よくある質問 <span className="ja">／ はじめる前に</span>
            </div>
            <h2>気になることに、お答えします。</h2>
            {/* FAQ構造化データ。文面は FAQ_ITEMS と同一なので画面表示と完全一致 */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <div className="faq-list">
              {FAQ_ITEMS.map((item) => (
                <details className="faq-item" key={item.q}>
                  <summary>{item.q}</summary>
                  <div className="faq-answer">{item.a}</div>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ 質問・ご意見箱 ============ */}
      <section id="contact" className="section">
        <div className="road">
          <Reveal className="seg">
            <div className="eyebrow">
              質問・ご意見箱 <span className="ja">／ お気軽にどうぞ</span>
            </div>
            <h2>ご意見・ご質問をお寄せください。</h2>
            <p className="body">
              「こんな書類も作れたら」「ここが分かりにくい」など、どんなことでも構いません。いただいた声は、あぜみちをより良くするために役立てます。
            </p>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      {/* ============ 結び ============ */}
      <section className="finale">
        <Reveal className="wrap">
          <h2>最初の一歩を、ここから。</h2>
          <p>
            まずは書類を一枚。つくったものを売る準備ができたら、その先へ。つくる人が、ちゃんと報われる農業を、一緒に。
          </p>
          <Link className="btn btn-primary" href="/tool">
            あぜみちを無料で使う<span className="arrow">→</span>
          </Link>
        </Reveal>
      </section>

      {/* ============ フッター ============ */}
      <footer className="site-footer">
        <div className="road">
          <div className="ftop">
            <div className="fbrand">あぜみち ／ ちょっくら</div>
            <nav className="fnav">
              <a href="#omoi">想い</a>
              <Link href="/tool">あぜみち</Link>
              <a href={CHOKKURA_NOTIFY_URL} target="_blank" rel="noopener noreferrer">
                ちょっくら
              </a>
            </nav>
          </div>
          <div className="meta">
            株式会社IGNIS（大分県豊後大野市）
            <br />
            つくる人が、ちゃんと報われる農業へ。
          </div>
        </div>
      </footer>
    </div>
  );
}
