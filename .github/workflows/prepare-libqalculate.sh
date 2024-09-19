#!/bin/bash

sudo apt install -y build-essential lzip binutils autoconf intltool libtool automake lbzip2 lzip
mkdir -p ~/opt/src
cd ~/opt/src

wget https://ftp.gnu.org/gnu/gmp/gmp-${GMP_VERSION}.tar.lz
tar xf gmp-${GMP_VERSION}.tar.lz
cd gmp-${GMP_VERSION}
emconfigure ./configure --disable-assembly --host none --enable-cxx --prefix=${HOME}/opt # no, the "none" host is not obsolete.
make
make install
cd ..

wget https://ftp.gnu.org/gnu/mpfr/mpfr-${MPFR_VERSION}.tar.xz
# wget https://www.mpfr.org/mpfr-current/allpatches # if available
tar xf mpfr-${MPFR_VERSION}.tar.xz
cd mpfr-${MPFR_VERSION}
emconfigure ./configure --prefix=${HOME}/opt --with-gmp=${HOME}/opt
make
make install
cd ..

wget http://xmlsoft.org/download/libxml2-${LIBXML2_VERSION}.tar.gz -O libxml2-${LIBXML2_VERSION}.tar.gz
tar xf libxml2-${LIBXML2_VERSION}.tar.gz 
cd libxml2-${LIBXML2_VERSION}
emconfigure ./configure --prefix=${HOME}/opt --disable-shared --without-python
make
make install
ln -s ${HOME}/opt/include/libxml2/libxml ${HOME}/opt/include/libxml
cd ..

wget https://github.com/Qalculate/libqalculate/archive/refs/tags/v${LIBQALCULATE_VERSION}.tar.gz -O libqalculate-${LIBQALCULATE_VERSION}.tar.gz
tar xf libqalculate-${LIBQALCULATE_VERSION}.tar.gz
cd libqalculate-${LIBQALCULATE_VERSION}
export NOCONFIGURE=1
export NO_AUTOMAKE=1
./autogen.sh || true
sed -i 's/PKG_CHECK_MODULES(LIBCURL, libcurl)/#PKG_CHECK_MODULES(LIBCURL, libcurl)/' configure
sed -i 's/PKG_CHECK_MODULES(ICU, icu-uc)/#PKG_CHECK_MODULES(ICU, icu-uc)/' configure
sed -i 's/PKG_CHECK_MODULES(LIBXML, libxml-2.0/#PKG_CHECK_MODULES(LIBXML, libxml-2.0/' configure
sed -i 's/#define HAVE_LIBCURL 1//' configure
sed -i 's/#define HAVE_ICU 1//' configure
sed -i 's/#define HAVE_PIPE2 1/#define HAVE_PIPE2 0/' configure
echo "configuring via emsdk"
emconfigure ./configure --prefix=${HOME}/opt CPPFLAGS=-I${HOME}/opt/include LDFLAGS="-L${HOME}/opt/lib -lxml2" --without-libcurl --without-icu --enable-compiled-definitions --disable-nls --disable-shared
make
make install
cd ..
