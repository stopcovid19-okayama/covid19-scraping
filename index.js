const cheerio = require('cheerio')
const csvParse = require('csv-parse/lib/sync')
const fs = require("fs")
const iconv = require('iconv').Iconv;
const moment = require('moment')
const pdfParse = require('pdf-parse');
const superagent = require('superagent')

const dateRE = new RegExp(/[0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2}/) // ガバガバなので注意

function numRound(value, base) {
  return Math.round(value * base) / base;
}

function toHalfWidth(str) {
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
}

function toAD(warei) {
  let [, era, year] = warei.match(/^(明治|大正|昭和|平成|令和)([元\d]+)年?/, match => {
    if (match === '元') return 1
  })

  if (era === undefined) throw new Error('Not japanese calendar')

  year = Number(year)

  if (era === '明治') {
    year += 1867;
  } else if (era === '大正') {
    year += 1911;
  } else if (era === '昭和') {
    year += 1925;
  } else if (era === '平成') {
    year += 1988;
  } else if (era === '令和') {
    year += 2018;
  }

  return year;
}

function csvToObj(csv) {
  const csvObj = csvParse(csv, { columns: true, skip_empty_lines: true })
  const dateKey = '集計時点_年月日' in csvObj[0] ? '集計時点_年月日' : '公表年月日'

  let notifyFlag = false

  const data = csvObj
    .map(row => ({
      ...row,
      [dateKey]: moment(row[dateKey], dateRE.test(row[dateKey]) ? 'YYYY/M/D' : 'M月D日')
    }))
    .filter(row => {
      const isValid = row[dateKey].isValid()
      if (isValid === false) notifyFlag = true

      return isValid
    })
    .sort((a, b) => a[dateKey] - b[dateKey])

  // この非同期処理待たないので注意
  superagent
    .post(process.env.SLACK_WEBHOOK_URL)
    .send({
      text: '空行を検出',
    })
    .then()

  return data
}

