#!/usr/bin/env bash

set -e

./build.sh

root=$(dirname "$0")

docker build -t ff14-todo $root

