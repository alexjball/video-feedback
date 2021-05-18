from setuptools import Extension, setup
from Cython.Build import cythonize

setup(
    ext_modules=cythonize(
        [Extension("draw_triangle", ["*.pyx"], libraries=["GL", "glut"])],
        compiler_directives={"language_level": 3},
    ),
    zip_safe=False,
)
