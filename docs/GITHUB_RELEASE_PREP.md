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
