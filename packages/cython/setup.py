import os
from setuptools import Extension, setup
from Cython.Build import cythonize

source_root = os.path.abspath(os.path.dirname(__file__))
compiled_modules = [
    "feedback.basic",
    "feedback.simulation",
    "feedback.portal",
]

extensions = []
for module in compiled_modules:
    source_file = os.path.join(source_root, *module.split("."))
    if os.path.exists(source_file + ".py"):
        pyx_source_file = source_file + ".py"
    else:
        pyx_source_file = source_file + ".pyx"
    ext = Extension(module, sources=[pyx_source_file])
    ext.cython_c_in_temp = True
    extensions.append(ext)

setup(
    ext_modules=cythonize(extensions, language_level="3", build_dir="build"),
    zip_safe=False,
)
