# Build instructions for enabling libqalculate to compile to wasm

```bash
sudo apt install build-essential lzip binutils autoconf intltool libtool automake lbzip2 lzip
cd ~

git clone https://github.com/juj/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

mkdir -p ~/opt/src
cd ~/opt/src

wget https://gmplib.org/download/gmp/gmp-6.3.0.tar.lz
tar xf gmp-6.3.0.tar.lz
cd gmp-6.3.0
emconfigure ./configure --disable-assembly --host none --enable-cxx --prefix=${HOME}/opt # no, the "none" host is not obsolete.
make
make install
cd ..

wget https://www.mpfr.org/mpfr-current/mpfr-4.2.1.tar.xz # if not found, use a newer version
# wget https://www.mpfr.org/mpfr-current/allpatches # if available
tar xf mpfr-4.2.1.tar.xz
cd mpfr-4.2.1
# patch -N -Z -p1 < ../allpatches
emconfigure ./configure --prefix=${HOME}/opt --with-gmp=${HOME}/opt
make
make install
cd ..

wget ftp://xmlsoft.org/libxml2/libxml2-git-snapshot.tar.gz
tar xf libxml2-git-snapshot.tar.gz 
cd libxml2-2.9.13/ # or whichever version is up to date
emconfigure ./configure --prefix=${HOME}/opt --disable-shared
make
make install
ln -s ${HOME}/opt/include/libxml2/libxml ${HOME}/opt/include/libxml
cd ..

git clone https://github.com/Qalculate/libqalculate.git
cd libqalculate
export NOCONFIGURE=1
export NO_AUTOMAKE=1
./autogen.sh
export LIBXML_LIBS="-L${HOME}/opt/lib -lxml2"
export LIBXML_CFLAGS="-I${HOME}/opt/include"
emconfigure ./configure --prefix=${HOME}/opt CPPFLAGS=-I${HOME}/opt-prerequisites/include LDFLAGS=-L${HOME}/opt-prerequisites/lib --without-libcurl --without-icu --enable-compiled-definitions --disable-nls --disable-shared
make
make install
cd ..
```
