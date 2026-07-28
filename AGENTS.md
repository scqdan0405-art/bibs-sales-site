# Codex 開発基準

## 目的

`Codex向け_商品販売サイト初期版_詳細仕様書_v1.0.docx` を正式仕様として、商品紹介から問い合わせ獲得までのMVPを実装する。

## 仕様書

- 正式仕様: `Codex向け_商品販売サイト初期版_詳細仕様書_v1.0.docx`
- 管理文書: `docs/ASSUMPTIONS.md`, `docs/PENDING_CONFIRMATIONS.md`, `docs/IMPLEMENTATION_LOG.md`, `docs/TEST_REPORT.md`

## 初期版対象

- 公開ページ
- 問い合わせフォーム
- JPEG/PNG/PDF添付
- 管理者認証
- 管理画面の最小CRUD
- メール通知の抽象化
- SEO、ログ、バックアップ文書
- 自動テスト

## 初期版対象外

会員登録、決済、見積書作成、顧客マスター、注文管理、在庫管理、生産管理、多段階承認、AI生成、多言語対応。

## コーディング規約

- 外部入力は `src/lib/validation.ts` で検証する。
- 秘密情報、実メール、実顧客情報をコードに書かない。
- 添付ファイルはWeb公開外へ保存する。
- 管理ルートは認証、CSRF、noindexを必須にする。
- TypeScriptの `any` を使わない。

## テストコマンド

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test`
- `npm.cmd run build`

## ビルドコマンド

- `npm.cmd run build`

## 静的解析コマンド

- `npm.cmd run lint`
- `npm.cmd run typecheck`

## DBマイグレーション

DB設計変更は `prisma/migrations` にSQLを追加し、復旧方法を `docs/IMPLEMENTATION_LOG.md` へ記録する。

## 環境変数

`.env.example` を更新し、`.env` はGitへ登録しない。

## セキュリティ禁止事項

- 文字列連結SQL
- 顧客入力メールをFromへ設定
- Web公開ディレクトリへの添付保存
- 個人情報の平文ログ出力
- 内部例外、SQL、ファイルパス、スタックトレースの公開API返却

## 完了条件

仕様対象機能、テスト、ビルド、README、未確定事項、既知の問題の記録が揃っていること。
