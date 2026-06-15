import Link from "next/link";

export const metadata = {
  title: "私たちの想い | あぜみち",
  description:
    "つくる人が、ちゃんと報われる農業へ。私たちIGNISが「あぜみち」と「ちょっくら」をつくる理由。",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-green-50">
      {/* ヘッダー */}
      <header className="bg-green-700 text-white py-8 px-4 text-center shadow-md">
        <h1 className="text-3xl font-bold leading-tight">私たちの想い</h1>
        <p className="mt-2 text-green-100 text-base">あぜみちが目指すこと</p>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <article className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-green-800 leading-snug mb-3">
            つくる人が、ちゃんと報われる農業へ。
          </h2>
          <p className="text-base text-gray-600 leading-relaxed mb-8">
            ― 私たちIGNISが「あぜみち」と「ちょっくら」をつくる理由
          </p>

          <h3 className="text-xl font-bold text-green-800 mt-8 mb-4 pb-2 border-b-2 border-green-200">
            いま、農業の現場で起きていること
          </h3>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            日本の農業は、静かに、けれど確実に岐路に立っています。
          </p>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            農林水産省の2025年農林業センサスによれば、ふだん主に農業に従事している人（基幹的農業従事者）は約102万人。2020年から5年で34万人減り、2000年の240万人と比べると、25年でおよそ6割が失われました。平均年齢は67.6歳。65歳以上が全体の約7割を占め、49歳以下は1割ほどしかいません。
          </p>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            2025年は平均年齢がわずかに下がりましたが、これは「若返り」と手放しで喜べる数字ではありません。若い担い手が少し増えたこと以上に、高齢の農家さんが田畑を手放して離れていったことの表れでもある、と専門家は指摘しています。
          </p>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            なぜ、後を継ぐ人が増えないのか。理由はいくつもありますが、根っこにあるのはシンプルな実感だと思います。
          </p>
          <p className="text-xl font-bold text-green-800 leading-loose mb-5 text-center">
            「農業は、割に合わない」
          </p>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            朝早くから手をかけて、天候と向き合って、ようやく実ったもの。それを出荷しても、手元にいくら残るのかが見えにくい。価格も売り先も、自分では決められない。一生懸命つくったものが、正当に評価されている実感を持ちにくい。
          </p>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            でも、私たちはこう考えています。農業が割に合わないのではなく、「売り方」と「手続きの重さ」が、つくる人の取り分と最初の一歩を奪っているだけではないか、と。
          </p>

          <h3 className="text-xl font-bold text-green-800 mt-10 mb-4 pb-2 border-b-2 border-green-200">
            私たちの思い
          </h3>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            私たちIGNISは、大分県豊後大野市に拠点を置く、地域密着型のIT企業です。
          </p>
          <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-4 mb-5">
            <p className="text-lg text-gray-700 leading-loose">「JAに出しても、いくら手元に残るかわからない」</p>
            <p className="text-lg text-gray-700 leading-loose">「直接売りたいけど、どうすればいいかわからない」</p>
            <p className="text-lg text-gray-700 leading-loose">「もう歳だから、難しいことはできない」</p>
          </div>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            一生懸命つくったものが、正当に評価されない。自分の努力がどれだけ報われているか、わからない。
          </p>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            そんな農家さんの現実を変えたくて、私たちは道具をつくっています。
          </p>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            そして気づいたのは、変える前にもう一つ、壁があるということでした。それは「手続きの難しさ」です。お米を売るにも届出が要る。青色申告も、補助金の申請も、書類の山。最初の一歩でつまずいて、直販をあきらめてしまう人がいる。
          </p>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            だから私たちは、その壁をできるだけ低くしたいと思いました。まずは誰でも、無料で使える形にしよう、と。
          </p>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            難しいことはこちらで引き受けます。農家さんには、つくることと、売ることに集中してほしい。「農業をやっていてよかった」「直販してよかった」と思える日を、一緒につくりたいと思っています。
          </p>
          <p className="text-lg font-bold text-gray-800 leading-loose mb-5 text-right">
            株式会社IGNIS
          </p>

          <h3 className="text-xl font-bold text-green-800 mt-10 mb-4 pb-2 border-b-2 border-green-200">
            私たちにできること
          </h3>

          <h4 className="text-lg font-bold text-green-700 mt-6 mb-3">
            あぜみち ― 農業の手続き書類を、誰でも無料で
          </h4>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            農業を続けるにも、新しく何かを始めるにも、必ずついて回るのが役所への書類です。
          </p>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            あぜみちは、お米を売り始めるときの届出、青色申告、農地の届出、農業者年金、補助金の申請といった書類を、画面の案内にそって入力するだけでPDFにできる無料のツールです。難しい様式とにらめっこする時間を、できるだけ短くします。
          </p>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            会員登録もお金も要りません。誰でも、必要なときに、すぐ使えます。
          </p>

          <h4 className="text-lg font-bold mt-8 mb-3" style={{ color: "#B45309" }}>
            ちょっくら ― つくったものを、自分の値段で
          </h4>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            手続きの次は、「売る」です。
          </p>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            ちょっくらは、農家さんが自分でつくったものを、自分で決めた値段で、お客さんに直接届けられる直販のしくみです。注文・発送・売上の管理をスマホ一台で。中間に何枚も挟まず、つくった人の手元にきちんと残る売り方を目指しています。
          </p>

          <h3 className="text-xl font-bold text-green-800 mt-10 mb-4 pb-2 border-b-2 border-green-200">
            まずは、最初の一歩から
          </h3>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            農業を取り巻く数字は、たしかに厳しいものばかりです。けれど、つくる人が報われる売り方と、つまずかない手続きがあれば、変えられる部分は必ずあると私たちは信じています。
          </p>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            難しく考えなくて大丈夫です。
          </p>
          <p className="text-lg text-gray-800 leading-loose mb-5">
            まずは「あぜみち」で、必要な書類を一枚つくってみてください。そして、つくったものを売る準備ができたら、「ちょっくら」で直販の一歩を踏み出してみてください。
          </p>
          <p className="text-xl font-bold text-green-800 leading-loose mt-6">
            つくる人が、ちゃんと報われる農業へ。その入口を、ここから。
          </p>
        </article>

        {/* トップへ戻る */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-block text-base font-bold text-green-700 underline underline-offset-4 hover:text-green-800"
          >
            ← トップに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