const opendata = [
  {
    name: 'contacts',
    csv: 'http://www.okayama-opendata.jp/ckan/dataset/e6b3c1d2-2f1f-4735-b36e-e45d36d94761/resource/165b2f56-d472-4b71-8c81-f97f898f1923/download',
    transform: async (conf) => {
      const { body: csv } = await superagent(conf.csv).responseType('blob')
      const csvObj = csvToObj(new iconv('SHIFT_JIS', 'UTF-8').convert(csv).toString())

      return {
        date: conf.now.isAfter(csvObj[csvObj.length - 1].集計時点_年月日.clone().set({ hour: 23, minute: 30 }), 'hour') ? csvObj[csvObj.length - 1].集計時点_年月日.format('YYYY/MM/DD 23:20') : csvObj[csvObj.length - 1].集計時点_年月日.set({ hour: conf.now.hour(), minute: conf.now.minute() }).format('YYYY/MM/DD HH:mm'),
        data: csvObj.map(row => ({
          日付: `${row.集計時点_年月日.format('YYYY-MM-DD')}T08:00:00.000Z`,
          小計: Number(row.相談件数_計)
        }))
      }
    }
  },
  {
    name: 'querents',
    csv: 'http://www.okayama-opendata.jp/ckan/dataset/e6b3c1d2-2f1f-4735-b36e-e45d36d94761/resource/f38ae73f-73c1-4f34-8174-1b188c77c713/download',
    transform: async (conf) => {
      const { body: csv } = await superagent(conf.csv).responseType('blob')
      const csvObj = csvToObj(new iconv('SHIFT_JIS', 'UTF-8').convert(csv).toString())

      return {
        date: conf.now.isAfter(csvObj[csvObj.length - 1].集計時点_年月日.clone().set({ hour: 23, minute: 30 }), 'hour') ? csvObj[csvObj.length - 1].集計時点_年月日.format('YYYY/MM/DD 23:20') : csvObj[csvObj.length - 1].集計時点_年月日.set({ hour: conf.now.hour(), minute: conf.now.minute() }).format('YYYY/MM/DD HH:mm'),
        data: csvObj.map((row, i) => ({
          日付: `${row.集計時点_年月日.format('YYYY-MM-DD')}T08:00:00.000Z`,
          小計: Number(row.相談件数),
          '７日間平均': 0 <= i - 6 ? numRound(csvObj.slice(i - 6, i + 1).reduce((p, c) => p + Number(c.相談件数), 0) / 7, 10) : null
        }))
      }
    }
  },
  {
    name: 'inspections_summary',
    csv: 'http://www.okayama-opendata.jp/ckan/dataset/e6b3c1d2-2f1f-4735-b36e-e45d36d94761/resource/60ecd874-0f71-4d9f-9a8a-936fad9c99bc/download',
    transform: async (conf) => {
      const { body: csv } = await superagent(conf.csv).responseType('blob')
      const csvObj = csvToObj(new iconv('SHIFT_JIS', 'UTF-8').convert(csv).toString())

      return {
        date: conf.now.isAfter(csvObj[csvObj.length - 1].集計時点_年月日.clone().set({ hour: 23, minute: 30 }), 'hour') ? csvObj[csvObj.length - 1].集計時点_年月日.format('YYYY/MM/DD 23:20') : csvObj[csvObj.length - 1].集計時点_年月日.set({ hour: conf.now.hour(), minute: conf.now.minute() }).format('YYYY/MM/DD HH:mm'),
        data: csvObj.map((row, i) => ({
          日付: `${row.集計時点_年月日.format('YYYY-MM-DD')}T08:00:00.000Z`,
          小計: Number(row.検査実施人数),
          '７日間平均': 0 <= i - 6 ? numRound(csvObj.slice(i - 6, i + 1).reduce((p, c) => p + Number(c.検査実施人数), 0) / 7, 10) : null
        }))
      }
    }
  },
  {
    name: 'patients_summary',
    csv: 'http://www.okayama-opendata.jp/ckan/dataset/e6b3c1d2-2f1f-4735-b36e-e45d36d94761/resource/0c728c2e-a366-421d-95df-86b6b5ad15fd/download',
    transform: async (conf) => {
      const { body: csv } = await superagent(conf.csv).responseType('blob')
      const csvObj = csvToObj(new iconv('SHIFT_JIS', 'UTF-8').convert(csv).toString())

      return {
        date: conf.now.isAfter(csvObj[csvObj.length - 1].集計時点_年月日.clone().set({ hour: 23, minute: 30 }), 'hour') ? csvObj[csvObj.length - 1].集計時点_年月日.format('YYYY/MM/DD 23:20') : csvObj[csvObj.length - 1].集計時点_年月日.set({ hour: conf.now.hour(), minute: conf.now.minute() }).format('YYYY/MM/DD HH:mm'),
        data: csvObj.map((row, i) => ({
          日付: `${row.集計時点_年月日.format('YYYY-MM-DD')}T08:00:00.000Z`,
          小計: Number(row.日別の感染者数),
          '７日間平均': 0 <= i - 6 ? numRound(csvObj.slice(i - 6, i + 1).reduce((p, c) => p + Number(c.日別の感染者数), 0) / 7, 10) : null
        }))
      }
    }
  },
  {
    name: 'patients',
    csv: 'http://www.okayama-opendata.jp/ckan/dataset/e6b3c1d2-2f1f-4735-b36e-e45d36d94761/resource/c6503ebc-b2e9-414c-aae7-7374f4801e21/download',
    transform: async (conf) => {
      const { body: csv } = await superagent(conf.csv).responseType('blob')
      const csvObj = csvToObj(new iconv('SHIFT_JIS', 'UTF-8').convert(csv).toString())

      return {
        date: conf.now.isAfter(csvObj[csvObj.length - 1].公表年月日.clone().set({ hour: 23, minute: 30 }), 'hour') ? csvObj[csvObj.length - 1].公表年月日.format('YYYY/MM/DD 23:20') : csvObj[csvObj.length - 1].公表年月日.set({ hour: conf.now.hour(), minute: conf.now.minute() }).format('YYYY/MM/DD HH:mm'),
        data: csvObj.map(row => ({
          リリース日: `${row.公表年月日.format('YYYY-MM-DD')}T08:00:00.000Z`,
          居住地: row.患者＿居住地,
          年代: row.患者＿年代,
          性別: row.患者＿性別,
          退院: "",
          date: row.公表年月日.format('YYYY-MM-DD')
        }))
      }
    }
  },
  {
    name: 'positive_rate',
    transform: async (conf) => {
      const inspectionsSummary = require('./data/inspections_summary.json').data
      const patientsSummary = require('./data/patients_summary.json').data

      return {
        last_update: conf.now.format('YYYY/MM/DD HH:mm'),
        data: inspectionsSummary
          .map(iS => {
            const pS = patientsSummary.find(pS => pS.日付 === iS.日付)

            if (pS === undefined) return

            return {
              diagnosed_date: iS.日付,
              positive_count: pS.小計,
              negative_count: iS.小計 - pS.小計,
              positive_rate: numRound(pS['７日間平均'] / iS['７日間平均'] * 100, 10),
              weekly_average_diagnosed_count: iS['７日間平均']
            }
          })
          .filter(pR => pR !== undefined)
      }
    }
  },
  {
    name: 'main_summary',
    url: 'https://www.pref.okayama.jp/page/645925.html',
    transform: async (conf) => {
      const inspectionsSummary = require('./data/inspections_summary.json').data
      const patients = require('./data/patients.json').data

      const { text: html } = await superagent(conf.url)
      const $ = cheerio.load(html)
      const tds = $('#main_body > div:nth-child(2) > table > tbody > tr:nth-child(3)').find('td').toArray()
      const siteData = tds.map(td => Number(toHalfWidth(td.firstChild.nodeValue)))

      return {
        last_update: conf.now.format('YYYY/MM/DD HH:mm'),
        attr: '検査実施人数',
        value: inspectionsSummary.reduce((total, row) => total + row.小計, 0),
        children: [
          {
            attr: '陽性患者数',
            value: patients.length,
            children: [
              {
                attr: '入院調整中',
                value: patients.length - (siteData[1] + siteData[2] + siteData[3])
              },
              {
                attr: '入院中',
                value: siteData[1]
              },
              {
                attr: '宿泊療養施設に入所中',
                value: siteData[2]
              },
              {
                attr: '退院',
                value: siteData[3]
              },
              {
                attr: '死亡',
                value: 0 // オープンデータが無い
              }
            ]
          }
        ]
      }
    }
  },
  {
    name: 'medical_system',
    url: 'https://www.pref.okayama.jp/page/645925.html',
    transform: async (conf) => {
      const { text: html } = await superagent(conf.url)
      const $ = cheerio.load(html)
      const row = $($('#main_body > div:nth-child(2)').find('p').toArray().find(el => /^５ 医療体制整備状況/.test($(el).text()))).text().split(/　　\(\d\)/)

      const [, rawDate] = toHalfWidth(row[0]).match(/（(.+)現在）$/) // 日付

      const RE = /(\d+)[床|室|台]/
      const [, bed] = toHalfWidth(row[1]).match(RE) // 確保病床
      const [, stayCareFacility] = toHalfWidth(row[2]).match(RE) // 宿泊療養施設
      const [, ventilator] = toHalfWidth(row[3]).match(RE) // 人工呼吸器
      const [, ecmo] = toHalfWidth(row[4]).match(RE) // ECMO

      return {
        date: moment(`${toAD(rawDate)}年${rawDate.match(/\d+月\d+日/)[0]}`, 'YYYY年M月D日').format('YYYY/MM/DD 00:00'),
        items: {
          bed: Number(bed),
          stay_care_facility: Number(stayCareFacility),
          ventilator: Number(ventilator),
          ecmo: Number(ecmo)
        }
      }
    }
  },
  {
    name: 'news',
    url: 'http://fight-okayama.jp/',
    transform: async (conf) => {
      const { text: html } = await superagent(conf.url)
      const $ = cheerio.load(html)
      const items =
        $('body > main > section.section.news > div > ul')
          .children()
          .map((i, el) => ({
            date: moment(el.children[0].children[0].children[0].nodeValue, 'YYYY/MM/DD'),
            url: el.children[0].attribs.href,
            text: el.children[0].children[1].children[0].nodeValue
          }))
          .toArray()
          .sort((a, b) => a.date - b.date)
          .map(row => ({
            ...row,
            date: row.date.format('YYYY/MM/DD')
          }))

      return {
        newsItems: items.slice(-3).reverse()
      }
    }
  },
  {
    name: 'last_update',
    transform: async (conf) => {
      return {
        date: conf.now.format('YYYY/MM/DD HH:mm'),
      }
    }
  },
];

(async () => {
  for (const conf of opendata) {
    console.log('processing:', conf.name)
    const data = await conf.transform({ ...conf, now: moment() })
    fs.writeFileSync(`data/${conf.name}.json`, `${JSON.stringify(data, undefined, 4)}\n`);
  }

  fs.statSync('data/last_update.json')
})().catch(e => {
  console.error(e);
  process.exit(1);
})
