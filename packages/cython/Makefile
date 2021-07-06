.PHONY: build run watch

CFLAGS = -std=c++17 -O2 -Wall
LDFLAGS = -lglfw -lvulkan -ldl -lpthread -lX11 -lXxf86vm -lXrandr -lXi

build:
	python setup.py build_ext -i

build-watch: 
	nodemon -x "make build || exit 1" -e "py pyx pxd" -w feedback

run: build
	python main.py

test: build
	pytest feedback

test-watch: 
	nodemon -x "make test || exit 1" -e "py pyx pxd" -w feedback

watch:
	nodemon -x "make run || exit 1" -e "py pyx pxd" -w feedback

clean:
	rm -rf build/
	