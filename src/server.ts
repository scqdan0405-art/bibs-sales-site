import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createId, loadStore, nowIso, published, updateStore, type CaseStudy, type Faq, type PriceItem } from "./lib/store.ts";
import { cta, escapeHtml, page, publicFooter, publicHeader } from "./lib/html.ts";
import { getConfig } from "./lib/config.ts";
import { parseMultipart, parseUrlEncoded, readBody } from "./lib/multipart.ts";
import { hasErrors, sanitizeText, validateContact, type ContactInput } from "./lib/validation.ts";
import { applySecurityHeaders, cookieHeader, createSession, findAdmin, hashPassword, logout, rateLimit, requireAdmin, verifyCsrf, verifyPassword } from "./lib/security.ts";
import { validateAndStoreFiles } from "./lib/upload.ts";
import { sendInquiryMails } from "./lib/mail.ts";
import { log } from "./lib/logger.ts";

const config = getConfig();

const server = createServer(async (req, res) => {
  try {
    applySecurityHeaders(res, req.url?.startsWith("/admin") ?? false);
    const url = new URL(req.url ?? "/", config.baseUrl);
    if (await serveStatic(url, res)) return;
    if (req.method === "GET") return handleGet(req, res, url);
    if (req.method === "POST") return await handlePost(req, res, url);
    sendText(res, 405, "Method Not Allowed");
  } catch (error) {
    log("error", "unhandled_error", { message: error instanceof Error ? error.message : "unknown" });
    sendHtml(res, 500, page("エラー", `${publicHeader()}<main class="narrow"><h1>処理を完了できませんでした</h1><p>時間をおいて再度お試しください。</p></main>${publicFooter()}`));
  }
});

server.listen(config.port, () => {
  ensureAdmin();
  log("info", "server_started", { port: config.port });
  console.log(`http://localhost:${config.port}`);
});

async function handleGet(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const store = loadStore();
  const path = url.pathname;
  if (path === "/") return sendHtml(res, 200, renderHome());
  if (path === "/features") return sendHtml(res, 200, renderFeatures());
  if (path === "/price") return sendHtml(res, 200, renderPrice());
  if (path === "/cases") return sendHtml(res, 200, renderCases());
  if (path.startsWith("/cases/")) return sendHtml(res, 200, renderCaseDetail(path.split("/").at(-1) ?? ""));
  if (path === "/flow") return sendHtml(res, 200, renderFlow());
  if (path === "/faq") return sendHtml(res, 200, renderFaq());
  if (path === "/privacy") return sendHtml(res, 200, renderPrivacy());
  if (path === "/contact") return sendHtml(res, 200, renderContact({}, {}, csrfPublic(req, res)));
  if (path === "/contact/thanks") return sendHtml(res, 200, renderThanks(url.searchParams.get("id") ?? ""));
  if (path === "/robots.txt") return sendText(res, 200, "User-agent: *\nDisallow: /admin\nSitemap: /sitemap.xml\n");
  if (path === "/sitemap.xml") return sendXml(res, renderSitemap());
  if (path === "/admin/login") return sendHtml(res, 200, renderLogin());
  if (path === "/admin") {
    const session = requireAdmin(req, res);
    if (!session) return;
    return sendHtml(res, 200, renderAdmin(session.csrfToken));
  }
  if (path.startsWith("/admin/attachments/")) {
    const session = requireAdmin(req, res);
    if (!session) return;
    return serveAttachment(res, path.split("/").at(-1) ?? "");
  }
  sendHtml(res, 404, page("ページが見つかりません", `${publicHeader()}<main class="narrow"><h1>ページが見つかりません</h1><p>URLをご確認ください。</p><a class="button" href="/">トップへ戻る</a></main>${publicFooter()}`));
}

