#!/bin/bash
set -e

case "$1" in
    develop)
        echo "Running Development Server"
        exec yarn run start
        ;;
    test)
        echo "Running Test"
        exec yarn test
        ;;
    start)
        echo "Running Start"
        exec yarn start
        ;;
    *)
        exec "$@"
esac
