
cdef class Consumer:
  cdef void accept(self, Point *point)

# cdef class Spacemap:
#   cdef void map(self, Point *p)

# cdef class Portal:
#   cdef bint contains(self, Point *p)

cdef packed struct Point:
  double x
  double y
  int depth
  bint active

cdef class Simulation(Consumer):
  cdef int max_depth_per_pass

  cpdef void run(self, Points p)
  cdef bint is_point_in_portal(self, Point *p)
  cdef void map_point(self, Point *p)

cdef class Points:
  cdef Point [:, :] view
  cdef public data
  cdef void for_each(self, Consumer consumer)