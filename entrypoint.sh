#!/bin/bash
set -e

case "$1" in
    develop)
        echo "Running Development Server"
        echo -e "$EE_PRIVATE_KEY" | base64 -d > privatekey.pem
        echo -e "$EE_ASSETS_IDS" > ee_asset_ids.json
        exec grunt --gruntfile app/Gruntfile.js | bunyan
        ;;
    startDev)
        echo "Running Start Dev"
        exec npm start
        ;;
    test)
        echo "Running Test"
        exec grunt --gruntfile app/Gruntfile.js test
        ;;
    start)
        echo "Running Start"
        echo -e "$EE_PRIVATE_KEY" | base64 -d > privatekey.pem
        echo -e "$EE_ASSETS_IDS" > ee_asset_ids.json
        exec npm start | bunyan
        ;;
    *)
        exec "$@"
esac
