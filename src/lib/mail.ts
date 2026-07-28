import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { getConfig } from "./config.ts";
import { type Inquiry, type AttachmentMeta } from "./store.ts";

type MailRecord = { to: string; from: string; replyTo?: string; subject: string; text: string; createdAt: string };
const outboxPath = "data/mail-outbox.json";

export function sendInquiryMails(inquiry: Inquiry, attachments: AttachmentMeta[]): boolean {
  const config = getConfig();
  const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.emailOrPhone) ? inquiry.emailOrPhone : undefined;
  const adminText = [
    `問い合わせ番号: ${inquiry.publicId}`,
    `受付日時: ${inquiry.createdAt}`,
    `希望数量: ${inquiry.quantity}`,
    `希望時期: ${inquiry.desiredDate || "未入力"}`,
    `デザイン準備状況: ${inquiry.designStatus}`,
    `添付ファイル: ${attachments.length}件`,
    "管理画面で詳細を確認してください。"
  ].join("\n");
  const customerText = [
    "お問い合わせを受け付けました。",
    `受付番号: ${inquiry.publicId}`,
    "担当者が内容を確認し、目安として1から2営業日以内に連絡します。",
    "このメールは自動送信です。"
  ].join("\n");
  try {
    appendMail({ to: config.mailAdminTo, from: config.mailFrom, replyTo, subject: `新規問い合わせ ${inquiry.publicId}`, text: adminText, createdAt: new Date().toISOString() });
    if (replyTo) appendMail({ to: replyTo, from: config.mailFrom, subject: `お問い合わせ受付 ${inquiry.publicId}`, text: customerText, createdAt: new Date().toISOString() });
    return true;
  } catch {
    return false;
  }
}

function appendMail(record: MailRecord): void {
  mkdirSync(dirname(outboxPath), { recursive: true });
  const current = existsSync(outboxPath) ? JSON.parse(readFileSync(outboxPath, "utf8")) as MailRecord[] : [];
  current.push(record);
  writeFileSync(outboxPath, JSON.stringify(current, null, 2), "utf8");
}
