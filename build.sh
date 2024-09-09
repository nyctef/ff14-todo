#!/bin/env bash

set -e

root=$(dirname "$0")

echo === building srv/ ===
(cd $root/srv && npx pnpm install --frozen-lockfile && npm run build)

echo
echo === building web/ ===
(cd $root/web && npx pnpm install --frozen-lockfile && npm run build)

echo
echo === merging builds ===
rm -rf $root/dist/
mv $root/srv/dist $root/dist
mv $root/web/dist $root/dist/web