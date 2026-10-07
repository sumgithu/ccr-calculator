# 薬剤投与設計用 推定Ccr計算機

Cockcroft–Gault式による推定クレアチニンクリアランス（Ccr）を、薬剤投与設計を意識して計算する静的Webサイトです。

## 主な機能

- Cockcroft–Gault式による推定Ccr
- 実測体重（ABW）／理想体重（IBW）／補正体重（AdjBW）の選択
- Devine式によるIBW計算
- Scr +0.2 mg/dLを選択可能（自動適用はしない）
- Ccrの参考区分表示
- 肥満・低体重・高齢・低筋肉量等への注意表示
- CcrとeGFRの違いの説明
- 計算結果のコピー
- 入力条件をURLに保存する共有機能（患者氏名・ID等は保存しない）
- 外部サーバーへ患者情報を送信しないブラウザ内計算

## 計算式

### Cockcroft–Gault式

男性：

`Ccr = (140 − 年齢) × 体重(kg) / (72 × Scr(mg/dL))`

女性：

`上記 × 0.85`

### 理想体重（Devine式）

男性：

`IBW = 50 + 2.3 × (身長[inch] − 60)`

女性：

`IBW = 45.5 + 2.3 × (身長[inch] − 60)`

### 補正体重

`AdjBW = IBW + 0.4 × (ABW − IBW)`

## Scr +0.2 mg/dL

Cockcroft–Gault式はJaffe法で測定されたCrを基に開発されています。日本の資料では、酵素法で測定したScrがJaffe法より約0.2 mg/dL低くなることを踏まえ、0.2 mg/dLを加える方法が記載されています。

本サイトでは、薬剤や資料により扱いが異なることを考慮し、`Scr +0.2 mg/dL` を**選択式**とし、初期設定は補正なしです。

## 注意事項

- 本サイトの値は推定Ccrであり、24時間蓄尿による実測Ccrではありません。
- 肥満では実測体重を使用したC-G式がCcrを過大評価することがあります。体重選択は薬剤・添付文書・臨床研究・患者背景に応じて行ってください。
- 低Scrを0.8 mg/dL等へ自動的に丸める処理は行っていません。
- AKIなど血清Crが急速に変化している場合、推算式の精度が低下します。
- CcrとeGFRは同一ではありません。薬剤ごとに指定された腎機能指標を確認してください。
- 第1版では薬剤別の具体的な投与量を自動提示しません。

## 参考資料

1. Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41. doi:10.1159/000180580. https://pubmed.ncbi.nlm.nih.gov/1244564/
2. PMDA. クレアチニン・クリアランスによる腎機能評価. https://www.pmda.go.jp/files/000239906.pdf
3. 日本腎臓学会. CKD診療ガイドライン2016. https://www.jsn.or.jp/academicinfo/report/CKD-guideline2016.pdf

## GitHub Pagesでの公開

1. GitHubで `ccr-calculator` という新規Repositoryを作成
2. `index.html`、`style.css`、`script.js`、`README.md` をRepositoryのルートへ配置
3. Settings → Pages
4. Sourceを「Deploy from a branch」
5. Branchを `main`、Folderを `/ (root)` に設定
6. Save

## テストケース

男性、60歳、身長170 cm、70 kg、Scr 1.0 mg/dL、ABW使用：

`(140−60)×70/(72×1.0) = 77.8 mL/min`

女性なら、その値に0.85を乗じます。

ABW／IBW／AdjBWの切替、Scr +0.2の切替、不正入力、URL共有、結果コピーも確認してください。
