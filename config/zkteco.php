<?php

return [

    'sync_api_key' => env('ZKTECO_SYNC_API_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Automatic attendance sync (queued for the Windows agent)
    |--------------------------------------------------------------------------
    |
    | Laravel scheduler runs zkteco:queue-auto-sync every N minutes. The agent
    | on the device PC must run bin/auto_run.php on a matching schedule.
    |
    */
    'auto_sync_enabled' => env('ZKTECO_AUTO_SYNC_ENABLED', true),

    'auto_sync_interval_minutes' => (int) env('ZKTECO_AUTO_SYNC_INTERVAL_MINUTES', 5),

];
