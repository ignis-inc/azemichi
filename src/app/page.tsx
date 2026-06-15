import Link from "next/link";
import Reveal from "./components/Reveal";

// ちょっくらのお知らせ登録/アンケートURL
const CHOKKURA_NOTIFY_URL = "https://forms.gle/hdG1aCmDJCZimr5d8";

export default function Home() {
  return (
    <div className="landing">
      {/* ============ ヒーロー ============ */}
      <header className="hero">
        {/*
          畑の帯と、間を縫う畦道のイメージ（装飾）。
          将来、豊後大野の実写写真に差し替える場合はこの <svg> を <img>/<Image> に置き換える。
        */}
        <svg
          className="hero-fields"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMax slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#EDF0E6" />
              <stop offset="1" stopColor="#E3EAD7" />
            </linearGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#sky)" />
          <path d="M0,640 C360,600 1080,700 1440,650 L1440,900 L0,900 Z" fill="#D7E3C2" />
          <path d="M0,720 C420,690 1020,780 1440,730 L1440,900 L0,900 Z" fill="#BFD3A1" />
          <path
            d="M0,800 C480,775 980,850 1440,815 L1440,900 L0,900 Z"
            fill="#9CC056"
            opacity=".85"
          />
          <path
            d="M-20,905 C300,820 360,760 760,720 C1080,690 1180,650 1460,640"
            fill="none"
            stroke="#FBFBF7"
            strokeWidth="14"
            strokeLinecap="round"
            opacity=".7"
          />
          <path
            d="M-20,905 C300,820 360,760 760,720 C1080,690 1180,650 1460,640"
            fill="none"
            stroke="#7FA046"
            strokeWidth="2"
            strokeDasharray="2 12"
            strokeLinecap="round"
          />
        </svg>
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
            手続きの壁をなくす「あぜみち」と、自分の値段で直接売る「ちょっくら」。
            <br />
            農家の“つくる”と“売る”を、もっと身軽に。
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
              「農業は、割に合わない」
              <br />
              ——本当に、そうだろうか。
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
                あぜみちを使う（無料）<span className="arrow">→</span>
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
              <a
                className="btn btn-amber"
                href={CHOKKURA_NOTIFY_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                興味がある方はこちら（お知らせ登録）<span className="arrow">→</span>
              </a>
              <p className="note">※ ちょっくらはあぜみちとは別のサービスです。</p>
            </div>
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
