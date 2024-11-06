#!/usr/bin/env bash
docker run --mount type=bind,source=.,target=/src --pull always --platform linux/amd64 ghcr.io/stephtr/libqalculate-wasm:main emcc -I /opt/include -L /opt/lib -lqalculate -lgmp -lmpfr -lxml2 --bind /src/calc.cc -o /src/calc.js -O2 -s ENVIRONMENT=web -s FILESYSTEM=0 -s ERROR_ON_UNDEFINED_SYMBOLS=0
