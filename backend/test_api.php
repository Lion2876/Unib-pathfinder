<?php
require 'vendor/autoload.php';
$client = new \GuzzleHttp\Client();
$res = $client->post('http://127.0.0.1:8000/api/shortest-path', [
    'json' => ['start' => 'GATE_UTAMA', 'end' => 'REKTORAT']
]);
echo $res->getBody();
