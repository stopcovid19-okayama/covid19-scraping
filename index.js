const cheerio = require('cheerio')
const csvParse = require('csv-parse/lib/sync')
const fs = require("fs")
const iconv = require('iconv').Iconv;
const moment = require('moment')
const pdfParse = require('pdf-parse');
const superagent = require('superagent')

const dateRE = new RegExp(/[0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2}/) // ガバガバなので注意

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
  let dateKey

  const csvObj = csvParse(csv, { columns: true, skip_empty_lines: true })
    .map(row => {
      dateKey = '集計時点_年月日' in row ? '集計時点_年月日' : '公表年月日' // 大した件数ではないので妥協

      return {
        ...row, [dateKey]: moment(row[dateKey], dateRE.test(row[dateKey]) ? 'YYYY/M/D' : 'M月D日')
      }
    })
    .sort((a, b) => a[dateKey] - b[dateKey])

  return csvObj
}

const opendata = [
  {
    name: 'contacts',
    csv: 'http://www.okayama-opendata.jp/ckan/dataset/e6b3c1d2-2f1f-4735-b36e-e45d36d94761/resource/165b2f56-d472-4b71-8c81-f97f898f1923/download',
    transform: async (conf) => {
      const { body: csv } = await superagent(conf.csv).responseType('blob')
      const csvObj = csvToObj(new iconv('SHIFT_JIS', 'UTF-8').convert(csv).toString())

      return {
        date: csvObj[csvObj.length - 1].集計時点_年月日.format('YYYY/MM/DD 21:00'),
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
        date: csvObj[csvObj.length - 1].集計時点_年月日.format('YYYY/MM/DD 21:00'),
        data: csvObj.map(row => ({
          日付: `${row.集計時点_年月日.format('YYYY-MM-DD')}T08:00:00.000Z`,
          小計: Number(row.相談件数)
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
        date: csvObj[csvObj.length - 1].集計時点_年月日.format('YYYY/MM/DD 21:00'),
        data: csvObj.map(row => ({
          日付: `${row.集計時点_年月日.format('YYYY-MM-DD')}T08:00:00.000Z`,
          小計: Number(row.検査実施人数)
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
        date: csvObj[csvObj.length - 1].集計時点_年月日.format('YYYY/MM/DD 21:00'),
        data: csvObj.map(row => ({
          日付: `${row.集計時点_年月日.format('YYYY-MM-DD')}T08:00:00.000Z`,
          小計: Number(row.日別の感染者数)
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
        date: csvObj[csvObj.length - 1].公表年月日.format('YYYY/MM/DD 21:00'),
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
    name: 'main_summary',
    url: 'https://www.pref.okayama.jp/page/645925.html',
    transform: async (conf) => {
      const inspectionsSummary = require('./data/inspections_summary.json').data
      const patients = require('./data/patients.json').data

      const { text: html } = await superagent(conf.url)
      const $ = cheerio.load(html)
      const p = $('#main_body > div:nth-child(2)').find('p').toArray()
      const dischargeInfoElem = p.find(el => /^&#xA0;&#xFF08;&#x9000;&#x9662;&#x60C5;&#x5831;&#xFF09;/.test($(el).html())) // （退院情報）
      const row = dischargeInfoElem.children.filter(el => el.name === 'a')

      const { body: pdfBuffer } = await superagent.get(`https://www.pref.okayama.jp${row[row.length - 1].attribs.href}`).responseType('blob')
      const data =
        await pdfParse(pdfBuffer,
          {
            max: 1,
            pagerender: pageData =>
              pageData
                .getTextContent()
                .then(content => {
                  let dischargeTestingTitle = null

                  const totalArr = []
                  const hospitalArr = []
                  const dischargeTestingArr = []
                  const stayCareFacilityArr = []
                  const dischargeArr = []

                  content.items.forEach(item => {
                    if (item.str === 'うち退院検査中') dischargeTestingTitle = item

                    // y position
                    if (dischargeTestingTitle === null || ((item.transform[5] <= dischargeTestingTitle.transform[5] - 36 && item.transform[5] >= dischargeTestingTitle.transform[5] - 39) === false)) return

                    // x position
                    if (71 <= item.transform[4] && item.transform[4] < 161.6) totalArr.push(item)
                    if (161.6 <= item.transform[4] && item.transform[4] < 252.2) hospitalArr.push(item)
                    if (252.2 <= item.transform[4] && item.transform[4] < 342.8) dischargeTestingArr.push(item)
                    if (342.8 <= item.transform[4] && item.transform[4] < 433.4) stayCareFacilityArr.push(item)
                    if (433.4 <= item.transform[4] && item.transform[4] < 524) dischargeArr.push(item)
                  })

                  function toNumber(items) {
                    return Number(items.filter(item => item.str !== ' ').map(item => toHalfWidth(item.str)).join(''))
                  }

                  // なんか文字列にしないといけないっぽいので妥協
                  return JSON.stringify({
                    total: toNumber(totalArr),
                    hospital: toNumber(hospitalArr),
                    dischargeTesting: toNumber(dischargeTestingArr),
                    stayCareFacility: toNumber(stayCareFacilityArr),
                    discharge: toNumber(dischargeArr),
                    death: 0 // オープンデータが無い
                  })
                })
          })
          .then(({ text }) => JSON.parse(text))

      return {
        last_update: moment().format('YYYY/MM/DD 21:00'),
        attr: '検査実施人数',
        value: inspectionsSummary.reduce((total, row) => total + row.小計, 0),
        children: [
          {
            attr: '陽性患者数',
            value: patients.length,
            children: [
              {
                attr: '入院調整中',
                value: patients.length - (data.hospital + data.discharge + data.death)
              },
              {
                attr: '入院中',
                value: data.hospital
              },
              {
                attr: '退院',
                value: data.discharge
              },
              {
                attr: '死亡',
                value: data.death
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
        date: moment().format('YYYY/MM/DD 21:00'),
      }
    }
  },
];

(async () => {
  for (const conf of opendata) {
    console.log('processing:', conf.name)
    const data = await conf.transform(conf)
    fs.writeFileSync(`data/${conf.name}.json`, `${JSON.stringify(data, undefined, 4)}\n`);
  }
})()
