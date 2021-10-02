# COVID19 Scraping Script for Okayama

## What 's this?

岡山県公式 HP や岡山県オープンデータカタログサイトで公開されている情報を取得し、JSON として出力するスクリプトです。

[岡山県 新型コロナウイルス感染症対策サイト (非公式)](https://okayama.stopcovid19.jp) で使用する形に整形し、出力します。

## Make data

```
$ npm i
$ npm start
```

## Reference data list

このスクリプトでは、以下のデータを参照し、JSON を出力しています。

| ファイル名               | データの詳細                               | データの参照元                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| contacts.json            | 一般電話相談件数                           | [おかやまオープンデータカタログ data eye](https://www.okayama-opendata.jp/resources/10107)                                                                                  |
| querents.json            | 新型コロナウイルス受診相談センター相談件数 | [おかやまオープンデータカタログ data eye](https://www.okayama-opendata.jp/resources/10108) |
| total_inspections.json   | ＰＣＲ検査実施人数（累計）                 | [おかやまオープンデータカタログ data eye](https://www.okayama-opendata.jp/resources/10109)                            |
| inspections_summary.json | ＰＣＲ検査実施人数（県環境保健センター分） | [おかやまオープンデータカタログ data eye](https://www.okayama-opendata.jp/resources/10110)                                                                         |
| patients_summary.json    | 感染者数                                   | [おかやまオープンデータカタログ data eye](https://www.okayama-opendata.jp/resources/10111)      |
| patients.json            | 感染者詳細情報                             | [おかやまオープンデータカタログ data eye](https://www.okayama-opendata.jp/resources/10112)                                                                                           |
| main_summary.json        | 患者発生状況                               | [おかやまオープンデータカタログ data eye](https://www.okayama-opendata.jp/resources/10113)                                                                                                    |
| medical_system.json      | 医療体制整備状況                           | [おかやまオープンデータカタログ data eye](https://www.okayama-opendata.jp/resources/10114)                                                                                  |
| news.json                | ニュース(新着情報)                         | [岡山県 - 新型コロナウイルス感染者の発生状況 -](https://fight-okayama.jp/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| last_update.json         | データの最終更新日                         |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## LICENSE

このスクリプトは、[MIT ライセンス](https://github.com/stopcovid19-okayama/covid19-scraping/blob/master/LICENSE)で公開されています。
