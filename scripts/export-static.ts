import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { cta, escapeHtml, page, publicFooter, publicHeader } from "../src/lib/html.ts";
import { loadStore, published, type CaseStudy } from "../src/lib/store.ts";

const outDir = "dist-static";
const store = loadStore();
const basePath = process.env.PAGES_BASE_PATH ?? "/";

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
copyFileSync("public/styles.css", join(outDir, "styles.css"));
copyFileSync("public/favicon.svg", join(outDir, "favicon.svg"));

writePage("index.html", renderHome());
writePage("features/index.html", renderFeatures());
writePage("price/index.html", renderPrice());
writePage("cases/index.html", renderCases());
for (const item of published(store.cases)) writePage(`cases/${item.id}/index.html`, renderCaseDetail(item));
writePage("flow/index.html", renderFlow());
writePage("faq/index.html", renderFaq());
writePage("contact/index.html", renderContactPreview());
writePage("privacy/index.html", renderPrivacy());
writePage("human-preparation/index.html", renderHumanPreparation());
writeFileSync(join(outDir, "robots.txt"), "User-agent: *\nDisallow:\n", "utf8");
writeFileSync(join(outDir, "sitemap.xml"), renderSitemap(), "utf8");

console.log(`static preview exported to ${outDir}`);

function writePage(path: string, html: string): void {
  const fullPath = join(outDir, path);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, withPagesBase(html), "utf8");
}

function withPagesBase(html: string): string {
  const normalized = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return html
    .replaceAll('href="/', `href="${normalized}`)
    .replaceAll('src="/', `src="${normalized}`)
    .replaceAll('action="/', `action="${normalized}`);
}

function renderHome(): string {
  const cases = published(store.cases).slice(0, 3).map(caseCard).join("");
  return page(`${store.site.brandName} | オリジナルビブス制作`, `${publicHeader()}
<main>
  <section class="hero">
    <div>
      <p class="eyebrow">GitHub Pages preview</p>
      <h1>${escapeHtml(store.site.tagline)}</h1>
      <p>${escapeHtml(store.site.description)}</p>
      <div class="actions"><a class="button" href="./price/">価格を見る</a><a class="button secondary" href="./cases/">制作事例を見る</a><a class="button ghost" href="./contact/">無料相談・問い合わせ</a></div>
    </div>
    <div class="product-photo" role="img" aria-label="オリジナルビブスの商品写真プレースホルダー"><span>BIBS</span></div>
  </section>
  <section class="grid three"><article><h2>見やすい番号</h2><p>屋外でも判別しやすい文字サイズを前提に相談できます。</p></article><article><h2>色分け相談</h2><p>チーム、学年、役割ごとの使い分けを整理できます。</p></article><article><h2>画像添付</h2><p>本番アプリではロゴ、参考画像、PDFを問い合わせ時に添付できます。</p></article></section>
  <section><h2>制作事例</h2><div class="case-grid">${cases}</div></section>
  ${cta()}
</main>${publicFooter()}`);
}

function renderFeatures(): string {
  return page("商品・特徴", `${publicHeader()}<main class="narrow"><h1>商品・特徴</h1><p>軽量で扱いやすいビブスを、用途に合わせた色、番号、文字入れで相談できます。</p><div class="placeholder" role="img" aria-label="商品特徴画像プレースホルダー"></div><ul class="check"><li>番号や役割名を大きく表示</li><li>チームやイベント単位の色分け</li><li>デザイン未定でも相談可能</li></ul>${cta()}</main>${publicFooter()}`);
}

function renderPrice(): string {
  const items = published(store.prices).map((item) => `<article class="price"><h2>${escapeHtml(item.label)}</h2><p class="yen">${item.priceYen.toLocaleString("ja-JP")}円 / ${escapeHtml(item.unit)}</p><p>${escapeHtml(item.description)}</p></article>`).join("");
  return page("価格・サイズ", `${publicHeader()}<main><h1>価格・サイズ</h1><p class="lead">価格は仮情報です。本番公開前に税込/税別、送料、納期を確認してください。</p><section class="grid three">${items}</section>${cta()}</main>${publicFooter()}`);
}

function renderCases(): string {
  return page("制作事例", `${publicHeader()}<main><h1>制作事例</h1><div class="case-grid">${published(store.cases).map(caseCard).join("")}</div>${cta()}</main>${publicFooter()}`);
}

function renderCaseDetail(item: CaseStudy): string {
  return page(item.title, `${publicHeader()}<main class="narrow"><p><a href="../">制作事例一覧へ</a></p><div class="placeholder" role="img" aria-label="${escapeHtml(item.imageAlt)}"></div><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.body)}</p>${cta()}</main>${publicFooter()}`);
}

