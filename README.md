# Linux (non-Windows) 上でマイナカードやマイナポータル・e-Taxなどのサイトを活用するためのメモ書き

## myna - マイナンバーカード・ユーティリティ

Goで書かれたマイナカードの操作ユーティリティ

- original: https://github.com/jpki/myna
- マイナポータルログインに必要なsign機能を追加したbranch
  - https://github.com/naota/myna/tree/cms-sign-user

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
