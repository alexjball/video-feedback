import numpy as np
import cython
from cython.cimports.libc.math import cos, sin, pi


@cython.cfunc
@cython.returns((cython.double, cython.double))
def __define_point():
    return (0, 0)


Point = cython.typedef((cython.double, cython.double))


@cython.cclass
class Transform:
    m = cython.declare(object, visibility="public")

    def __init__(self, **kwargs):
        self.set(**kwargs)

    def set(self, **kwargs):
        self.m = Transform.matrix(**kwargs)

    @staticmethod
    def matrix(t_x=0.0, t_y=0.0, s_x=1.0, s_y=1.0, degrees=0.0, t=None):
        if t:
            return np.array(t.m)

        theta = degrees * pi / 180
        c = cos(theta)
        s = sin(theta)

        return np.array([[s_x * c, -s, t_x], [s, s_y * c, t_y], [0, 0, 1]], dtype="d")

    @staticmethod
    def apply(t, points):
        if points.shape[0] != 3:
            raise ValueError("points must be 3xN homogeneous coordinates")
        return t.m @ points

    @cython.ccall
    def capply(self, p: Point) -> Point:
        m: cython.double[:, :] = self.m
        x: cython.double = p[0]
        y: cython.double = p[1]
        return (
            m[0, 0] * x + m[0, 1] * y + m[0, 2],
            m[1, 0] * x + m[1, 1] * y + m[1, 2],
        )

    def copy(self):
        return Transform(t=self)

    def __invert__(self):
        self.m = np.linalg.inv(self.m)
        return self

    def __matmul__(self, other):
        if isinstance(other, Transform):
            np.matmul(self.m, other.m, out=self.m)
            return self
        if isinstance(other, np.ndarray):
            return Transform.apply(self, other)

    def __array__(self, dtype=None):
        return np.array(self.m, dtype=dtype)


@cython.cclass
class Portal:
    cython.declare(__t=Transform, __inv=Transform, regions=list)

    def __init__(self):
        self.t = Transform()
        self.regions = []

    def add_region(self, points):
        self.regions.append(points)

    @property
    def t(self):
        return self.__t

    @t.setter
    def t(self, t):
        self.__t = t
        self.__inv = ~(t.copy())

    @cython.ccall
    def contains(self, p: Point) -> cython.bint:
        p_local: Point = self.__inv.capply(p)
        n_crossings: int = 0
        for region in self.regions:
            if len(region) < 3:
                continue
            p1 = region[-1]
            for p2 in region:
                if self.crosses(p_local, p1, p2):
                    n_crossings += 1
                p1 = p2
        return n_crossings % 2 == 1

    @cython.cfunc
    def crosses(self, check: Point, p1: Point, p2: Point) -> cython.bint:
        x_max = max(p1[0], p2[0])
        x_min = min(p1[0], p2[0])
        y_max = max(p1[1], p2[1])
        y_min = min(p1[1], p2[1])
        x, y = check

        if x > x_max or y > y_max or y < y_min:
            return False
        elif x < x_min:
            return True

        if p1[0] < p2[0]:
            left: Point = p1
            right: Point = p2
        else:
            left: Point = p2
            right: Point = p1

        return (y - left[1]) * (right[0] - left[0]) < (right[1] - left[1]) * (
            x - left[0]
        )