function renderFlow(): string {
  const steps = ["問い合わせ", "内容確認", "見積り・デザイン確認", "注文確定", "入金・製造・発送"].map((step, index) => `<li><strong>${index + 1}. ${step}</strong><p>${index < 3 ? "初期版サイト上で案内します。" : "既存業務で処理します。"}</p></li>`).join("");
  return page("注文の流れ", `${publicHeader()}<main class="narrow"><h1>注文の流れ</h1><ol class="steps">${steps}</ol>${cta()}</main>${publicFooter()}`);
}

function renderFaq(): string {
  const faqs = published(store.faqs).sort((a, b) => a.sortOrder - b.sortOrder).map((faq) => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`).join("");
  return page("FAQ・注意事項", `${publicHeader()}<main class="narrow"><h1>FAQ・注意事項</h1>${faqs}<section class="notice"><h2>注意事項</h2>${published(store.notices).map((n) => `<p><strong>${escapeHtml(n.title)}:</strong> ${escapeHtml(n.body)}</p>`).join("")}</section>${cta()}</main>${publicFooter()}`);
}

function renderContactPreview(): string {
  return page("無料相談・問い合わせ", `${publicHeader()}<main class="narrow"><h1>無料相談・問い合わせ</h1><p class="notice">これはGitHub Pages用の静的プレビューです。送信、添付、管理者通知はローカル実行版または本番サーバーで確認してください。</p><form class="form"><label>お名前 <input disabled value="山田 太郎"></label><label>メールアドレスまたは電話番号 <input disabled value="customer@example.invalid"></label><label>希望数量 <input disabled value="10"></label><label>問い合わせ内容 <textarea disabled>チーム用ビブスについて相談したいです。</textarea></label><button class="button" disabled>送信する</button></form></main>${publicFooter()}`);
}

function renderPrivacy(): string {
  return page("プライバシーポリシー", `${publicHeader()}<main class="narrow"><h1>プライバシーポリシー</h1><p>${escapeHtml(store.site.privacyPolicy)}</p></main>${publicFooter()}`);
}

function renderHumanPreparation(): string {
  const sections = [
    {
      title: "本番公開前に人間が確定する内容",
      items: ["正式な会社名・運営者情報", "正式なロゴ・商品画像", "価格の税込/税別、送料、納期", "キャンセル、修正、返品条件", "プライバシーポリシー正式文面", "通知先メールアドレスと送信ドメイン", "本番ドメイン、DNS、SSL"]
    },
    {
      title: "人間が差し替える素材",
      items: ["トップページの商品写真", "制作事例の写真と説明文", "価格表、サイズ表、注意事項", "会社情報、営業時間、問い合わせ先", "OGP画像、favicon、ブランド表記"]
    },
    {
      title: "人間が確認する動作",
      items: ["スマートフォンで横スクロールが出ない", "価格ページとFAQが読みやすい", "問い合わせフォームの入力内容が妥当", "JPEG、PNG、PDF添付の受け取り", "管理者通知メールと顧客自動返信メール", "管理画面に未認証で入れない", "404ページ、robots、sitemap"]
    },
    {
      title: "GitHub Pagesプレビューの制限",
      items: ["問い合わせ送信は動作しない", "添付保存は動作しない", "管理画面ログインは動作しない", "上記はローカル実行版または本番サーバーで確認する"]
    }
  ];
  const html = sections.map((section) => `<section class="panel"><h2>${escapeHtml(section.title)}</h2><ul>${section.items.map((item) => `<li><label><input type="checkbox"> ${escapeHtml(item)}</label></li>`).join("")}</ul></section>`).join("");
  return page("人間が行う準備・確認作業", `${publicHeader()}<main><h1>人間が行う準備・確認作業</h1><p class="lead">本番公開前に担当者が確認・差し替えする項目をまとめたチェックリストです。</p><div class="grid">${html}</div></main>${publicFooter()}`);
}

function caseCard(item: CaseStudy): string {
  return `<article class="case-card"><div class="placeholder small" role="img" aria-label="${escapeHtml(item.imageAlt)}"></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p><a href="./cases/${escapeHtml(item.id)}/">詳細を見る</a></article>`;
}

function renderSitemap(): string {
  const baseUrl = "https://example.invalid";
  const urls = ["/", "/features/", "/price/", "/cases/", "/flow/", "/faq/", "/contact/", "/privacy/", "/human-preparation/", ...published(store.cases).map((item) => `/cases/${item.id}/`)];
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${baseUrl}${path}</loc></url>`).join("")}</urlset>`;
}
