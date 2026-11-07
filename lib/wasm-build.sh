#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
nix build
cp result/calc.js result/*.wasm website/static/
