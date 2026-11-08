#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
nix build .#calc --out-link result-calc
cp result-calc/calc.js result-calc/*.wasm website/static/
