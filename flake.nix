{
  description = "Qalculator WebAssembly build";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/3ec636362e1816bc2f0888fa0fa2c69f1bc9e504";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      sdk = pkgs.stdenv.mkDerivation {
        pname = "emscripten-sdk";
        version = "3.1.67";
        src = pkgs.fetchurl {
          url = "https://storage.googleapis.com/webassembly/emscripten-releases-builds/linux/4ae62984ea36ef0e5bfcbd0ed9b62f04bee6426a/wasm-binaries.tar.xz";
          hash = "sha256-U1tkgikWyAEkNjpcelvQyv1wPxZtUVXArQ5GTkqHkJE=";
        };
        nativeBuildInputs = [ pkgs.autoPatchelfHook pkgs.makeWrapper ];
        buildInputs = [ pkgs.stdenv.cc.cc.lib pkgs.zlib pkgs.libxml2 pkgs.ncurses ];
        dontConfigure = true;
        dontBuild = true;
        dontStrip = true;
        installPhase = ''
          runHook preInstall
          mkdir -p "$out/libexec" "$out/bin"
          cp -r . "$out/libexec/emsdk"
          root="$out/libexec/emsdk"
          cat > "$out/emscripten-config" <<EOF
          LLVM_ROOT = '$root/bin'
          BINARYEN_ROOT = '$root'
          NODE_JS = '${pkgs.nodejs}/bin/node'
          FROZEN_CACHE = False
          EOF
          patchShebangs "$root/emscripten"
          for tool in emcc em++ emar emranlib emnm emconfigure emmake emsize; do
            makeWrapper "$root/emscripten/$tool" "$out/bin/$tool" \
              --set EM_CONFIG "$out/emscripten-config" \
              --prefix PATH : '${pkgs.lib.makeBinPath [ pkgs.python3 pkgs.nodejs ]}'
          done
          for tool in llvm-nm llvm-ar llvm-objdump llvm-size wasm-opt wasm-dis wasm-split; do
            ln -s "$root/bin/$tool" "$out/bin/$tool"
          done
          runHook postInstall
        '';
      };
      tools = with pkgs; [ sdk autoconf automake libtool intltool gettext pkg-config gnumake python3 nodejs wabt ];
      cacheSetup = ''
        export HOME="$TMPDIR/home"
        export EM_CONFIG="${sdk}/emscripten-config"
        export EM_CACHE="$TMPDIR/emscripten-cache"
        mkdir -p "$HOME" "$EM_CACHE"
        cp -r ${sdk}/libexec/emsdk/emscripten/cache/. "$EM_CACHE/"
        chmod -R u+w "$EM_CACHE"
      '';
      wasmLib = { pname, version, url, hash, flags ? "", deps ? [], prepare ? "" }:
        pkgs.stdenv.mkDerivation {
          inherit pname version;
          src = pkgs.fetchurl { inherit url hash; };
          nativeBuildInputs = tools;
          dontUseCmakeConfigure = true;
          dontUseAutoreconf = true;
          hardeningDisable = [ "all" ];
          dontFixup = true;
          enableParallelBuilding = true;
          configurePhase = ''
            runHook preConfigure
            ${cacheSetup}
            export CC=emcc CXX=em++ AR=emar RANLIB=emranlib NM=emnm
            export CFLAGS="-g -O2" CXXFLAGS="-g -O2"
            export CPPFLAGS="${pkgs.lib.concatMapStringsSep " " (dep: "-I${dep}/include") deps}"
            export LDFLAGS="${pkgs.lib.concatMapStringsSep " " (dep: "-L${dep}/lib") deps}"
            ${prepare}
            emconfigure ./configure --prefix="$out" --disable-shared ${flags}
            runHook postConfigure
          '';
        };
      gmp = wasmLib {
        pname = "wasm-gmp";
        version = "6.3.0";
        url = "https://ftp.gnu.org/gnu/gmp/gmp-6.3.0.tar.xz";
        hash = "sha256-o8K4AgG4nmhhb0rTC8Zq7kknw85Q4zkpyoGdXENTiJg=";
        flags = "--disable-assembly --host=none --enable-cxx HOST_CC=${pkgs.stdenv.cc}/bin/cc";
      };
      mpfr = wasmLib {
        pname = "wasm-mpfr";
        version = "4.2.1";
        url = "https://ftp.gnu.org/gnu/mpfr/mpfr-4.2.1.tar.xz";
        hash = "sha256-J3gHNTpnJpeJlpRa8T5Sgp46vXqaW3+yeTiU4Y8fy7I=";
        deps = [ gmp ];
        flags = "--with-gmp=${gmp}";
      };
      xml = wasmLib {
        pname = "wasm-libxml2";
        version = "2.9.12";
        url = "https://download.gnome.org/sources/libxml2/2.9/libxml2-2.9.12.tar.xz";
        hash = "sha256-KKkvarHzEaz15HhWTEkIjvCsdwkNnHGbvF1Rjx/mLrk=";
        flags = "--without-python";
      };
      qalc = (wasmLib {
        pname = "wasm-libqalculate";
        version = "5.2.0-dev-e84cdc48";
        # Match the definitions embedded in the checked-in WASM.
        url = "https://github.com/Qalculate/libqalculate/archive/e84cdc48ad199dd41fe0d48bcbec5cf236f80b66.tar.gz";
        hash = "sha256-CmnwJrM3YcbVQ+QBn+JCOKDsw5mU4XYis8v7LIc1bus=";
        deps = [ gmp mpfr xml ];
        flags = "--enable-compiled-definitions --without-libcurl --without-icu --disable-nls --disable-textport --disable-unittests --with-gnuplot-call=byo";
        prepare = ''
          python3 ${./lib/tools/primes.py} libqalculate/primes.h ${./lib/tools/primes.inc}
          NOCONFIGURE=1 NO_AUTOMAKE=1 ./autogen.sh
          export LIBXML_LIBS="-L${xml}/lib -lxml2"
          export LIBXML_CFLAGS="-I${xml}/include/libxml2"
        '';
      }).overrideAttrs (_: {
        buildPhase = ''
          runHook preBuild
          # Top-level make populates po-defs and embeds translations in the XML.
          make -j"$NIX_BUILD_CORES" -C data
          make -j"$NIX_BUILD_CORES" -C libqalculate
          runHook postBuild
        '';
        installPhase = ''
          runHook preInstall
          make -j"$NIX_BUILD_CORES" -C libqalculate install
          runHook postInstall
        '';
      });
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
          ${cacheSetup}
          em++ -c calc.cc -O2 -o calc.o \
            -I${qalc}/include -I${gmp}/include -I${mpfr}/include -I${xml}/include/libxml2
          emcc --bind -O2 \
            -L${qalc}/lib -L${gmp}/lib -L${mpfr}/lib -L${xml}/lib \
            -lqalculate -lgmp -lmpfr -lxml2 calc.o \
            -s ENVIRONMENT=web -s FILESYSTEM=0 -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
            --profiling-funcs -s SPLIT_MODULE=1 --pre-js tools/loader.js \
            '-sEXPORTED_FUNCTIONS=["_main","_malloc","_free"]' -o calc.js
          mkdir reference
          cp calc.js reference/
          cp calc.wasm.orig reference/calc.wasm
          node tools/profile.mjs train .
          wasm-split calc.wasm.orig --profile=profile.data \
            --keep-funcs=@tools/keep-functions.txt --enable-mutable-globals \
            --export-prefix=% -o1 calc.wasm -o2 calc.deferred.wasm
          for file in calc.wasm calc.deferred.wasm; do
            wasm-opt "$file" --memory-packing --strip-debug -o "$file"
          done
          node tools/profile.mjs verify .
          node tools/measure.mjs .
          runHook postBuild
        '';
        installPhase = ''
          mkdir -p "$out"
          cp calc.js calc.wasm calc.deferred.wasm report.json coverage.json "$out/"
        '';
      };
    in {
      packages.${system} = {
        default = calc;
        inherit sdk calc;
      };
      devShells.${system}.default = pkgs.mkShell {
        packages = tools;
        shellHook = ''
          export EM_CONFIG="${sdk}/emscripten-config"
          export EM_CACHE="''${XDG_CACHE_HOME:-$HOME/.cache}/qalculator/emscripten-3.1.67"
          if [ ! -e "$EM_CACHE/sysroot" ]; then
            mkdir -p "$EM_CACHE"
            cp -r ${sdk}/libexec/emsdk/emscripten/cache/. "$EM_CACHE/"
            chmod -R u+w "$EM_CACHE"
          fi
        '';
      };
    };
}
