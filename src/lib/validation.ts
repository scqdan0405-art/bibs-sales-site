export type FieldErrors = Record<string, string>;
export type ContactInput = {
  name: string;
  emailOrPhone: string;
  quantity: number;
  desiredDate: string;
  designStatus: string;
  message: string;
  consent: boolean;
  honeypot: string;
};

export function sanitizeText(value: unknown, maxLength: number): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export function validateContact(input: ContactInput): FieldErrors {
  const errors: FieldErrors = {};
  if (input.honeypot) errors.form = "送信内容を確認できませんでした。時間をおいて再度お試しください。";
  if (input.name.length < 1) errors.name = "お名前を入力してください。";
  if (input.name.length > 80) errors.name = "お名前は80文字以内で入力してください。";
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.emailOrPhone);
  const phone = /^[0-9+()\-\s]{8,20}$/.test(input.emailOrPhone);
  if (!email && !phone) errors.emailOrPhone = "メールアドレスまたは電話番号を正しい形式で入力してください。";
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 9999) errors.quantity = "希望数量は1から9999までの数字で入力してください。";
  if (input.desiredDate.length > 80) errors.desiredDate = "希望時期は80文字以内で入力してください。";
  if (!["undecided", "rough", "ready"].includes(input.designStatus)) errors.designStatus = "デザイン準備状況を選択してください。";
  if (input.message.length > 2000) errors.message = "問い合わせ内容は2000文字以内で入力してください。";
  if (!input.consent) errors.consent = "個人情報の取り扱いに同意してください。";
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
