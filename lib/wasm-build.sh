source ~/emsdk/emsdk_env.sh
emcc -I ${HOME}/opt/include -L ${HOME}/opt/lib -lqalculate -lgmp -lmpfr -lxml2 --bind -s MODULARIZE=1 -s EXPORT_ES6=1 calc.cc -o ../website/static/calc.js -O3
