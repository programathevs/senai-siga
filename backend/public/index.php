<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$isMeRoute = str_contains($requestUri, 'api/me');

if ($isMeRoute) {
    $logMsg = function (string $msg): void {
        if (defined('STDOUT') && is_resource(STDOUT)) {
            fwrite(STDOUT, $msg . PHP_EOL);
        } else {
            @file_put_contents('php://stdout', $msg . PHP_EOL, FILE_APPEND);
        }
        error_log($msg);
    };

    $logMsg("console.time('me-http-entry')");
    $logMsg("console.time('me-autoload')");
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

if ($isMeRoute && isset($logMsg)) {
    $tAutoloadMs = round((microtime(true) - LARAVEL_START) * 1000, 2);
    $logMsg(sprintf("console.timeEnd('me-autoload'): %sms (Linha: %d)", $tAutoloadMs, __LINE__));
    $logMsg("console.time('me-framework-bootstrap')");
}

// Bootstrap Laravel and handle the request...
$tBootstrapStart = microtime(true);
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

if ($isMeRoute && isset($logMsg)) {
    $tBootstrapMs = round((microtime(true) - $tBootstrapStart) * 1000, 2);
    $logMsg(sprintf("console.timeEnd('me-framework-bootstrap'): %sms (Linha: %d)", $tBootstrapMs, __LINE__));
    $logMsg("console.time('me-handle-request')");
}

$tHandleStart = microtime(true);
$response = $app->handleRequest(Request::capture());

if ($isMeRoute && isset($logMsg)) {
    $tHandleMs = round((microtime(true) - $tHandleStart) * 1000, 2);
    $tTotalHttpMs = round((microtime(true) - LARAVEL_START) * 1000, 2);
    $logMsg(sprintf("console.timeEnd('me-handle-request'): %sms (Linha: %d)", $tHandleMs, __LINE__));
    $logMsg(sprintf("console.timeEnd('me-http-entry'): %sms (Linha: %d)", $tTotalHttpMs, __LINE__));
}
