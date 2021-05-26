.PHONY: build

build:
	python setup.py build_ext -i

run: build
	python main.py

watch:
	nodemon -x "make run || exit 1" -e "py pyx pxd"

clean:
	rm -rf build/ draw_triangle.c *.so