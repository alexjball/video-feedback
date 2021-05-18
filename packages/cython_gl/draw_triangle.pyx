from gl cimport *

# These are part of gl.h/glut.h. They cannot exist in
# the pxd file as they are definitions.
cdef unsigned int GLUT_SINGLE = 0
cdef unsigned int GL_TRIANGLES = 4
cdef unsigned int GL_COLOR_BUFFER_BIT = 0x00004000

cdef void display():
  glClearColor( 0, 0, 0, 1 )
  glClear(GL_COLOR_BUFFER_BIT )
  
  glBegin(GL_TRIANGLES)
  glColor3f( 1, 0, 0 )
  glVertex2f( -0.8, -0.8 )
  glColor3f( 0, 1, 0 )
  glVertex2f( 0.8, -0.8 )
  glColor3f( 0, 0, 1 )
  glVertex2f( 0, 0.9 )
  glEnd()
  
  glutSwapBuffers()


cpdef main():
  cdef int argc = 0
  cdef char ** argv = []

  glutInit(&argc, argv)
  glutInitDisplayMode(GLUT_SINGLE)
  glutInitWindowSize(500,500)
  glutInitWindowPosition(100,100)
  glutCreateWindow("GL RGB Triangle")
  glutDisplayFunc(&display)
  
  glutMainLoop()
