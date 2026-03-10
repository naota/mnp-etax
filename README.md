# Linux (non-Windows) 上でマイナカードやマイナポータル・e-Taxなどのサイトを活用するためのメモ書き

ここに書かれていることの一切は無保証であり, 活用する場合は各自の責任と十分な理解に基づいて判断してください.

## User-Agentの偽装

マイナポータルなどでは User-Agent を見てサービスを拒否されることがあります. その場合, User-Agent の擬装が必要です.

Developer Toolsを使う方法として以下が紹介されています.

[Linux で 確定申告 2024年度版](https://qiita.com/nanbuwks/items/3ceb0b3f8e15a8aa3dbf)

別の方法としては, ローカルで chrome拡張をいれる方法があります. うまく動けば, Developer Tools を開くことなくシームレスにアクセスができます. 一例として以下のような chrome 拡張の導入で書きかえが可能です.

https://github.com/naota/mnp-etax/tree/main/winfake

## myna - マイナンバーカード・ユーティリティ

Goで書かれたマイナカードの操作ユーティリティ

https://github.com/jpki/myna

## NativeMessagingHosts

マイナポータルの Chrome 拡張は NativeMessagingHosts によってネイティブアプリと通信します. これは以下のファイルにより設定することができます.

```
$ cat .config/google-chrome/NativeMessagingHosts/jp.go.myna.json
{
    "name" : "jp.go.myna",
    "description" : "MynumberPortal",
    "path" : "<実行するプログラムパス>",
    "type" : "stdio",
    "allowed_origins" : ["chrome-extension://<マイナポータルのChrome拡張ID>/"]
}
```

拡張のIDは `chrome://extensions/` から確認することができます.

### プログラムの指定

NativeMessagingHosts のプログラムは(type=stdioの場合), 標準入出力によって Chrome拡張とのデータのやりとりを行います. そこで以下のようなスクリプトを指定することができます.

```bash
#!/bin/bash

LOGDIR="$HOME/tmp/mnp"
mkdir -p "$LOGDIR"

echo "$(date) invoked" > "${LOGDIR}/run.log"
cd "${LOGDIR}"
tee "${LOGDIR}/in.log" | bash my-mnp-login.sh 2>> "${LOGDIR}/run.log" | tee "${LOGDIR}/out.log"
```

## マイナポータルへのログイン

Linux上で, マイナカード(カードリーダ)を用いたマイナポータルへのログインを行います. 正式なプログラムをwineで動かす方法と, mnpを使う方法があります. wineにはpatchが必要です.

## wineによる実行

まず, マイナポータルのプログラムをwine上にインストールします.

そして, たとえば以下のスクリプトを使って正規プログラムをwineで動かすことができます. WINEPREFIXやLOGDIR, "<user>"の適切な置き換えが必要です.

```bash
# 環境にあわせて設定
WINE=$(which wine)
LOGDIR=...
export WINEPREFIX=...

# debug
# export LD_LIBRARY_PATH=/home/naota/src/pcsc-lite-2.3.1/src/.libs
export LC_ALL=ja_JP.utf8

cd "${WINEPREFIX}/drive_c/drive_c/users/<user>/AppData/Local/MPA/Chrome/extension"
tee "${LOGDIR}/in.log" |
	${WINE} ..\\bin\\MPA.exe $* --parent-window=0 2>>"${LOGDIR}/run.log" | tee "${LOGDIR}/out.log"
```

## mnpを使ったログインスクリプト

NativeMessagingHosts は各メッセージを"<4byteのlength><payload>"の形で送受信します. したがって, "od"などを使えばシェルスクリプトでもメッセージを読むことができます.

上記 mnp のユーティリティ(cms署名機能が必要)を用いて, ログインするスクリプトの例を示します. 標準入出力が Chrome 拡張との通信に使われることに注意してください.

```bash
#!/bin/bash

BYTES=$(od -i -N 4 | head -n 1| awk '{print $2}')
echo "BYTES: ${BYTES}" 1>&2

DIGEST=$(dd if=/dev/stdin of=/dev/stdout bs=1 count="${BYTES}" 2>/dev/null | jq -r .digest)
echo "DIGEST: ${DIGEST}" 1>&2

echo "${DIGEST}" | base64 -d > digest.dat

MYNA=${HOME}/src/myna/myna
# なんらかでPASSを設定します
[[ -z "${PASS}" ]] && exit 1
${MYNA} jpki cms signuser -p "${PASS}" --in digest.dat --out signed.dat || exit 1
SIGNATURE=$(base64 -w 0 signed.dat)
CERT=$(${MYNA} jpki cert auth -f der | base64 -w 0)

sed \
	-e "s!REPLACE_SIGNATURE!${SIGNATURE}!" \
	-e "s!REPLACE_CERT!${CERT}!" \
	< template.txt > reply.json

SIZE=$(stat -c %s reply.json)
[[ ${SIZE} -eq 2658 ]] || exit 1
printf "\x62\x0a\0\0"
cat reply.json
```

なお, 実行にはreplyのtemplateが必要となります.
