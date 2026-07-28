# テスト報告

最新結果: 2026-07-28

| コマンド | 結果 | メモ |
|---|---|---|
| `npm.cmd run lint` | 成功 | 29 files |
| `npm.cmd run typecheck` | 成功 | 17 files |
| `npm.cmd run test` | 成功 | 5 tests |
| `npm.cmd run build` | 成功 | lint、typecheck、unit/integration |
| HTTP smoke `/` | 成功 | 200 |
| HTTP smoke `/admin/login` | 成功 | 200 |
| HTTP smoke `/sitemap.xml` | 成功 | 200 |
| HTTP smoke `/robots.txt` | 成功 | `/admin` をDisallow |
