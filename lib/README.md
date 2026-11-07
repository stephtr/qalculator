# Build the calculator

From the repository root, run `nix build .#calc --out-link result-calc`.

`result-calc/` contains the browser files and `report.json`: raw, gzip, and Brotli
sizes, plus seven fresh-process Node startup samples in milliseconds. Startup
includes compilation, initialization, and variable discovery, not network time.

Run `lib/wasm-build.sh` to build and copy the browser files into `website/static/`.
