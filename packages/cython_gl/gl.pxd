# This file can only contain declarations, and is not translated into an
# extension model.

cdef extern from "GL/gl.h":
  void glClearColor( float red, float green, float blue, float alpha )
  void glClear(int mask )
  void glBegin( unsigned int mode )
  void glColor3f( float red, float green, float blue )
  void glVertex2f( float x, float y )
  void glEnd(  )

cdef extern from "GL/glut.h":
  void glutSwapBuffers( )
  void glutInit( int* pargc, char** argv )
  void glutInitDisplayMode( unsigned int displayMode )
  void glutInitWindowPosition( int x, int y )
  void glutInitWindowSize( int width, int height )
  int glutCreateWindow( char* title )
  void glutDisplayFunc( void (* callback)( ) )
  void glutMainLoop( )