.PHONY: build

build:
	python setup.py build_ext -i

run: build
	python main.py

watch:
	nodemon -x "make run || exit 1" -w *.pyx -w *.pxd

clean:
	rm -rf build/ draw_triangle.c *.so