<?php

use Carbon\Carbon;
use League\Csv\Reader;
use Tightenco\Collect\Contracts\Support\Arrayable;

require_once __DIR__ . '/vendor/autoload.php';

// 一般電話相談件数
const CONTACTS_PAGE = "http://www.okayama-opendata.jp/opendata/ga130Action.action?resourceName=%E4%B8%80%E8%88%AC%E9%9B%BB%E8%A9%B1%E7%9B%B8%E8%AB%87%E4%BB%B6%E6%95%B0&keyTitle=d9c4776db7f09fff161953a2aaf03b80a9abad48&title=%E6%96%B0%E5%9E%8B%E3%82%B3%E3%83%AD%E3%83%8A%E3%82%A6%E3%82%A4%E3%83%AB%E3%82%B9%E6%84%9F%E6%9F%93%E7%97%87%E3%81%AB%E9%96%A2%E3%81%99%E3%82%8B%E3%83%87%E3%83%BC%E3%82%BF%EF%BC%88%E5%B2%A1%E5%B1%B1%E7%9C%8C%EF%BC%89&isParam=1&action=clickLnkResourceNameList&resourceId=165b2f56-d472-4b71-8c81-f97f898f1923&datasetId=e6b3c1d2-2f1f-4735-b36e-e45d36d94761&checkFieldFormat=CSV";
const CONTACTS_URL = "http://www.okayama-opendata.jp/ckan/dataset/e6b3c1d2-2f1f-4735-b36e-e45d36d94761/resource/165b2f56-d472-4b71-8c81-f97f898f1923/download/ippan.csv";

// 帰国者・接触者相談センター相談件数
const QUERENTS_PAGE = "http://www.okayama-opendata.jp/opendata/ga130Action.action?resourceName=%E5%B8%B0%E5%9B%BD%E8%80%85%E3%83%BB%E6%8E%A5%E8%A7%A6%E8%80%85%E7%9B%B8%E8%AB%87%E3%82%BB%E3%83%B3%E3%82%BF%E3%83%BC%E7%9B%B8%E8%AB%87%E4%BB%B6%E6%95%B0&keyTitle=d9c4776db7f09fff161953a2aaf03b80a9abad48&title=%E6%96%B0%E5%9E%8B%E3%82%B3%E3%83%AD%E3%83%8A%E3%82%A6%E3%82%A4%E3%83%AB%E3%82%B9%E6%84%9F%E6%9F%93%E7%97%87%E3%81%AB%E9%96%A2%E3%81%99%E3%82%8B%E3%83%87%E3%83%BC%E3%82%BF%EF%BC%88%E5%B2%A1%E5%B1%B1%E7%9C%8C%EF%BC%89&isParam=1&action=clickLnkResourceNameList&resourceId=f38ae73f-73c1-4f34-8174-1b188c77c713&datasetId=e6b3c1d2-2f1f-4735-b36e-e45d36d94761&checkFieldFormat=CSV";
const QUERENTS_URL = "http://www.okayama-opendata.jp/ckan/dataset/e6b3c1d2-2f1f-4735-b36e-e45d36d94761/resource/f38ae73f-73c1-4f34-8174-1b188c77c713/download/sesshoku.csv";

// PCR検査実施件数
const INSPECTIONS_PAGE = "http://www.okayama-opendata.jp/opendata/ga130Action.action?resourceName=%EF%BC%B0%EF%BC%A3%EF%BC%B2%E6%A4%9C%E6%9F%BB%E5%AE%9F%E6%96%BD%E4%BA%BA%E6%95%B0&keyTitle=d9c4776db7f09fff161953a2aaf03b80a9abad48&title=%E6%96%B0%E5%9E%8B%E3%82%B3%E3%83%AD%E3%83%8A%E3%82%A6%E3%82%A4%E3%83%AB%E3%82%B9%E6%84%9F%E6%9F%93%E7%97%87%E3%81%AB%E9%96%A2%E3%81%99%E3%82%8B%E3%83%87%E3%83%BC%E3%82%BF%EF%BC%88%E5%B2%A1%E5%B1%B1%E7%9C%8C%EF%BC%89&isParam=1&action=clickLnkResourceNameList&resourceId=60ecd874-0f71-4d9f-9a8a-936fad9c99bc&datasetId=e6b3c1d2-2f1f-4735-b36e-e45d36d94761&checkFieldFormat=CSV";
const INSPECTIONS_URL = "http://www.okayama-opendata.jp/ckan/dataset/e6b3c1d2-2f1f-4735-b36e-e45d36d94761/resource/60ecd874-0f71-4d9f-9a8a-936fad9c99bc/download/pcr.csv";


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


function getLastUpdate(String $url)
{
    $html = file_get_contents($url);

    $dom = phpQuery::newDocumentHTML($html);

    foreach ($dom['.table'] as $row) {
        $lastUpdate = pq($row)->find('td:eq(0)')->text();
    }

    $carbon = Carbon::createFromFormat("Y年m月d日", $lastUpdate);

    return $carbon;
}


function contacts()
{
    $data = getCsv(CONTACTS_URL);
    $lastUpdate = getLastUpdate(CONTACTS_PAGE);

    foreach ($data->getRecords() as $record) {
        $date = new Carbon($record["集計時点_年月日"]);
        if ($lastUpdate->lt($date)) break;

        $datas[] = [
            '日付' => $date->format('Y-m-d') . 'T08:00:00.000Z',
            '小計' => isset($record["相談件数_計"]) ? (int) $record["相談件数_計"] : 0
        ];
    }

    return [
        'date' => $lastUpdate->format('Y-m-d') . 'T08:00:00.000Z',
        'data' => $datas
    ];
}


function querents()
{
    $data = getCsv(QUERENTS_URL);
    $lastUpdate = getLastUpdate(QUERENTS_PAGE);

    foreach ($data->getRecords() as $record) {
        $date = new Carbon($record["集計時点_年月日"]);
        if ($lastUpdate->lt($date)) break;

        $datas[] = [
            '日付' => $date->format('Y-m-d') . 'T08:00:00.000Z',
            '小計' => isset($record["相談件数"]) ? (int) $record["相談件数"] : 0
        ];
    }

    return [
        'date' => $lastUpdate->format('Y-m-d') . 'T08:00:00.000Z',
        'data' => $datas
    ];
}


function inspections()
{
    $data = getCsv(INSPECTIONS_URL);
    $lastUpdate = getLastUpdate(INSPECTIONS_PAGE);

    foreach ($data->getRecords() as $record) {
        $date = new Carbon($record["集計時点_年月日"]);
        if ($lastUpdate->lt($date)) break;

        $datas[] = [
            '日付' => $date->format('Y-m-d') . 'T08:00:00.000Z',
            '小計' => isset($record["検査実施人数"]) ? (int) $record["検査実施人数"] : 0
        ];
    }

    return [
        'date' => $lastUpdate->format('Y-m-d') . 'T08:00:00.000Z',
        'data' => $datas
    ];
}


$contacts = contacts();
$querents = querents();
$inspections = inspections();

$data = compact([
    'contacts',
    'querents',
    'inspections'
]);

file_put_contents(__DIR__ . '/data/data.json', json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK));
