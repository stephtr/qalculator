#!/bin/bash

sudo apt install -y build-essential lzip binutils autoconf intltool libtool automake lbzip2 lzip

mkdir -p ~/opt/src
cd ~/opt/src

wget https://github.com/Qalculate/libqalculate/archive/refs/tags/v${LIBQALCULATE_VERSION}.tar.gz -O libqalculate-${LIBQALCULATE_VERSION}.tar.gz
tar xf libqalculate-${LIBQALCULATE_VERSION}.tar.gz
cd libqalculate-${LIBQALCULATE_VERSION}
export NOCONFIGURE=1
export NO_AUTOMAKE=1
./autogen.sh
sed -i 's/PKG_CHECK_MODULES(LIBCURL, libcurl)/#PKG_CHECK_MODULES(LIBCURL, libcurl)/' configure
sed -i 's/PKG_CHECK_MODULES(ICU, icu-uc)/#PKG_CHECK_MODULES(ICU, icu-uc)/' configure
sed -i 's/PKG_CHECK_MODULES(LIBXML, libxml-2.0/#PKG_CHECK_MODULES(LIBXML, libxml-2.0/' configure
sed -i 's/#define HAVE_LIBCURL 1//' configure
sed -i 's/#define HAVE_ICU 1//' configure
sed -i 's/#define HAVE_PIPE2 1/#define HAVE_PIPE2 0/' configure
echo "configuring via emsdk"
export LIBXML_LIBS="-L${HOME}/opt/lib -lxml2"
export LIBXML_CFLAGS="-I${HOME}/opt/include"
emconfigure ./configure --prefix=${HOME}/opt CPPFLAGS=-I${HOME}/opt/include LDFLAGS="-L${HOME}/opt/lib -lxml2" --without-libcurl --without-icu --enable-compiled-definitions --disable-nls --disable-shared
make
make install
cat ./configure
cd ..
