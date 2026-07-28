export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function page(title: string, body: string, options: { description?: string; canonical?: string; noindex?: boolean } = {}): string {
  const description = options.description ?? "オリジナルビブスの制作相談サイト";
  const robots = options.noindex ? "<meta name=\"robots\" content=\"noindex,nofollow\">" : "";
  const canonical = options.canonical ? `<link rel="canonical" href="${escapeHtml(options.canonical)}">` : "";
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  ${canonical}
  ${robots}
  <link rel="icon" href="/favicon.svg">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>${body}</body>
</html>`;
}

export function publicHeader(): string {
  return `<header class="site-header">
  <a class="brand" href="/">BIBS FACTORY</a>
  <nav aria-label="主要ページ">
    <a href="/features">商品・特徴</a>
    <a href="/price">価格・サイズ</a>
    <a href="/cases">制作事例</a>
    <a href="/flow">注文の流れ</a>
    <a href="/faq">FAQ</a>
    <a class="button small" href="/contact">問い合わせ</a>
  </nav>
</header>`;
}

export function publicFooter(): string {
  return `<footer class="site-footer">
  <div>
    <strong>運営者情報（要確認）</strong>
    <p>営業時間: 平日 10:00-17:00</p>
    <p>問い合わせ: contact@example.invalid</p>
  </div>
  <nav aria-label="フッター">
    <a href="/privacy">プライバシーポリシー</a>
    <a href="/contact">無料相談・問い合わせ</a>
    <a href="/sitemap.xml">サイトマップ</a>
  </nav>
  <small>&copy; BIBS FACTORY</small>
</footer>`;
}

export function cta(): string {
  return `<section class="cta-band">
    <h2>数量やデザインが未定でも相談できます</h2>
    <p>必要な情報だけ入力してください。担当者が内容を確認して連絡します。</p>
    <a class="button" href="/contact">無料相談・問い合わせ</a>
  </section>`;
}