async function handlePost(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  if (url.pathname === "/contact") return await submitContact(req, res);
  if (url.pathname === "/admin/login") return await submitLogin(req, res);
  if (url.pathname === "/admin/logout") {
    logout(req, res);
    return redirect(res, "/admin/login");
  }
  const session = requireAdmin(req, res);
  if (!session) return;
  const fields = parseUrlEncoded(await readBody(req, 1024 * 1024));
  if (!verifyCsrf(req, fields.csrf ?? "")) return sendText(res, 403, "CSRF token mismatch");
  if (url.pathname === "/admin/site-settings") updateSite(fields, session.userId);
  if (url.pathname === "/admin/prices") upsertPrice(fields, session.userId);
  if (url.pathname === "/admin/cases") upsertCase(fields, session.userId);
  if (url.pathname === "/admin/faqs") upsertFaq(fields, session.userId);
  redirect(res, "/admin");
}

function renderHome(): string {
  const store = loadStore();
  const cases = published(store.cases).slice(0, 3).map(caseCard).join("");
  return page(`${store.site.brandName} | オリジナルビブス制作`, `${publicHeader()}
<main>
  <section class="hero">
    <div>
      <p class="eyebrow">早期相談・小ロット対応</p>
      <h1>${escapeHtml(store.site.tagline)}</h1>
      <p>${escapeHtml(store.site.description)}</p>
      <div class="actions"><a class="button" href="/price">価格を見る</a><a class="button secondary" href="/cases">制作事例を見る</a><a class="button ghost" href="/contact">無料相談・問い合わせ</a></div>
    </div>
    <div class="product-photo" role="img" aria-label="オリジナルビブスの商品写真プレースホルダー"><span>BIBS</span></div>
  </section>
  <section class="grid three"><article><h2>見やすい番号</h2><p>屋外でも判別しやすい文字サイズを前提に相談できます。</p></article><article><h2>色分け相談</h2><p>チーム、学年、役割ごとの使い分けを整理できます。</p></article><article><h2>画像添付</h2><p>ロゴ、参考画像、PDFを問い合わせ時に添付できます。</p></article></section>
  <section><h2>制作事例</h2><div class="case-grid">${cases}</div></section>
  ${cta()}
</main>${publicFooter()}`, { canonical: `${config.baseUrl}/` });
}

function renderFeatures(): string {
  return page("商品・特徴", `${publicHeader()}<main class="narrow"><h1>商品・特徴</h1><p>軽量で扱いやすいビブスを、用途に合わせた色、番号、文字入れで相談できます。</p><div class="placeholder" role="img" aria-label="商品特徴画像プレースホルダー"></div><ul class="check"><li>番号や役割名を大きく表示</li><li>チームやイベント単位の色分け</li><li>デザイン未定でも相談可能</li></ul>${cta()}</main>${publicFooter()}`);
}

function renderPrice(): string {
  const items = published(loadStore().prices).map((item) => `<article class="price"><h2>${escapeHtml(item.label)}</h2><p class="yen">${item.priceYen.toLocaleString("ja-JP")}円 / ${escapeHtml(item.unit)}</p><p>${escapeHtml(item.description)}</p></article>`).join("");
  return page("価格・サイズ", `${publicHeader()}<main><h1>価格・サイズ</h1><p class="lead">価格は仮情報です。本番公開前に税込/税別、送料、納期を確認してください。</p><section class="grid three">${items}</section>${cta()}</main>${publicFooter()}`);
}

function renderCases(): string {
  return page("制作事例", `${publicHeader()}<main><h1>制作事例</h1><div class="case-grid">${published(loadStore().cases).map(caseCard).join("")}</div>${cta()}</main>${publicFooter()}`);
}

function renderCaseDetail(id: string): string {
  const item = published(loadStore().cases).find((entry) => entry.id === id);
  if (!item) return page("制作事例が見つかりません", `${publicHeader()}<main class="narrow"><h1>制作事例が見つかりません</h1></main>${publicFooter()}`);
  return page(item.title, `${publicHeader()}<main class="narrow"><p><a href="/cases">制作事例一覧へ</a></p><div class="placeholder" role="img" aria-label="${escapeHtml(item.imageAlt)}"></div><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.body)}</p>${cta()}</main>${publicFooter()}`);
}

