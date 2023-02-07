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

wget https://gmplib.org/download/gmp/gmp-6.1.2.tar.lz
tar xf gmp-6.1.2.tar.lz
cd gmp-6.1.2
emconfigure ./configure --disable-assembly --host none --enable-cxx --prefix=${HOME}/opt
make
make install
cd ..

wget https://www.mpfr.org/mpfr-current/mpfr-4.1.0.tar.xz
wget https://www.mpfr.org/mpfr-current/allpatches
tar xf mpfr-4.1.0.tar.xz
cd mpfr-4.1.0
patch -N -Z -p1 < ../allpatches 
emconfigure ./configure --prefix=${HOME}/opt --with-gmp=${HOME}/opt
make
make install
cd ..

wget ftp://xmlsoft.org/libxml2/libxml2-git-snapshot.tar.gz
tar xf libxml2-git-snapshot.tar.gz 
cd libxml2-2.9.12/
emconfigure ./configure --prefix=${HOME}/opt
make
make install
ln -s ${HOME}/opt/include/libxml2/libxml ${HOME}/opt/include/libxml
cd ..

git clone https://github.com/Qalculate/libqalculate.git
cd libqalculate
# the following command is supposed to fail, since it's also running the configure script
./autogen.sh
# comment out in configure script: (run `cat configure | grep PKG_CHECK_MODULES` to get the line numbers)
# PKG_CHECK_MODULES and defines for LIBCURL and ICU (~line 18880)
# PKG_CHECK_MODULES for LIBXML
# HAVE_PIPE2 (~line 18820)
emconfigure ./configure --prefix=${HOME}/opt CPPFLAGS=-I${HOME}/opt/include LDFLAGS="-L${HOME}/opt/lib -lxml2" --without-libcurl --enable-compiled-definitions --disable-nls
make
make install
cd ..
```
