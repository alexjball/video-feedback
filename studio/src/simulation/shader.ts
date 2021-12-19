export const processColor = /* glsl */ `
  void processColor(inout vec4 color, float gain, float cycle, bool invert) {
    if (gain > 0.0) {
      float gainStep = gain * 0.25;
      float med = color.x * 0.299 + color.y * 0.587 + color.z * 0.114;
      color.x = med + (color.x - med) * (1.0 + gainStep);
      color.y = med + (color.y - med) * (1.0 + gainStep);
      color.z = med + (color.z - med) * (1.0 + gainStep);
      if (color.x < 0.0) {
        color.x = 0.0;
      } else if (color.x > 1.0) {
        color.x = 1.0;
      }
      if (color.y < 0.0) {
        color.y = 0.0;
      } else if (color.y > 1.0) {
        color.y = 1.0;
      }
      if (color.z < 0.0) {
        color.z = 0.0;
      } else if (color.z > 1.0) {
        color.z = 1.0;
      }
    }
    if (cycle > 0.0) {
      float Q1 = sin(cycle * 1.57) / 1.73;
      float Q2 = (1.0 - cos(cycle * 1.57)) / 3.0;
      float r1 = Q2 * (color.y - color.x - color.x + color.z) -
                Q1 * (color.z - color.y) + color.x;
      float z =
          Q2 * (color.z - color.y - color.x + color.z) + Q1 * (color.y - color.x);
      color.y += z + (color.x - r1);
      color.z -= z;
      color.x = r1;
    }
    if (invert) color.xyz = vec3(1.0, 1.0, 1.0) - color.xyz;
  }`,
  applyMirroring = /* glsl */ `
    void applyMirroring(inout vec2 uv, bool mirrorX, bool mirrorY) {
      if (mirrorX && vUv.x > 0.5) uv.x = 1.0 - vUv.x;
      if (mirrorY && vUv.y > 0.5) uv.y = 1.0 - vUv.y;
    }`,
  /**
   * Packs pixel depth, source label, and settled bit into one RGB pixel. The
   * settled bit is the MSB of r. label is the other 7 bits. Depth is g + b. a
   * is 1.
   */
  encodeDecodeDepth = /* glsl */ `
    vec4 encode(vec3 settledDepthLabel) {
      bool settled = settledDepthLabel.x != 0.;
      int depth = int(round(settledDepthLabel.y));
      int label = int(round(settledDepthLabel.z));

      return vec4(round((settled ? 128. : 0.) + float(label)), depth >> 8, depth & 255, 1.) / 255.;
    }  
    vec3 decode(vec4 color) {
      vec4 enc = color * 255.;
      int r = int(round(enc.r));
      bool settled = (r >> 7) == 1;
      int label = r & 127;
      int depth = int(round(256. * enc.g + enc.b));
      return vec3(settled ? 1. : 0., float(depth), float(label));
    }`,
  baseVertexShader = /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,
  /** https://www.shadertoy.com/view/XljGzV */
  colorConversion = /* glsl */ `
    vec3 hsl2rgb( in vec3 c ) {
      vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
      return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
    }`,
  noise = /* glsl */ `
    float iqhash( float n ) {
      return fract(sin(n)*43758.5453);
    }

    float iqnoise( vec3 x ){
      // The noise function returns a value in the range -1.0f -> 1.0f
      vec3 p = floor(x);
      vec3 f = fract(x);

      f       = f*f*(3.0-2.0*f);
      float n = p.x + p.y*57.0 + 113.0*p.z;
      return mix(mix(mix( iqhash(n+0.0  ), iqhash(n+1.0  ),f.x),
                     mix( iqhash(n+57.0 ), iqhash(n+58.0 ),f.x),f.y),
                 mix(mix( iqhash(n+113.0), iqhash(n+114.0),f.x),
                     mix( iqhash(n+170.0), iqhash(n+171.0),f.x),f.y),f.z);
    }`,
  minStrobeDepth = (15.0).toFixed(1),
  constants = /* glsl */ `
    const float PI = 3.1415926535897932384626433832795;
    `
