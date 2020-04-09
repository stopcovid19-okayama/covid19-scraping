<?php

use Carbon\Carbon;
use League\Csv\Reader;

require_once __DIR__ . '/vendor/autoload.php';

// 一般電話相談件数
const CONTACTS_PAGE = "http://www.okayama-opendata.jp/opendata/ga130Action.action?resourceName=%E4%B8%80%E8%88%AC%E9%9B%BB%E8%A9%B1%E7%9B%B8%E8%AB%87%E4%BB%B6%E6%95%B0&keyTitle=d9c4776db7f09fff161953a2aaf03b80a9abad48&title=%E6%96%B0%E5%9E%8B%E3%82%B3%E3%83%AD%E3%83%8A%E3%82%A6%E3%82%A4%E3%83%AB%E3%82%B9%E6%84%9F%E6%9F%93%E7%97%87%E3%81%AB%E9%96%A2%E3%81%99%E3%82%8B%E3%83%87%E3%83%BC%E3%82%BF%EF%BC%88%E5%B2%A1%E5%B1%B1%E7%9C%8C%EF%BC%89&isParam=1&action=clickLnkResourceNameList&resourceId=165b2f56-d472-4b71-8c81-f97f898f1923&datasetId=e6b3c1d2-2f1f-4735-b36e-e45d36d94761&checkFieldFormat=CSV";
const CONTACTS_URL = "http://www.okayama-opendata.jp/ckan/dataset/e6b3c1d2-2f1f-4735-b36e-e45d36d94761/resource/165b2f56-d472-4b71-8c81-f97f898f1923/download/ippan.csv";

// 帰国者・接触者相談センター相談件数
const QUERENTS_PAGE = "http://www.okayama-opendata.jp/opendata/ga130Action.action?resourceName=%E5%B8%B0%E5%9B%BD%E8%80%85%E3%83%BB%E6%8E%A5%E8%A7%A6%E8%80%85%E7%9B%B8%E8%AB%87%E3%82%BB%E3%83%B3%E3%82%BF%E3%83%BC%E7%9B%B8%E8%AB%87%E4%BB%B6%E6%95%B0&keyTitle=d9c4776db7f09fff161953a2aaf03b80a9abad48&title=%E6%96%B0%E5%9E%8B%E3%82%B3%E3%83%AD%E3%83%8A%E3%82%A6%E3%82%A4%E3%83%AB%E3%82%B9%E6%84%9F%E6%9F%93%E7%97%87%E3%81%AB%E9%96%A2%E3%81%99%E3%82%8B%E3%83%87%E3%83%BC%E3%82%BF%EF%BC%88%E5%B2%A1%E5%B1%B1%E7%9C%8C%EF%BC%89&isParam=1&action=clickLnkResourceNameList&resourceId=f38ae73f-73c1-4f34-8174-1b188c77c713&datasetId=e6b3c1d2-2f1f-4735-b36e-e45d36d94761&checkFieldFormat=CSV";
const QUERENTS_URL = "http://www.okayama-opendata.jp/ckan/dataset/e6b3c1d2-2f1f-4735-b36e-e45d36d94761/resource/f38ae73f-73c1-4f34-8174-1b188c77c713/download/sesshoku.csv";

// PCR検査実施人数
const INSPECTIONS_SUMMARY_PAGE = "http://www.okayama-opendata.jp/opendata/ga130Action.action?resourceName=%EF%BC%B0%EF%BC%A3%EF%BC%B2%E6%A4%9C%E6%9F%BB%E5%AE%9F%E6%96%BD%E4%BA%BA%E6%95%B0&keyTitle=d9c4776db7f09fff161953a2aaf03b80a9abad48&title=%E6%96%B0%E5%9E%8B%E3%82%B3%E3%83%AD%E3%83%8A%E3%82%A6%E3%82%A4%E3%83%AB%E3%82%B9%E6%84%9F%E6%9F%93%E7%97%87%E3%81%AB%E9%96%A2%E3%81%99%E3%82%8B%E3%83%87%E3%83%BC%E3%82%BF%EF%BC%88%E5%B2%A1%E5%B1%B1%E7%9C%8C%EF%BC%89&isParam=1&action=clickLnkResourceNameList&resourceId=60ecd874-0f71-4d9f-9a8a-936fad9c99bc&datasetId=e6b3c1d2-2f1f-4735-b36e-e45d36d94761&checkFieldFormat=CSV";
const INSPECTIONS_SUMMARY_URL = "http://www.okayama-opendata.jp/ckan/dataset/e6b3c1d2-2f1f-4735-b36e-e45d36d94761/resource/60ecd874-0f71-4d9f-9a8a-936fad9c99bc/download/pcr.csv";

