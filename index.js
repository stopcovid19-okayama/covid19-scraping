const cheerio = require("cheerio");
const csvParse = require("csv-parse/lib/sync");
const fs = require("fs");
const iconv = require("iconv").Iconv;
const moment = require("moment");
const superagent = require("superagent");

function numRound(value, base) {
  return Math.round(value * base) / base;
}

function toHalfWidth(str) {
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xfee0)
  );
}

function csvToObj(csv, calcTime = false) {
  const csvObj = csvParse(csv, { columns: true, skip_empty_lines: true });
  const dateKey =
    "集計時点_年月日" in csvObj[0]
      ? "集計時点_年月日"
      : "公表_年月日" in csvObj[0]
      ? "公表_年月日"
      : "公表年月日";

  const data = csvObj
    .map((row) => {
      const date = moment(
        row[dateKey],
        calcTime ? "YYYY/MM/DD HH:mm" : "YYYY/M/D",
        true
      );

      if (date.isValid() === false) throw new Error(`date isn't valid.`);

      return {
        ...row,
        [dateKey]: date,
      };
    })
    .sort((a, b) => a[dateKey] - b[dateKey]);

  return data;
}

const opendata = [
  {
    name: "contacts",
    csv: "https://okayama-pref.dataeye.jp/resource_download/10107",
    transform: async (conf) => {
      const { body: csv } = await superagent(conf.csv).responseType("blob");
      const csvObj = csvToObj(
        new iconv("SHIFT_JIS", "UTF-8").convert(csv).toString()
      );

      return {
        date: conf.now.isAfter(
          csvObj[csvObj.length - 1].集計時点_年月日
            .clone()
            .set({ hour: 23, minute: 30 }),
          "hour"
        )
          ? csvObj[csvObj.length - 1].集計時点_年月日.format("YYYY/MM/DD 23:20")
          : csvObj[csvObj.length - 1].集計時点_年月日
              .set({ hour: conf.now.hour(), minute: conf.now.minute() })
              .format("YYYY/MM/DD HH:mm"),
        data: csvObj.map((row, i) => ({
          日付: `${row.集計時点_年月日.format("YYYY-MM-DD")}T08:00:00.000Z`,
          小計: Number(row.相談件数_計),
          "７日間平均":
            0 <= i - 6
              ? numRound(
                  csvObj
                    .slice(i - 6, i + 1)
                    .reduce((p, c) => p + Number(c.相談件数_計), 0) / 7,
                  10
                )
              : null,
        })),
      };
    },
  },
  {
    name: "querents",
    csv: "https://okayama-pref.dataeye.jp/resource_download/10108",
    transform: async (conf) => {
      const { body: csv } = await superagent(conf.csv).responseType("blob");
      const csvObj = csvToObj(
        new iconv("SHIFT_JIS", "UTF-8").convert(csv).toString()
      );

      return {
        date: conf.now.isAfter(
          csvObj[csvObj.length - 1].集計時点_年月日
            .clone()
            .set({ hour: 23, minute: 30 }),
          "hour"
        )
          ? csvObj[csvObj.length - 1].集計時点_年月日.format("YYYY/MM/DD 23:20")
          : csvObj[csvObj.length - 1].集計時点_年月日
              .set({ hour: conf.now.hour(), minute: conf.now.minute() })
              .format("YYYY/MM/DD HH:mm"),
        data: csvObj.map((row, i) => ({
          日付: `${row.集計時点_年月日.format("YYYY-MM-DD")}T08:00:00.000Z`,
          小計: Number(row.相談件数),
          "７日間平均":
            0 <= i - 6
              ? numRound(
                  csvObj
                    .slice(i - 6, i + 1)
                    .reduce((p, c) => p + Number(c.相談件数), 0) / 7,
                  10
                )
              : null,
        })),
      };
    },
  },
  {
    name: "inspections_summary",
    csv: "https://okayama-pref.dataeye.jp/resource_download/10110",
    transform: async (conf) => {
      const { body: csv } = await superagent(conf.csv).responseType("blob");
      const csvObj = csvToObj(
        new iconv("SHIFT_JIS", "UTF-8").convert(csv).toString()
      );

      return {
        date: conf.now.isAfter(
          csvObj[csvObj.length - 1].集計時点_年月日
            .clone()
            .set({ hour: 23, minute: 30 }),
          "hour"
        )
          ? csvObj[csvObj.length - 1].集計時点_年月日.format("YYYY/MM/DD 23:20")
          : csvObj[csvObj.length - 1].集計時点_年月日
              .set({ hour: conf.now.hour(), minute: conf.now.minute() })
              .format("YYYY/MM/DD HH:mm"),
        data: csvObj.map((row, i) => ({
          日付: `${row.集計時点_年月日.format("YYYY-MM-DD")}T08:00:00.000Z`,
          小計: Number(row.検査実施人数),
          "７日間平均":
            0 <= i - 6
              ? numRound(
                  csvObj
                    .slice(i - 6, i + 1)
                    .reduce((p, c) => p + Number(c.検査実施人数), 0) / 7,
                  10
                )
              : null,
        })),
      };
    },
  },
  {
    name: "patients_summary",
    csv: "https://okayama-pref.dataeye.jp/resource_download/10111",
    transform: async (conf) => {
      const { body: csv } = await superagent(conf.csv).responseType("blob");
      const csvObj = csvToObj(
        new iconv("SHIFT_JIS", "UTF-8").convert(csv).toString()
      );

      return {
        date: conf.now.isAfter(
          csvObj[csvObj.length - 1].集計時点_年月日
            .clone()
            .set({ hour: 23, minute: 30 }),
          "hour"
        )
          ? csvObj[csvObj.length - 1].集計時点_年月日.format("YYYY/MM/DD 23:20")
          : csvObj[csvObj.length - 1].集計時点_年月日
              .set({ hour: conf.now.hour(), minute: conf.now.minute() })
              .format("YYYY/MM/DD HH:mm"),
        data: csvObj.map((row, i) => ({
          日付: `${row.集計時点_年月日.format("YYYY-MM-DD")}T08:00:00.000Z`,
          小計: Number(row.日別の感染者数),
          "７日間平均":
            0 <= i - 6
              ? numRound(
                  csvObj
                    .slice(i - 6, i + 1)
                    .reduce((p, c) => p + Number(c.日別の感染者数), 0) / 7,
                  10
                )
              : null,
        })),
      };
    },
  },
  {
    name: "patients",
    csv: "https://okayama-pref.dataeye.jp/resource_download/10112",
    transform: async (conf) => {
      const { body: csv } = await superagent(conf.csv).responseType("blob");
      const csvObj = csvToObj(
        new iconv("SHIFT_JIS", "UTF-8").convert(csv).toString()
      );

      return {
        date: conf.now.isAfter(
          csvObj[csvObj.length - 1].公表年月日
            .clone()
            .set({ hour: 23, minute: 30 }),
          "hour"
        )
          ? csvObj[csvObj.length - 1].公表年月日.format("YYYY/MM/DD 23:20")
          : csvObj[csvObj.length - 1].公表年月日
              .set({ hour: conf.now.hour(), minute: conf.now.minute() })
              .format("YYYY/MM/DD HH:mm"),
        data: csvObj.map((row) => ({
          リリース日: `${row.公表年月日.format("YYYY-MM-DD")}T08:00:00.000Z`,
          居住地: row.患者＿居住地,
          年代: row.患者＿年代,
          性別: row.患者＿性別,
          date: row.公表年月日.format("YYYY-MM-DD"),
        })),
      };
    },
  },
  {
    name: "age",
    transform: async (conf) => {
      const patients = require("./data/patients.json").data;

      const ageTypes = {
        "10歳未満": 0,
        "10代": 0,
        "20代": 0,
        "30代": 0,
        "40代": 0,
        "50代": 0,
        "60代": 0,
        "70代": 0,
        "80代": 0,
        "90歳以上": 0,
        非公表: 0,
      };

      const sourceValidateAges = [...Object.keys(ageTypes), "未就学児", "ー"];

      patients.forEach((p) => {
        let normalizedAgeType = p.年代;
        if (p.年代 === "90代" || p.年代 === "90代以上")
          normalizedAgeType = "90歳以上";
        if (p.年代 === "未就学児") normalizedAgeType = "10歳未満";
        if (p.年代 === "ー") normalizedAgeType = "非公表";

        // FIXME: patients.jsonに変換する際にやるべき
        // 1箇所でエラー吐かせればActionsは止まるので応急処置
        if (sourceValidateAges.includes(normalizedAgeType) === false)
          throw new Error(`${p.年代} does not know.`);

        ageTypes[normalizedAgeType] += 1;
      });

      return {
        data: ageTypes,
        last_update: conf.now.format("YYYY/MM/DD HH:mm"),
      };
    },
  },
  {
    name: "locale_patients",
    transform: async (conf) => {
      const patients = require("./data/patients.json");

      const districtClassification = {
        県南東部: [
          "岡山市",
          "玉野市",
          "赤磐市",
          "和気町",
          "備前市",
          "瀬戸内市",
          "吉備中央町",
        ],
        県南西部: [
          "倉敷市",
          "笠岡市",
          "井原市",
          "総社市",
          "浅口市",
          "早島超",
          "里庄町",
          "矢掛町",
        ],
        "高梁・新見": ["新見市", "高梁市"],
        真庭: ["真庭市", "新庄村"],
        "津山・英田": [
          "津山市",
          "美作市",
          "鏡野町",
          "勝央町",
          "奈義町",
          "西粟倉村",
          "久米南町",
          "美咲町",
        ],
        非公表: [], // NOTE: 既存の非公表データが無い
      };

      const data = {
        県南東部: 0,
        県南西部: 0,
        "高梁・新見": 0,
        真庭: 0,
        "津山・英田": 0,
        非公表: 0,
        その他: 0,
      };

      patients.data.forEach((row) => {
        const isAssumedData = Object.entries(districtClassification).some(
          ([area, districts]) => {
            if (districts.includes(row.居住地)) {
              data[area] += 1;

              return true;
            }
          }
        );
        if (isAssumedData === false) data.その他 += 1;
      });

      return {
        last_update: patients.date,
        data,
      };
    },
  },
  {
    name: "positive_rate",
    transform: async (conf) => {
      const inspectionsSummary = require("./data/inspections_summary.json")
        .data;
      const patientsSummary = require("./data/patients_summary.json").data;

      return {
        last_update: conf.now.format("YYYY/MM/DD HH:mm"),
        data: inspectionsSummary
          .map((iS) => {
            const pS = patientsSummary.find((pS) => pS.日付 === iS.日付);

            if (pS === undefined) return;

            return {
              diagnosed_date: iS.日付,
              positive_count: pS.小計,
              negative_count: iS.小計 - pS.小計,
              positive_rate: numRound(
                (pS["７日間平均"] / iS["７日間平均"]) * 100,
                10
              ),
              weekly_average_diagnosed_count: iS["７日間平均"],
            };
          })
          .filter((pR) => pR !== undefined),
      };
    },
  },
  {
    name: "main_summary",
    csv: "https://okayama-pref.dataeye.jp/resource_download/10113",
    transform: async (conf) => {
      const inspectionsSummary = require("./data/inspections_summary.json")
        .data;
      const patients = require("./data/patients.json").data;

      const { body: csv } = await superagent(conf.csv).responseType("blob");
      const csvObj = csvToObj(
        new iconv("SHIFT_JIS", "UTF-8").convert(csv).toString()
      );

      const patientOutbreakStatus = csvObj.map((row) => ({
        公表_年月日: `${row.公表_年月日.format("YYYY-MM-DD")}T08:00:00.000Z`,
        延べ数: Number(row.患者_延べ数),
        入院中: Number(row.患者_入院中_入院予定含む),
        重症者: Number(row.患者_入院中のうち重症者),
        宿泊療養施設に入所中: Number(row.患者_宿泊療養施設に入所中),
        自宅療養中: Number(row.患者_自宅療養中),
        退院等: Number(row.患者_退院等),
        死亡: Number(row.患者_死亡),
      }));

      return {
        last_update: conf.now.format("YYYY/MM/DD HH:mm"),
        attr: "検査実施件数",
        value: inspectionsSummary.reduce((total, row) => total + row.小計, 0),
        children: [
          {
            attr: "陽性者数",
            value: patients.length,
            children: patientOutbreakStatus.map((row) =>
              Object.entries(row).map(([attr, value]) => ({ attr, value }))
            ),
          },
        ],
      };
    },
  },
  {
    name: "current_patients",
    transform: async (conf) => {
      const mainSummary = require("./data/main_summary.json");

      const patientOutbreakStatus = mainSummary.children.find(
        ({ attr }) => attr === "陽性者数"
      ).children;
      const patientOutbreakStatusLatestReleaseDate = moment(
        patientOutbreakStatus[patientOutbreakStatus.length - 1].find(
          ({ attr }) => attr === "公表_年月日"
        ).value
      );

      const patientOutbreakStatusKai = patientOutbreakStatus.map((row) =>
        row.reduce((p, { attr, value }) => ({ ...p, [attr]: value }), {})
      );

      return {
        date: conf.now.isAfter(
          patientOutbreakStatusLatestReleaseDate
            .clone()
            .set({ hour: 23, minute: 30 })
        )
          ? patientOutbreakStatusLatestReleaseDate.format("YYYY/MM/DD 23:20")
          : patientOutbreakStatusLatestReleaseDate
              .set({ hour: conf.now.hour(), minute: conf.now.minute() })
              .format("YYYY/MM/DD HH:mm"),
        data: patientOutbreakStatusKai.map((row) => ({
          日付: row.公表_年月日,
          小計: row.延べ数 - (row.退院等 + row.死亡),
        })),
      };
    },
  },
  {
    name: "medical_system",
    csv: "https://okayama-pref.dataeye.jp/resource_download/10114",
    transform: async (conf) => {
      const { body: csv } = await superagent(conf.csv).responseType("blob");
      const csvObj = csvToObj(
        new iconv("SHIFT_JIS", "UTF-8").convert(csv).toString()
      );

      const latestRow = csvObj[csvObj.length - 1];

      return {
        date: latestRow.公表_年月日.format("YYYY/MM/DD 00:00"),
        items: {
          bed: Number(latestRow.確保数_病床),
          stay_care_facility: Number(latestRow.確保数_宿泊療養施設),
          ventilator: Number(latestRow.保有数_人工呼吸器),
          ecmo: Number(latestRow.保有数_ECMO),
        },
      };
    },
  },
  {
    name: "news",
    url: "http://fight-okayama.jp/",
    transform: async (conf) => {
      const { text: html } = await superagent(conf.url);
      const $ = cheerio.load(html);
      const items = $("body > main > section.section.news > div > ul")
        .children()
        .map((i, el) => ({
          date: moment(
            el.firstChild.firstChild.firstChild.nodeValue,
            "YYYY/MM/DD"
          ),
          url: el.firstChild.attribs.href,
          text:
            el.firstChild.children[1].firstChild.nodeValue ||
            el.firstChild.children[1].firstChild.firstChild.nodeValue, // 再帰findの方が良いかもしれない
        }))
        .toArray()
        .sort((a, b) => a.date - b.date)
        .map((row) => ({
          ...row,
          date: row.date.format("YYYY/MM/DD"),
        }));

      return {
        newsItems: items.slice(-3).reverse(),
      };
    },
  },
  {
    name: "analysis",
    csv:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRj9yZL6tK7K6u9GOxoNh9ly_qG2HC8CAQH9f8s-DFgtWBraNTd1il0ogCfF5F-gu-IJDp1Ufz9rXyZ/pub?gid=0&single=true&output=csv",
    transform: async (conf) => {
      const editingFlagCSVURL =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRj9yZL6tK7K6u9GOxoNh9ly_qG2HC8CAQH9f8s-DFgtWBraNTd1il0ogCfF5F-gu-IJDp1Ufz9rXyZ/pub?gid=346801953&single=true&output=csv";
      const { body: editingFlagCSVBuffer } = await superagent(
        editingFlagCSVURL
      ).responseType("blob");
      const editingFlagCSVObj = csvParse(editingFlagCSVBuffer, {
        columns: ["", "description", "value"],
        skip_empty_lines: true,
      });
      if (editingFlagCSVObj[1].value === "TRUE")
        return superagent(
          "https://raw.githubusercontent.com/stopcovid19-okayama/covid19-scraping/gh-pages/analysis.json"
        ).then(({ text }) => JSON.parse(text)); // NOTE: ヘッダーの関係でいい感じにobject化してくれない

      const { body: csv } = await superagent(conf.csv).responseType("blob");
      const csvObj = csvToObj(csv, true);

      return csvObj.map((row) => {
        const date = row.公表_年月日.format("YYYY/MM/DD HH:mm");
        delete row.公表_年月日;

        return {
          data: Object.fromEntries(
            Object.entries(row).map(([column, value]) => {
              const data = Number(value);
              return [column, Number.isNaN(data) ? value : data];
            })
          ),
          date,
        };
      });
    },
  },
  {
    name: "last_update",
    transform: async (conf) => {
      return {
        date: conf.now.format("YYYY/MM/DD HH:mm"),
      };
    },
  },
];

(async () => {
  for (const conf of opendata) {
    console.log("processing:", conf.name);
    try {
      const data = await conf.transform({ ...conf, now: moment() });
      if (data === undefined) continue;
      fs.writeFileSync(
        `data/${conf.name}.json`,
        `${JSON.stringify(data, undefined, 4)}\n`
      );
    } catch (err) {
      console.error(err);
    }
  }

  fs.statSync("data/last_update.json");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
