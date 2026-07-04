import type { Metadata } from "next";
import Link from "next/link";
import { DOC_LAST_CHECKED, pageMetadata } from "../site";

export const metadata: Metadata = pageMetadata({
  title: "農業の手続き用語集",
  description:
    "青色申告・確定申告・農地法・農業委員会・農業者年金など、農業の手続きでよく出てくる言葉をやさしく説明します。詳しい要件や最新情報は各機関の公式情報をご案内しています。",
  path: "/yougo",
});

type Source = {
  org: string;
  page: string;
  url: string;
};

type Term = {
  id: string;
  title: string;
  // 段落ごとの本文。数値・期限は書かず、一次ソースに委ねる方針（裏取り報告で確定した文面）
  body: string[];
  sources: Source[];
};

const TERMS: Term[] = [
  {
    id: "aoiro",
    title: "青色申告",
    body: [
      "青色申告は、日々の取引をきちんと帳簿につけ、その帳簿にもとづいて所得税の申告を行う制度です。帳簿づけの内容に応じて、所得の計算のうえで一定の特典が設けられているとされています。利用するには、あらかじめ税務署に申請して承認を受ける必要があるとされており、農業による所得も対象に含まれます。詳しくは国税庁の公式情報でご確認ください。",
    ],
    sources: [
      {
        org: "国税庁",
        page: "タックスアンサー No.2070 青色申告制度",
        url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2070.htm",
      },
      {
        org: "国税庁",
        page: "所得税の青色申告承認申請手続",
        url: "https://www.nta.go.jp/taxes/tetsuzuki/shinsei/annai/shinkoku/annai/09.htm",
      },
      {
        org: "国税庁",
        page: "確定申告書等の様式一覧（青色申告決算書〈農業所得用〉）",
        url: "https://www.nta.go.jp/taxes/shiraberu/shinkoku/yoshiki/01/shinkokusho/r06.htm",
      },
    ],
  },
  {
    id: "shiro",
    title: "白色申告",
    body: [
      "白色申告は、青色申告の承認を受けていない方が行う所得税の申告を指す、一般的な呼び方です。白色申告の場合でも、収入や経費を帳簿につけ、その帳簿や書類を保存することが必要とされています。申告書を出す際には、収支内訳書などの書類を添えることとされています。詳しくは国税庁の公式情報でご確認ください。",
    ],
    sources: [
      {
        org: "国税庁",
        page: "タックスアンサー No.2080 白色申告者の記帳・帳簿等保存制度",
        url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2080.htm",
      },
    ],
  },
  {
    id: "kakutei",
    title: "確定申告",
    body: [
      "確定申告は、1年間に得た所得の金額と、それに対する所得税の額を自分で計算し、税務署に申告書を提出して税金を確定させる手続きです。給与や年金などからあらかじめ差し引かれた税金がある場合に、その過不足を精算する役割もあるとされています。農業の収入について青色申告や白色申告を行う場合も、この確定申告の中で行います。詳しくは国税庁の公式情報でご確認ください。",
    ],
    sources: [
      {
        org: "国税庁",
        page: "所得税等の確定申告とは",
        url: "https://www.nta.go.jp/taxes/shiraberu/shinkoku/tebiki/2024/01/1_01.htm",
      },
    ],
  },
  {
    id: "invoice",
    title: "インボイス制度（適格請求書）",
    body: [
      "インボイス制度（正式には「適格請求書等保存方式」）は、消費税に関するしくみで、売り手が買い手に対して正しい税率や消費税額などを伝えるための書類（インボイス＝適格請求書）を用いる制度とされています。買い手が消費税の計算で仕入れ分の税額を差し引くには、原則としてこの書類の保存が必要とされています。インボイスを発行するには、税務署に申請して「適格請求書発行事業者」の登録を受ける必要があるとされています。詳しくは国税庁のインボイス制度の公式情報でご確認ください。",
    ],
    sources: [
      {
        org: "国税庁",
        page: "インボイス制度について",
        url: "https://www.nta.go.jp/taxes/shiraberu/zeimokubetsu/shohi/keigenzeiritsu/invoice_about.htm",
      },
      {
        org: "国税庁",
        page: "タックスアンサー No.6498 適格請求書等保存方式（インボイス制度）",
        url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6498.htm",
      },
    ],
  },
  {
    id: "keiei-antei",
    title: "経営所得安定対策（ゲタ・ナラシ）",
    body: [
      "経営所得安定対策は、国が担い手となる農家の経営の安定を支えるために行っている仕組みです。外国との生産条件の差からくる不利をおぎなう「ゲタ対策（畑作物の直接支払交付金）」と、収入が減ったときにその影響をやわらげる「ナラシ対策（収入減少影響緩和交付金）」の2本柱があるとされています。対象や手続きは年度によって見直されることがありますので、詳しくは農林水産省の公式情報でご確認ください。",
    ],
    sources: [
      {
        org: "農林水産省",
        page: "経営所得安定対策",
        url: "https://www.maff.go.jp/j/seisaku_tokatu/antei/keiei_antei.html",
      },
    ],
  },
  {
    id: "nintei",
    title: "認定農業者",
    body: [
      "認定農業者とは、農業経営をより良くしていくための計画（農業経営改善計画）を自分で作り、市町村など（複数の市町村で営農する場合は都道府県や国）の認定を受けた農業者のことです。試験に合格して取る資格や免許ではなく、「これからの経営改善の計画」を認めてもらう仕組みとされています。認定を受けた農業者にはさまざまな支援措置があるとされています。詳しくはお住まいの市町村や農林水産省の公式情報でご確認ください。",
    ],
    sources: [
      {
        org: "農林水産省",
        page: "認定農業者制度について",
        url: "https://www.maff.go.jp/j/kobetu_ninaite/n_seido/seido_ninaite.html",
      },
    ],
  },
  {
    id: "nenkin",
    title: "農業者年金",
    body: [
      "農業者年金は、独立行政法人農業者年金基金が運営する、農業に従事する方のための年金制度です。国民年金に上乗せする形の制度で、加入には国民年金の第1号被保険者であることなどの要件があるとされています。自分で積み立てた保険料とその運用益によって将来の年金額が決まる仕組み（積立方式・確定拠出型）とされています。詳しくは農業者年金基金の公式情報や、お近くのJA・農業委員会でご確認ください。",
    ],
    sources: [
      {
        org: "農業者年金基金",
        page: "農業者年金の加入資格",
        url: "https://www.nounen.go.jp/kentou/youken.html",
      },
      {
        org: "農業者年金基金",
        page: "農業者年金の特徴",
        url: "https://www.nounen.go.jp/kentou/tokucho/index.html",
      },
      {
        org: "農業者年金基金",
        page: "加入までの流れ",
        url: "https://www.nounen.go.jp/kentou/nagare/index.html",
      },
    ],
  },
  {
    id: "nouchihou",
    title: "農地法（3条・4条・5条）",
    body: [
      "農地法は、農地を守り、有効に使うための法律です。農地を農地のまま売ったり貸したりするときは3条にもとづく農業委員会の許可、自分の農地を家や駐車場など農地以外に変える（転用する）ときは4条にもとづく許可、転用する目的で農地を売ったり貸したりするときは5条にもとづく許可が、それぞれ原則として必要とされています。なお、相続などで農地を取得した場合は、これらの許可ではなく、農業委員会への届出（農地法3条の3の届出）が必要とされています。あぜみちで作成できる農地の届出は、この届出にあたります。どの手続きにあたるかはケースによって異なりますので、詳しくはお住まいの農業委員会や農林水産省の公式情報でご確認ください。",
    ],
    sources: [
      {
        org: "農林水産省",
        page: "農地をめぐる事情について",
        url: "https://www.maff.go.jp/j/keiei/koukai/wakariyasu.html",
      },
      {
        org: "農林水産省",
        page: "農地転用許可制度について",
        url: "https://www.maff.go.jp/j/nousin/noukei/totiriyo/nouchi_tenyo.html",
      },
      {
        org: "農林水産省",
        page: "農地相続ポータル",
        url: "https://www.maff.go.jp/j/keiei/koukai/nouchi_souzoku.html",
      },
    ],
  },
  {
    id: "iinkai",
    title: "農業委員会",
    body: [
      "農業委員会は、法律にもとづいて市町村に置かれている、農地に関する行政委員会です。農地の売買や貸し借りの許可、相続などの届出の受付といった農地法にもとづく事務のほか、担い手への農地の集積、遊休農地の解消など「農地利用の最適化」を進める役割を担うとされています。農地のことで手続きや相談があるときの身近な窓口です。詳しくはお住まいの市町村の農業委員会や農林水産省の公式情報でご確認ください。",
    ],
    sources: [
      {
        org: "農林水産省",
        page: "農業委員会について",
        url: "https://www.maff.go.jp/j/keiei/koukai/iinkai.html",
      },
      {
        org: "全国農業会議所",
        page: "農業委員会組織について",
        url: "https://www.nca.or.jp/about-us/committee/about/",
      },
    ],
  },
  {
    id: "beikoku",
    title: "米穀の出荷・販売事業の届出",
    body: [
      "お米（米穀）を出荷したり販売したりする事業を行う場合、法律にもとづいて、あらかじめ国（地方農政局など）へ届け出ることが必要とされています。ただし、取り扱う量が一定に満たない場合など、届出が不要とされるケースもあります。また、届出とは別に、お米の取引記録や産地情報の伝達、表示などに関する別の法律のルールも関係するとされています。詳しくは農林水産省の公式情報でご確認ください。",
    ],
    sources: [
      {
        org: "農林水産省",
        page: "米穀の出荷又は販売の事業の届出等について",
        url: "https://www.maff.go.jp/j/seisan/syukka_hanbai_todokede/",
      },
    ],
  },
];

export default function YougoPage() {
  return (
    <div className="landing legal-page">
      <main className="legal">
        <h1>農業の手続き用語集</h1>
        <p>
          農業の手続きでよく出てくる言葉を、やさしく説明しています。制度の詳しい要件や最新情報は、各機関の公式情報や窓口でご確認ください。
        </p>

        {TERMS.map((term) => (
          <section key={term.id}>
            <h2>{term.title}</h2>
            {term.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            <p className="yougo-source">
              出典：
              {term.sources.map((s, i) => (
                <span key={s.url}>
                  {i > 0 && "／"}
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.org}「{s.page}」
                  </a>
                </span>
              ))}
              <br />
              最終確認：{DOC_LAST_CHECKED}
            </p>
          </section>
        ))}

        <p className="legal-back">
          <Link href="/">← あぜみちトップへ</Link>
        </p>
      </main>
    </div>
  );
}