// 感染者数
const PATIENTS_SUMMARY_PAGE = "http://www.okayama-opendata.jp/opendata/ga130PreAction.action?resourceName=%E6%84%9F%E6%9F%93%E8%80%85%E6%95%B0&keyTitle=d9c4776db7f09fff161953a2aaf03b80a9abad48&title=%E6%96%B0%E5%9E%8B%E3%82%B3%E3%83%AD%E3%83%8A%E3%82%A6%E3%82%A4%E3%83%AB%E3%82%B9%E6%84%9F%E6%9F%93%E7%97%87%E3%81%AB%E9%96%A2%E3%81%99%E3%82%8B%E3%83%87%E3%83%BC%E3%82%BF%EF%BC%88%E5%B2%A1%E5%B1%B1%E7%9C%8C%EF%BC%89&isParam=1&resourceId=0c728c2e-a366-421d-95df-86b6b5ad15fd&licenseTitle=%E3%82%AF%E3%83%AA%E3%82%A8%E3%82%A4%E3%83%86%E3%82%A3%E3%83%96%E3%83%BB%E3%82%B3%E3%83%A2%E3%83%B3%E3%82%BA+%E8%A1%A8%E7%A4%BA&datasetId=e6b3c1d2-2f1f-4735-b36e-e45d36d94761&checkFieldFormat=CSV";
const PATIENTS_SUMMARY_URL = "http://www.okayama-opendata.jp/ckan/dataset/e6b3c1d2-2f1f-4735-b36e-e45d36d94761/resource/0c728c2e-a366-421d-95df-86b6b5ad15fd/download/kansenshasuu0406.csv";

// 感染者詳細情報
const PATIENTS_PAGE = "http://www.okayama-opendata.jp/opendata/ga130PreAction.action?resourceName=%E6%84%9F%E6%9F%93%E8%80%85%E8%A9%B3%E7%B4%B0%E6%83%85%E5%A0%B1&keyTitle=d9c4776db7f09fff161953a2aaf03b80a9abad48&title=%E6%96%B0%E5%9E%8B%E3%82%B3%E3%83%AD%E3%83%8A%E3%82%A6%E3%82%A4%E3%83%AB%E3%82%B9%E6%84%9F%E6%9F%93%E7%97%87%E3%81%AB%E9%96%A2%E3%81%99%E3%82%8B%E3%83%87%E3%83%BC%E3%82%BF%EF%BC%88%E5%B2%A1%E5%B1%B1%E7%9C%8C%EF%BC%89&isParam=1&resourceId=c6503ebc-b2e9-414c-aae7-7374f4801e21&licenseTitle=%E3%82%AF%E3%83%AA%E3%82%A8%E3%82%A4%E3%83%86%E3%82%A3%E3%83%96%E3%83%BB%E3%82%B3%E3%83%A2%E3%83%B3%E3%82%BA+%E8%A1%A8%E7%A4%BA&datasetId=e6b3c1d2-2f1f-4735-b36e-e45d36d94761&checkFieldFormat=CSV";
const PATIENTS_URL = "http://www.okayama-opendata.jp/ckan/dataset/e6b3c1d2-2f1f-4735-b36e-e45d36d94761/resource/c6503ebc-b2e9-414c-aae7-7374f4801e21/download/kansenshashousaijouhou0406.csv";


function getCsv(String $url): Reader
{
    $ch = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true
    ]);

    $response = mb_convert_encoding(curl_exec($ch), "UTF-8", "SJIS");

    curl_close($ch);

    $csv = Reader::createFromString($response);

    $csv->setHeaderOffset(0);

    return $csv;
}


function scrapingLastUpdate(String $url)
{
    $html = file_get_contents($url);

    $dom = phpQuery::newDocumentHTML($html);

    foreach ($dom['.table'] as $row) {
        $lastUpdate = pq($row)->find('td:eq(0)')->text();
    }

    $carbon = Carbon::createFromFormat("Y年m月d日", $lastUpdate);

    return $carbon->subDay();
}


