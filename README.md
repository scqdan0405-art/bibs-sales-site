# 商品販売サイト 初期版

商品紹介から問い合わせ獲得までを担う、早期公開向けMVPです。会員登録、決済、注文管理、見積書作成、在庫管理は初期版スコープ外です。

## 技術構成

- Runtime: Node.js 24
- Language: TypeScript（Nodeの型構文実行機能を利用）
- Server: Node標準 `http`
- Storage: 初期版はJSON永続化、DB移行用SQLを `prisma/migrations` に配置
- Tests: Node標準 `node:test`

外部依存を追加しないため、短時間で起動・検証できます。

## 初期セットアップ

```bash
copy .env.example .env
node scripts/init-admin.ts
npm run dev
```

PowerShellで `npm.ps1` が実行ポリシーにより止まる場合は、`npm.cmd run dev` を使用してください。

## 環境変数

- `APP_BASE_URL`: サイトURL
- `APP_PORT`: 起動ポート
- `SESSION_SECRET`: セッション署名用秘密値
- `ADMIN_EMAIL`: 初期管理者メール
- `ADMIN_PASSWORD`: 初期管理者パスワード
- `MAIL_FROM`: 顧客自動返信の送信元
- `MAIL_ADMIN_TO`: 管理者通知先
- `UPLOAD_DIR`: 非公開アップロード保存先
- `UPLOAD_RETENTION_DAYS`: 添付保持日数
- `LOG_RETENTION_DAYS`: ログ保持日数
- `ANALYTICS_ID`: 任意の計測ID

## DB作成・マイグレーション

初期版の実行は `data/store.json` を使用します。正式DBへ移行する場合は、`prisma/migrations/001_initial.sql` を適用してください。主キーはUUID、価格は整数、公開状態は `draft/published` です。

## 起動

```bash
npm.cmd run dev
```

公開ページ: `http://localhost:3000/`

管理画面: `http://localhost:3000/admin/login`

## テスト・検証

```bash
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

GitHub Actionsでも同じ検証を実行します。詳細は `docs/GITHUB_RELEASE_PREP.md` を参照してください。

## メール設定

初期版ではメール送信を `data/mail-outbox.json` に記録します。本番では `src/lib/mail.ts` の `MailAdapter` をSMTPまたは送信APIに差し替え、SPF/DKIM/DMARCを設定してください。顧客メールをFromに設定せず、検証済みの場合のみReply-Toへ設定します。

## ファイル保存設定

添付はWeb公開外の `data/uploads` にUUIDファイル名で保存されます。JPEG、PNG、PDFのみ許可し、MIME、拡張子、ファイルシグネチャを検証します。PDF取得時は `Content-Disposition: attachment` を付与します。

## バックアップ・復元

日次で `data/store.json`、`data/mail-outbox.json`、`data/uploads` をバックアップしてください。最低7世代を保持し、月1回復元テストを実施してください。復元はアプリ停止、バックアップファイルの配置、起動、問い合わせと管理画面の確認の順で行います。

## 本番公開前チェック

`docs/PRODUCTION_CHECKLIST.md` を確認してください。仮画像、価格、送料、納期、キャンセル条件、通知先、プライバシーポリシー、SSL、バックアップ、管理者パスワードの確認が必要です。
