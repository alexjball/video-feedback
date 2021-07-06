# distutils: language = c++
# distutils: sources = feedback/core.cpp

from feedback.simulation cimport Simulation, Point 
from feedback.core cimport print_core

print_core()

cdef class BasicSimulation(Simulation):
  cdef double x_min
  cdef double x_max
  cdef double y_min
  cdef double y_max

  def __init__(self, double x_min, double x_max, double y_min, double y_max):
    super().__init__()
    self.x_min = x_min
    self.x_max = x_max
    self.y_min = y_min
    self.y_max = y_max

  cdef bint is_point_in_portal(self, Point *p):
    # Rectangular portal
    return (
      p.x <= self.x_max
      and p.x >= self.x_min
      and p.y <= self.y_max
      and p.y >= self.y_min
    )

  cdef void map_point(self, Point *p):
    # Scaling to produce picture-in-picture effect
    p.x *= 1.2
    p.y *= 1.2