function getLastUpdate(array $datas)
{
    foreach ($datas as $data) {
        $timestamps[] = Carbon::parse($data["date"])->timestamp;
    }

    $carbon = Carbon::parse(max($timestamps));

    return [
        'date' => $carbon->format('Y/m/d 21:00')
    ];
}


function outputJson(array $datas)
{
    foreach ($datas as $name => $data) {
        file_put_contents(__DIR__ . '/data/' . $name . '.json', json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK));
    }
}


function contacts()
{
    $data = getCsv(CONTACTS_URL);
    $lastUpdate = scrapingLastUpdate(CONTACTS_PAGE);

    foreach ($data->getRecords() as $record) {
        $date = new Carbon($record["集計時点_年月日"]);
        if ($lastUpdate->lt($date)) break;

        $datas[] = [
            '日付' => $date->format('Y-m-d') . 'T08:00:00.000Z',
            '小計' => isset($record["相談件数_計"]) ? (int) $record["相談件数_計"] : 0
        ];
    }

    return [
        'date' => $lastUpdate->format('Y/m/d 21:00'),
        'data' => $datas
    ];
}


function querents()
{
    $data = getCsv(QUERENTS_URL);
    $lastUpdate = scrapingLastUpdate(QUERENTS_PAGE);

    foreach ($data->getRecords() as $record) {
        $date = new Carbon($record["集計時点_年月日"]);
        if ($lastUpdate->lt($date)) break;

        $datas[] = [
            '日付' => $date->format('Y-m-d') . 'T08:00:00.000Z',
            '小計' => isset($record["相談件数"]) ? (int) $record["相談件数"] : 0
        ];
    }

    return [
        'date' => $lastUpdate->format('Y/m/d 21:00'),
        'data' => $datas
    ];
}


function inspections_summary()
{
    $data = getCsv(INSPECTIONS_SUMMARY_URL);
    $lastUpdate = scrapingLastUpdate(INSPECTIONS_SUMMARY_PAGE);

    foreach ($data->getRecords() as $record) {
        $date = new Carbon($record["集計時点_年月日"]);
        if ($lastUpdate->lt($date)) break;

        $datas[] = [
            '日付' => $date->format('Y-m-d') . 'T08:00:00.000Z',
            '小計' => isset($record["検査実施人数"]) ? (int) $record["検査実施人数"] : 0
        ];
    }

    return [
        'date' => $lastUpdate->format('Y/m/d 21:00'),
        'data' => $datas
    ];
}


function patients()
{
    $data = getCsv(PATIENTS_URL);
    $lastUpdate = scrapingLastUpdate(PATIENTS_PAGE);

    foreach ($data->getRecords() as $record) {
        if (empty($record["公表年月日"])) break;

        $carbon = Carbon::createFromFormat("m月d日", $record["公表年月日"]);

        $datas[] = [
            'リリース日' => $carbon->format('Y-m-d') . 'T08:00:00.000Z',
            '居住地' => $record["患者＿居住地"],
            '年代' => $record["患者＿年代"],
            '性別' => $record["患者＿性別"],
            '退院' => !empty($record["退院フラグ"]) ? "◯" : "",
            'date' => $carbon->format('Y-m-d')
        ];
    }

    return [
        'date' => $lastUpdate->format('Y/m/d 21:00'),
        'data' => $datas
    ];
}


function patients_summary()
{
    $data = getCsv(PATIENTS_SUMMARY_URL);
    $lastUpdate = scrapingLastUpdate(PATIENTS_SUMMARY_PAGE);

    foreach ($data->getRecords() as $record) {
        if (empty($record["集計時点_年月日"])) break;

        $date = Carbon::createFromFormat("m月d日", $record["集計時点_年月日"]);
        if ($lastUpdate->lt($date)) break;

        $datas[] = [
            '日付' => $date->format('Y-m-d') . 'T08:00:00.000Z',
            '小計' => isset($record["日別の感染者数"]) ? (int) $record["日別の感染者数"] : 0
        ];
    }

    return [
        'date' => $lastUpdate->format('Y/m/d 21:00'),
        'data' => $datas
    ];
}


$contacts = contacts();
$querents = querents();
$inspections_summary = inspections_summary();
$patients = patients();
$patients_summary = patients_summary();



$datas = compact([
    'contacts',
    'querents',
    'inspections_summary',
    'patients',
    'patients_summary'
]);

$datas['last_update'] = getLastUpdate($datas);

outputJson($datas);
