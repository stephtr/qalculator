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
export LIBXML_LIBS="-L${HOME}/opt/lib -lxml2"
export LIBXML_CFLAGS="-I${HOME}/opt/include"
emconfigure ./configure --prefix=${HOME}/opt --without-libcurl --without-icu --enable-compiled-definitions --disable-nls --disable-shared
make
make install
cd ..
