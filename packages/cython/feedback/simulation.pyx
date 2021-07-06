import numpy as np

cdef class Consumer:
  cdef void accept(self, Point *p):
    pass

cdef class Points:
  def __init__(self, x_min, x_max, y_min, y_max, width, height):
    dtype=np.dtype([("x", "f8"), ("y", "f8"), ("depth", "i"), ("active", "i")])
    self.data = np.zeros((height, width), dtype=dtype)
    self.view = self.data

    [x, y] = np.meshgrid(
        np.linspace(x_min, x_max, width), np.linspace(y_min, y_max, height)
    )
    self.data["x"] = x
    self.data["y"] = y
    self.data["active"] = True

  cdef void for_each(self, Consumer consumer):
    cdef Py_ssize_t x_max = self.view.shape[1]
    cdef Py_ssize_t y_max = self.view.shape[0]

    cdef Py_ssize_t x, y

    for x in range(x_max):
      for y in range(y_max):
        consumer.accept(&self.view[y, x])

cdef class Simulation(Consumer):
  def __init__(self, int max_depth_per_pass=50):
    self.max_depth_per_pass = max_depth_per_pass

  cpdef void run(self, Points points):
    points.for_each(self)

  cdef void accept(self, Point *p):
    cdef int max_depth = p.depth + self.max_depth_per_pass

    while p.depth < max_depth and p.active:
      p.active = self.is_point_in_portal(p)
      if p.active:
        self.map_point(p)
        p.depth += 1

    if p.depth == max_depth:
      p.active = self.is_point_in_portal(p)
  
  cdef bint is_point_in_portal(self, Point *p):
    return False

  cdef void map_point(self, Point *p):
    pass
