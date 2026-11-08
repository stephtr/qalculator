{
  description = "Qalculator website and WebAssembly build";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/3ec636362e1816bc2f0888fa0fa2c69f1bc9e504";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      sdk = pkgs.emscripten;
      tools = with pkgs; [ sdk sdk.llvmEnv binaryen autoconf automake libtool intltool gettext pkg-config gnumake python3 nodejs wabt ];
      wasmLib = { package, flags ? [], deps ? [] }:
        package.overrideAttrs (old: {
          pname = "wasm-${old.pname}";
          nativeBuildInputs = (old.nativeBuildInputs or []) ++ tools;
          configureScript = "emconfigure ./configure";
          configureFlags = (old.configureFlags or []) ++ [ "--disable-shared" "--enable-static" ] ++ flags;
          dontDisableStatic = true;
          dontStrip = true;
          doCheck = false;
          preConfigure = ''
            export HOME="$TMPDIR"
            export CC=emcc CXX=em++ AR=emar RANLIB=emranlib NM=llvm-nm
            export EM_PKG_CONFIG_PATH="$PKG_CONFIG_PATH"
            export CFLAGS="-g -Oz" CXXFLAGS="-g -Oz"
            export CPPFLAGS="${pkgs.lib.concatMapStringsSep " " (dep: "-I${pkgs.lib.getDev dep}/include") deps}"
            export LDFLAGS="-Oz ${pkgs.lib.concatMapStringsSep " " (dep: "-L${pkgs.lib.getLib dep}/lib") deps}"
          '' + (old.preConfigure or "");
        });
      gmp = wasmLib {
        package = pkgs.gmp;
        flags = [ "--disable-assembly" "--disable-fat" "--host=none" "CFLAGS=-g -Oz" "HOST_CC=${pkgs.stdenv.cc}/bin/cc" ];
      };
      mpfr = wasmLib {
        package = pkgs.mpfr.override { inherit gmp; };
        deps = [ gmp ];
      };
      xml = wasmLib {
        package = pkgs.libxml2.override { enableShared = false; };
        flags = [ "--with-minimum" "--with-tree" "--with-output" "--with-sax1" "--without-iconv" ];
      };
      qalc = (wasmLib {
        package = (pkgs.libqalculate.override {
          libxml2 = xml;
          inherit mpfr;
          gnuplotBinary = "";
        }).overrideAttrs (_: {
          version = "5.2.0-dev-e84cdc48";
          # Match the definitions embedded in the checked-in WASM.
          src = pkgs.fetchurl {
            url = "https://github.com/Qalculate/libqalculate/archive/e84cdc48ad199dd41fe0d48bcbec5cf236f80b66.tar.gz";
            hash = "sha256-CmnwJrM3YcbVQ+QBn+JCOKDsw5mU4XYis8v7LIc1bus=";
          };
          buildInputs = [];
          propagatedBuildInputs = [ xml mpfr ];
          dontUseAutoreconf = true;
          preConfigure = ''
            python3 ${./lib/tools/primes.py} libqalculate/primes.h ${./lib/tools/primes.inc}
            NOCONFIGURE=1 NO_AUTOMAKE=1 ./autogen.sh
          '';
        });
        deps = [ gmp mpfr xml ];
        flags = [ "--enable-compiled-definitions" "--without-libcurl" "--without-icu" "--disable-nls" "--disable-textport" "--disable-unittests" "--with-gnuplot-call=byo" ];
      }).overrideAttrs (_: {
        outputs = [ "out" "dev" ];
        makeFlags = [ "-C" "libqalculate" ];
        preBuild = ''
          # Top-level make embeds translations that the browser does not use.
          make -j"$NIX_BUILD_CORES" -C data
        '';
      });
      wasmFeatures = "--enable-mutable-globals --enable-bulk-memory --enable-nontrapping-float-to-int --enable-sign-ext";
      calc = pkgs.stdenv.mkDerivation {
        pname = "qalculator-wasm";
        version = "5.2.0";
        src = ./lib;
        nativeBuildInputs = tools;
        hardeningDisable = [ "all" ];
        dontConfigure = true;
        dontFixup = true;
        buildPhase = ''
          runHook preBuild
          export HOME="$TMPDIR"
          em++ -c calc.cc -Oz -o calc.o \
            -I${pkgs.lib.getDev qalc}/include -I${pkgs.lib.getDev gmp}/include \
            -I${pkgs.lib.getDev mpfr}/include -I${pkgs.lib.getDev xml}/include/libxml2
          em++ --bind -Oz \
            -L${pkgs.lib.getLib qalc}/lib -L${pkgs.lib.getLib gmp}/lib \
            -L${pkgs.lib.getLib mpfr}/lib -L${pkgs.lib.getLib xml}/lib \
            -lqalculate -lgmp -lmpfr -lxml2 calc.o \
            -s ENVIRONMENT=web -s FILESYSTEM=0 -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
            --profiling-funcs -s SPLIT_MODULE=1 --pre-js tools/loader.js \
            '-sINCOMING_MODULE_JS_API=["preRun","print","printErr","onRuntimeInitialized","wasmBinary","loadSplitModule"]' \
            '-sEXPORTED_RUNTIME_METHODS=["HEAPU8"]' \
            '-sEXPORTED_FUNCTIONS=["_main","_malloc","_free"]' -o calc.js
          mkdir reference
          cp calc.js reference/
          cp calc.wasm.orig reference/calc.wasm
          node tools/profile.mjs train .
          wasm-split calc.wasm.orig --profile=profile.data \
            --keep-funcs=@tools/keep-functions.txt ${wasmFeatures} \
            --export-prefix=% -o1 calc.wasm -o2 calc.deferred.wasm
          for file in calc.wasm calc.deferred.wasm; do
            wasm-opt "$file" ${wasmFeatures} --memory-packing --strip-debug -o "$file"
          done
          node tools/profile.mjs verify .
          node tools/settings.mjs
          node tools/measure.mjs .
          runHook postBuild
        '';
        installPhase = ''
          mkdir -p "$out"
          cp calc.js calc.wasm calc.deferred.wasm report.json coverage.json "$out/"
        '';
      };
      siteSrc = pkgs.lib.cleanSourceWith {
        src = ./.;
        filter = path: type:
          let name = baseNameOf path; in
          !(builtins.elem name [ "node_modules" ".svelte-kit" "build" "result" ".git" ])
          && !(builtins.elem name [ "calc.js" "calc.wasm" "calc.deferred.wasm" ]);
      };
      site = pkgs.stdenvNoCC.mkDerivation {
        pname = "qalculator-site";
        version = "0.0.1";
        src = siteSrc;
        nativeBuildInputs = [ pkgs.nodejs pkgs.pnpm_10 pkgs.pnpmConfigHook ];
        pnpmDeps = pkgs.fetchPnpmDeps {
          pname = "qalculator-site";
          src = pkgs.lib.fileset.toSource {
            root = ./.;
            fileset = pkgs.lib.fileset.unions [
              ./package.json ./website/package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml
            ];
          };
          pnpm = pkgs.pnpm_10;
          fetcherVersion = 5;
          hash = "sha256-wDhKgrcOcFvI892IMWs/Zgeg+nEesvd+wDG+gWo7sXA=";
        };
        buildPhase = ''
          runHook preBuild
          cp ${calc}/calc.js ${calc}/calc.wasm ${calc}/calc.deferred.wasm website/static/
          pnpm --filter website build
          runHook postBuild
        '';
        installPhase = ''
          runHook preInstall
          cp -r website/.svelte-kit/cloudflare "$out"
          for file in calc.js calc.wasm calc.deferred.wasm; do
            cmp "${calc}/$file" "$out/$file"
          done
          test -s "$out/index.html"
          test -s "$out/_worker.js"
          test -s "$out/_routes.json"
          runHook postInstall
        '';
      };
    in {
      packages.${system} = {
        default = site;
        inherit sdk calc site;
      };
      devShells.${system}.default = pkgs.mkShell {
        packages = tools;
      };
    };
}
