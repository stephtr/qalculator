source ~/emsdk/emsdk_env.sh
emcc -I ${HOME}/opt/include -L ${HOME}/opt/lib -lqalculate -lgmp -lmpfr -lxml2 --bind calc.cc -o ../website/static/calc.js -O2
