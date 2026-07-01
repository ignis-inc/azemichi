import Link from "next/link";
import { CHOKKURA_NOTIFY_URL } from "../site";

// 全ページ共通フッター（ルートの layout.tsx から全ページに表示）。
// 「想い」は全ページから動くよう /#omoi（絶対パス）にしている。
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="ftop">
          <div className="fbrand">あぜみち ／ ちょっくら</div>
          <nav className="fnav">
            <Link href="/#omoi">想い</Link>
            <Link href="/tool">あぜみち</Link>
            <a
              href={CHOKKURA_NOTIFY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              ちょっくら
            </a>
            <Link href="/privacy">運営者情報・プライバシー</Link>
          </nav>
        </div>
        <div className="meta">
          株式会社IGNIS（大分県豊後大野市）
          <br />
          つくる人が、ちゃんと報われる農業へ。
        </div>
      </div>
    </footer>
  );
}
