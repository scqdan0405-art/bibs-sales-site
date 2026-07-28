# 実装計画

## 採用技術と理由

Node.js 24 と標準ライブラリを採用する。外部依存なしで起動でき、HTTP、暗号化、ファイル、テストを標準機能で実装できるため、早期公開MVPに適している。

## フェーズ

1. 基盤: package、環境変数、ログ、ストア、セキュリティヘッダー
2. 公開画面: トップ、商品、価格、事例、流れ、FAQ、問い合わせ
3. 問い合わせ: 検証、CSRF、レート制限、添付検証、保存、メールアウトボックス
4. 管理画面: ログイン、セッション、コンテンツCRUD、問い合わせ確認
5. SEO・運用: sitemap、robots、404、README、チェックリスト
6. 品質確認: lint、typecheck、unit、integration、build

## DBテーブル一覧

- `site_settings`
- `price_items`
- `case_studies`
- `faqs`
- `notices`
- `inquiries`
- `inquiry_attachments`
- `admin_users`
- `sessions`
- `audit_logs`

## API

- `POST /contact`
- `GET /admin/login`
- `POST /admin/login`
- `POST /admin/logout`
- `GET /admin`
- `POST /admin/site-settings`
- `POST /admin/prices`
- `POST /admin/cases`
- `POST /admin/faqs`
- `GET /admin/attachments/:id`

## フェーズ1で作成・変更するファイル

- `package.json`
- `.env.example`
- `AGENTS.md`
- `docs/*.md`
- `src/server.ts`
- `src/lib/*.ts`
- `public/styles.css`
- `data/seed.json`
- `prisma/migrations/001_initial.sql`
- `tests/**/*.test.ts`
