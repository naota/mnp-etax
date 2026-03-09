# Linux (non-Windows) 上でマイナカードやマイナポータル・e-Taxなどのサイトを活用するためのメモ書き

## myna - マイナンバーカード・ユーティリティ

Goで書かれたマイナカードの操作ユーティリティ

- original: https://github.com/jpki/myna
- マイナポータルログインに必要なsign機能を追加したbranch
  - https://github.com/naota/myna/tree/cms-sign-user

## NativeMessagingHosts

マイナポータルの Chrome 拡張は NativeMessagingHosts によってネイティブアプリと通信します. これは以下のファイルにより設定することができます.

```bash
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

```
#!/bin/bash

LOGDIR="$HOME/tmp/mnp"
mkdir -p "$LOGDIR"

echo "$(date) invoked" > "${LOGDIR}/run.log"
cd "${LOGDIR}"
tee "${LOGDIR}/in.log" | bash my-mnp-login.sh 2>> "${LOGDIR}/run.log" | tee "${LOGDIR}/out.log"
```

### mnpを使ったログインスクリプト

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
