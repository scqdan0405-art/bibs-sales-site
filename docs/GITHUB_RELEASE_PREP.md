# GitHub 公開準備

## 公開してよいもの

- ソースコード
- テスト
- `.env.example`
- 仕様書
- 管理ドキュメント
- マイグレーションSQL
- プレースホルダー画像・文言

## 公開しないもの

- `.env`
- `data/store.json`
- `data/mail-outbox.json`
- `data/uploads/*`
- `logs/*.log`
- 実顧客情報
- 本番メール、SMTP、API、DB、ストレージ認証情報

## 初回GitHubアップロード手順

```bash
git init
git add .
git status
git commit -m "Initial MVP implementation"
git branch -M main
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

## push前チェック

```bash
npm run lint
npm run typecheck
npm test
npm run build
git status --short
git diff --cached --stat
```

GitHub Actionsは `.github/workflows/ci.yml` で同じ検証を実行します。

## GitHub Pagesで担当者確認する

このリポジトリには `.github/workflows/pages.yml` があり、`main` へpushすると公開画面の静的プレビューをGitHub Pagesへデプロイする。

手順:

1. GitHubのリポジトリで `Settings` を開く
2. `Pages` を開く
3. `Build and deployment` の `Source` を `GitHub Actions` にする
4. `Actions` タブで `GitHub Pages Preview` の成功を確認する
5. 表示されたPages URLを担当者へ共有する

このリポジトリ名ではURLは通常、以下の形式になる。

```text
https://scqdan0405-art.github.io/bibs-sales-site/
```

制限:

- 問い合わせ送信は動作しない
- 添付保存は動作しない
- 管理画面ログインは動作しない
- これらは `npm.cmd run dev` でローカル確認、または本番サーバーへデプロイして確認する