function renderFlow(): string {
  const steps = ["問い合わせ", "内容確認", "見積り・デザイン確認", "注文確定", "入金・製造・発送"].map((step, index) => `<li><strong>${index + 1}. ${step}</strong><p>${index < 3 ? "初期版サイト上で案内します。" : "既存業務で処理します。"}</p></li>`).join("");
  return page("注文の流れ", `${publicHeader()}<main class="narrow"><h1>注文の流れ</h1><ol class="steps">${steps}</ol>${cta()}</main>${publicFooter()}`);
}

function renderFaq(): string {
  const faqs = published(loadStore().faqs).sort((a, b) => a.sortOrder - b.sortOrder).map((faq) => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`).join("");
  return page("FAQ・注意事項", `${publicHeader()}<main class="narrow"><h1>FAQ・注意事項</h1>${faqs}<section class="notice"><h2>注意事項</h2>${published(loadStore().notices).map((n) => `<p><strong>${escapeHtml(n.title)}:</strong> ${escapeHtml(n.body)}</p>`).join("")}</section>${cta()}</main>${publicFooter()}`);
}

function renderPrivacy(): string {
  const site = loadStore().site;
  return page("プライバシーポリシー", `${publicHeader()}<main class="narrow"><h1>プライバシーポリシー</h1><p>${escapeHtml(site.privacyPolicy)}</p></main>${publicFooter()}`);
}

function renderContact(values: Record<string, string> = {}, errors: Record<string, string> = {}, csrf: string): string {
  const err = (key: string) => errors[key] ? `<p class="field-error">${escapeHtml(errors[key])}</p>` : "";
  return page("無料相談・問い合わせ", `${publicHeader()}<main class="narrow"><h1>無料相談・問い合わせ</h1>${errors.form ? `<p class="error">${escapeHtml(errors.form)}</p>` : ""}<form class="form" method="post" action="/contact" enctype="multipart/form-data">
    <input type="hidden" name="csrf" value="${escapeHtml(csrf)}"><label class="hp">入力しないでください<input name="website" tabindex="-1" autocomplete="off"></label>
    <label>お名前 <input name="name" required maxlength="80" value="${escapeHtml(values.name)}">${err("name")}</label>
    <label>メールアドレスまたは電話番号 <input name="emailOrPhone" required value="${escapeHtml(values.emailOrPhone)}">${err("emailOrPhone")}</label>
    <label>希望数量 <input name="quantity" type="number" min="1" max="9999" required value="${escapeHtml(values.quantity ?? "10")}">${err("quantity")}</label>
    <label>希望時期 <input name="desiredDate" maxlength="80" value="${escapeHtml(values.desiredDate)}">${err("desiredDate")}</label>
    <label>デザイン準備状況 <select name="designStatus"><option value="undecided">未定</option><option value="rough">ラフあり</option><option value="ready">入稿データあり</option></select>${err("designStatus")}</label>
    <label>問い合わせ内容 <textarea name="message" maxlength="2000">${escapeHtml(values.message)}</textarea>${err("message")}</label>
    <label>画像またはPDF <input name="files" type="file" multiple accept="image/jpeg,image/png,application/pdf"></label>
    <label class="checkline"><input type="checkbox" name="consent" value="yes"> 個人情報の取り扱いに同意します</label>${err("consent")}
    <button class="button" type="submit">送信する</button>
  </form></main>${publicFooter()}`);
}

function renderThanks(id: string): string {
  return page("送信完了", `${publicHeader()}<main class="narrow"><h1>送信完了</h1><p>お問い合わせを受け付けました。</p><p>受付番号: <strong>${escapeHtml(id)}</strong></p><p>担当者が内容を確認して連絡します。</p><a class="button" href="/">トップへ戻る</a></main>${publicFooter()}`);
}

function renderLogin(error = ""): string {
  return page("管理者ログイン", `<main class="admin-login"><form method="post" action="/admin/login" class="panel"><h1>管理者ログイン</h1>${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}<label>メール<input name="email" type="email" required></label><label>パスワード<input name="password" type="password" required></label><button class="button" type="submit">ログイン</button></form></main>`, { noindex: true });
}

function renderAdmin(csrf: string): string {
  const store = loadStore();
  return page("管理画面", `<main class="admin"><header><h1>管理画面</h1><form method="post" action="/admin/logout"><button>ログアウト</button></form></header>
  <section class="panel"><h2>サイト基本情報</h2><form method="post" action="/admin/site-settings" class="form compact"><input type="hidden" name="csrf" value="${csrf}">${input("brandName", store.site.brandName)}${input("tagline", store.site.tagline)}${textarea("description", store.site.description)}${input("companyName", store.site.companyName)}${input("contactEmail", store.site.contactEmail)}${input("businessHours", store.site.businessHours)}${textarea("privacyPolicy", store.site.privacyPolicy)}${textarea("termsNote", store.site.termsNote)}<button class="button">保存</button></form></section>
  <section class="panel"><h2>問い合わせ</h2>${store.inquiries.length === 0 ? "<p>まだ問い合わせはありません。</p>" : `<table><thead><tr><th>受付番号</th><th>数量</th><th>状態</th><th>添付</th><th>日時</th></tr></thead><tbody>${store.inquiries.map((inq) => `<tr><td>${escapeHtml(inq.publicId)}</td><td>${inq.quantity}</td><td>${inq.mailStatus}</td><td>${store.attachments.filter((a) => a.inquiryId === inq.id).map((a) => `<a href="/admin/attachments/${a.id}">${escapeHtml(a.originalName)}</a>`).join("<br>")}</td><td>${escapeHtml(inq.createdAt)}</td></tr>`).join("")}</tbody></table>`}</section>
  <section class="panel"><h2>価格</h2>${adminPriceForms(store.prices, csrf)}</section>
  <section class="panel"><h2>制作事例</h2>${adminCaseForms(store.cases, csrf)}</section>
  <section class="panel"><h2>FAQ</h2>${adminFaqForms(store.faqs, csrf)}</section>
  </main>`, { noindex: true });
}

async function submitContact(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const ip = req.socket.remoteAddress ?? "unknown";
  if (!rateLimit(`contact:${ip}`, 10, 60 * 60 * 1000)) return sendText(res, 429, "送信回数が多すぎます。時間をおいて再度お試しください。");
  const body = await readBody(req);
  const parsed = parseMultipart(req.headers["content-type"] ?? "", body);
  if (!verifyPublicCsrf(req, parsed.fields.csrf ?? "")) return sendText(res, 403, "CSRF token mismatch");
  const input = normalizeContact(parsed.fields);
  const errors = validateContact(input);
  const storedFiles = validateAndStoreFiles(parsed.files.filter((file) => file.data.length > 0));
  const fileError = storedFiles.find((item) => !item.ok);
  if (fileError && !fileError.ok) errors.files = fileError.error;
  if (hasErrors(errors)) return sendHtml(res, 400, renderContact(parsed.fields, errors, csrfPublic(req, res)));
  const id = createId();
  const publicId = `INQ-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.floor(100000 + Math.random() * 900000)}`;
  const createdAt = nowIso();
  const metas = storedFiles.flatMap((item) => item.ok ? [{ ...item.meta, inquiryId: id, createdAt }] : []);
  const inquiry = { id, publicId, name: input.name, emailOrPhone: input.emailOrPhone, quantity: input.quantity, desiredDate: input.desiredDate, designStatus: input.designStatus, message: input.message, consent: input.consent, mailStatus: "pending" as const, createdAt, updatedAt: createdAt };
  const sent = sendInquiryMails(inquiry, metas);
  updateStore((data) => {
    data.inquiries.push({ ...inquiry, mailStatus: sent ? "sent" : "failed" });
    data.attachments.push(...metas);
  });
  log("info", "inquiry_created", { inquiryId: id, attachmentCount: metas.length, mailStatus: sent ? "sent" : "failed" });
  redirect(res, `/contact/thanks?id=${encodeURIComponent(publicId)}`);
}

async function submitLogin(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const fields = parseUrlEncoded(await readBody(req, 1024 * 1024));
  const user = findAdmin(fields.email ?? "");
  if (!user || (user.lockedUntil && Date.parse(user.lockedUntil) > Date.now()) || !verifyPassword(fields.password ?? "", user.passwordHash)) {
    if (user) updateStore((data) => {
      const target = data.adminUsers.find((entry) => entry.id === user.id);
      if (target) {
        target.failedCount += 1;
        if (target.failedCount >= 5) target.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
    });
    return sendHtml(res, 401, renderLogin("ログイン情報を確認してください。"));
  }
  updateStore((data) => {
    const target = data.adminUsers.find((entry) => entry.id === user.id);
    if (target) { target.failedCount = 0; target.lockedUntil = null; }
  });
  res.setHeader("Set-Cookie", cookieHeader("admin_session", createSession(user.id), 30 * 60));
  redirect(res, "/admin");
}

function normalizeContact(fields: Record<string, string>): ContactInput {
  return {
    name: sanitizeText(fields.name, 80),
    emailOrPhone: sanitizeText(fields.emailOrPhone, 120),
    quantity: Number(fields.quantity),
    desiredDate: sanitizeText(fields.desiredDate, 80),
    designStatus: sanitizeText(fields.designStatus, 20),
    message: sanitizeText(fields.message, 2000),
    consent: fields.consent === "yes",
    honeypot: fields.website ?? ""
  };
}

function csrfPublic(req: IncomingMessage, res: ServerResponse): string {
  const token = req.headers.cookie?.match(/public_csrf=([^;]+)/)?.[1] ?? createId();
  res.setHeader("Set-Cookie", `public_csrf=${token}; SameSite=Lax; Path=/; Max-Age=3600`);
  return token;
}

function verifyPublicCsrf(req: IncomingMessage, token: string): boolean {
  return Boolean(token && req.headers.cookie?.includes(`public_csrf=${token}`));
}

function caseCard(item: CaseStudy): string {
  return `<article class="case-card"><div class="placeholder small" role="img" aria-label="${escapeHtml(item.imageAlt)}"></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p><a href="/cases/${escapeHtml(item.id)}">詳細を見る</a></article>`;
}

function ensureAdmin(): void {
  updateStore((data) => {
    if (data.adminUsers.length === 0) {
      const now = nowIso();
      data.adminUsers.push({ id: createId(), email: config.adminEmail, passwordHash: hashPassword(config.adminPassword), failedCount: 0, lockedUntil: null, createdAt: now, updatedAt: now });
    }
  });
}

function updateSite(fields: Record<string, string>, actorId: string): void {
  updateStore((data) => {
    data.site = { brandName: sanitizeText(fields.brandName, 80), tagline: sanitizeText(fields.tagline, 160), description: sanitizeText(fields.description, 500), companyName: sanitizeText(fields.companyName, 120), contactEmail: sanitizeText(fields.contactEmail, 120), businessHours: sanitizeText(fields.businessHours, 120), privacyPolicy: sanitizeText(fields.privacyPolicy, 2000), termsNote: sanitizeText(fields.termsNote, 1000) };
    data.auditLogs.push({ id: createId(), actorId, action: "update", target: "site_settings", summary: "サイト基本情報を更新", createdAt: nowIso() });
  });
}

function upsertPrice(fields: Record<string, string>, actorId: string): void {
  upsert(fields, actorId, "price_items", (id) => ({ id, label: sanitizeText(fields.label, 80), priceYen: Number(fields.priceYen), unit: sanitizeText(fields.unit, 40), description: sanitizeText(fields.description, 300), status: fields.status === "draft" ? "draft" : "published" as const }));
}

function upsertCase(fields: Record<string, string>, actorId: string): void {
  upsert(fields, actorId, "case_studies", (id) => ({ id, title: sanitizeText(fields.title, 100), category: sanitizeText(fields.category, 60), summary: sanitizeText(fields.summary, 240), body: sanitizeText(fields.body, 1200), imageAlt: sanitizeText(fields.imageAlt, 140), status: fields.status === "draft" ? "draft" : "published" as const }));
}

function upsertFaq(fields: Record<string, string>, actorId: string): void {
  upsert(fields, actorId, "faqs", (id) => ({ id, question: sanitizeText(fields.question, 160), answer: sanitizeText(fields.answer, 800), sortOrder: Number(fields.sortOrder), status: fields.status === "draft" ? "draft" : "published" as const }));
}

function upsert<T extends { id: string }>(fields: Record<string, string>, actorId: string, target: string, make: (id: string) => T): void {
  updateStore((data) => {
    const id = sanitizeText(fields.id, 80) || createId();
    const item = make(id);
    const list = target === "price_items" ? data.prices : target === "case_studies" ? data.cases : data.faqs;
    const index = list.findIndex((entry) => entry.id === id);
    if (index >= 0) Object.assign(list[index], item);
    else (list as T[]).push(item);
    data.auditLogs.push({ id: createId(), actorId, action: "upsert", target, summary: `${target}を更新`, createdAt: nowIso() });
  });
}

function adminPriceForms(items: PriceItem[], csrf: string): string {
  return items.map((item) => `<form method="post" action="/admin/prices" class="inline-form"><input type="hidden" name="csrf" value="${csrf}">${input("id", item.id)}${input("label", item.label)}${input("priceYen", String(item.priceYen))}${input("unit", item.unit)}${input("description", item.description)}${selectStatus(item.status)}<button>保存</button></form>`).join("");
}

function adminCaseForms(items: CaseStudy[], csrf: string): string {
  return items.map((item) => `<form method="post" action="/admin/cases" class="inline-form"><input type="hidden" name="csrf" value="${csrf}">${input("id", item.id)}${input("title", item.title)}${input("category", item.category)}${input("summary", item.summary)}${textarea("body", item.body)}${input("imageAlt", item.imageAlt)}${selectStatus(item.status)}<button>保存</button></form>`).join("");
}

function adminFaqForms(items: Faq[], csrf: string): string {
  return items.map((item) => `<form method="post" action="/admin/faqs" class="inline-form"><input type="hidden" name="csrf" value="${csrf}">${input("id", item.id)}${input("question", item.question)}${textarea("answer", item.answer)}${input("sortOrder", String(item.sortOrder))}${selectStatus(item.status)}<button>保存</button></form>`).join("");
}

function input(name: string, value: string): string {
  return `<label>${escapeHtml(name)}<input name="${escapeHtml(name)}" value="${escapeHtml(value)}"></label>`;
}
function textarea(name: string, value: string): string {
  return `<label>${escapeHtml(name)}<textarea name="${escapeHtml(name)}">${escapeHtml(value)}</textarea></label>`;
}
function selectStatus(status: string): string {
  return `<label>status<select name="status"><option value="published"${status === "published" ? " selected" : ""}>published</option><option value="draft"${status === "draft" ? " selected" : ""}>draft</option></select></label>`;
}

function renderSitemap(): string {
  const urls = ["/", "/features", "/price", "/cases", "/flow", "/faq", "/contact", "/privacy", ...published(loadStore().cases).map((item) => `/cases/${item.id}`)];
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${config.baseUrl}${path}</loc></url>`).join("")}</urlset>`;
}

async function serveStatic(url: URL, res: ServerResponse): Promise<boolean> {
  const files: Record<string, { path: string; type: string }> = {
    "/styles.css": { path: "public/styles.css", type: "text/css; charset=utf-8" },
    "/favicon.svg": { path: "public/favicon.svg", type: "image/svg+xml" }
  };
  const file = files[url.pathname];
  if (!file || !existsSync(file.path)) return false;
  res.writeHead(200, { "Content-Type": file.type });
  res.end(readFileSync(file.path));
  return true;
}

function serveAttachment(res: ServerResponse, attachmentId: string): void {
  const attachment = loadStore().attachments.find((item) => item.id === attachmentId);
  if (!attachment) return sendText(res, 404, "Not Found");
  const path = join(config.uploadDir, attachment.storedName);
  if (!existsSync(path)) return sendText(res, 404, "Not Found");
  res.writeHead(200, { "Content-Type": attachment.mimeType, "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.originalName)}"` });
  res.end(readFileSync(path));
}

function redirect(res: ServerResponse, location: string): void {
  res.writeHead(303, { Location: location });
  res.end();
}
function sendHtml(res: ServerResponse, status: number, html: string): void {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}
function sendText(res: ServerResponse, status: number, text: string): void {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}
function sendXml(res: ServerResponse, xml: string): void {
  res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8" });
  res.end(xml);
}
