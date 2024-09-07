#!/bin/env bash

function srv {
    (cd $(dirname "$0")/srv && npx pnpm install --frozen-lockfile && npm run start)
}

function web {
    (cd $(dirname "$0")/web && npx pnpm install --frozen-lockfile && npm run start)
}

(trap 'kill 0' SIGINT; srv & web & wait)