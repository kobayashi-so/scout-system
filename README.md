# チームGAFAL スカウト作成システム 開発リポジトリ

チームGAFALの開発用リポジトリです。5日間の開発を全員で完走しましょう！

---

## 🛠️ GitHub 導入手順（初日のみ）

1. **Git for Windows のダウンロード**
   * 以下にアクセスしてインストーラーをダウンロードします。
   * https://gitforwindows.org/
   * ※ダウンロード後、英語の設定画面が10回以上続けて出てきますが、すべて最初からチェックが入っている状態（デフォルト）のままで大丈夫です。何も変えずに [Next] をひたすら連打（クリック）して進めてください。

2. **インストールの確認**
   * コマンドプロンプトを開き、以下のコマンドを実行します。
     ```bash
     git --version
     ```
   * 画面に `git version 2.x.x.windows.x` のように数字が出れば、インストール成功です！

3. **初期設定（サインの登録）**
   * 誰がコードを書いたか記録するため、以下の2行を**自分の情報に書き換えて**1行ずつ実行してください。
     ```bash
     git config --global user.name "自分のGitHubアカウント名"
     ```
     ```bash
     git config --global user.email "GitHubに登録しているメールアドレス"
     ```

4. **自分の作業用ブランチを作る（初日のみ）**
   * クローン直後に1回だけ実行（自分の名前に書き換えてください）。
     ```bash
     git checkout -b dev-ito
     ```

---

## ☀️ 朝のルーティン（作業を始める前）

他のメンバーが昨日更新した最新のコードを、自分のパソコンに取り込みます。**毎朝コードを書く前に必ず上から順番に実行してください。**

```bash
# 1. 一度本番ブランチ(main)に切り替える
git checkout main

# 2. GitHubから最新のコードをダウンロードする
git pull origin main

# 3. 自分の開発ブランチに戻る（例: 伊藤さんの場合）
git checkout dev-ito

# 4. 最新のmainのコードを、自分のブランチに合体させる
git merge main


## よく使うコマンド

# 何のファイルを書き換えたか、addできているかをチェック
git status

# 念のため、いま自分が正しいブランチ（dev-〇〇）にいるかもチェック
git branch

# すべての変更ファイルを保存対象にする（最後のドット「 . 」を忘れずに！）
git add .

# メモ（コミットメッセージ）をつけてローカルPCに保存
git commit -m "feat: ログイン画面のUI作成"

# GitHubへアップロード（自分のブランチ名に書き換えてください）
git push origin dev-ito

# ブランチ作成
git checkout -b dev-sora


#nobu

# wslでのprojectsまでの移動コマンド（kobayashi-soは自分のユーザー名）
cd /home/kobayashi-so/projects

伸彦松本のすべらない話

# 今日晩御飯なににしよう　鶏肉買うかあ、、、
