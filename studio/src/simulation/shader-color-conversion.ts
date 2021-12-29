/** Source: https://www.shadertoy.com/view/wt23Rt */
export const colorConversion = /* glsl */ `
  //Hue to RGB (red, green, blue).
  //Source: https://github.com/tobspr/GLSL-Color-Spaces/blob/master/ColorSpaces.inc.glsl
  #ifndef saturate
  #define saturate(v) clamp(v,0.,1.)
  //      clamp(v,0.,1.)
  #endif

  vec3 hsl2rgb( in vec3 c ) {
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
  }

  vec3 hue2rgb(float hue){
    hue=fract(hue);
    return saturate(vec3(
      abs(hue*6.-3.)-1.,
      2.-abs(hue*6.-2.),
      2.-abs(hue*6.-4.)
      ));
    }
    
  //HSV (hue, saturation, value) to RGB.
  //Sources: https://gist.github.com/yiwenl/745bfea7f04c456e0101, https://gist.github.com/sugi-cho/6a01cae436acddd72bdf
  vec3 hsv2rgb(vec3 c){
    vec4 K=vec4(1.,2./3.,1./3.,3.);
    return c.z*mix(K.xxx,saturate(abs(fract(c.x+K.xyz)*6.-K.w)-K.x),c.y);
  }

  //RGB to HSV.
  //Source: https://gist.github.com/yiwenl/745bfea7f04c456e0101
  vec3 rgb2hsv(vec3 c) {
    float cMax=max(max(c.r,c.g),c.b),
    cMin=min(min(c.r,c.g),c.b),
    delta=cMax-cMin;
    vec3 hsv=vec3(0.,0.,cMax);
    if(cMax>cMin){
      hsv.y=delta/cMax;
      if(c.r==cMax){
        hsv.x=(c.g-c.b)/delta;
      }else if(c.g==cMax){
        hsv.x=2.+(c.b-c.r)/delta;
      }else{
        hsv.x=4.+(c.r-c.g)/delta;
      }
      hsv.x=fract(hsv.x/6.);
    }
    return hsv;
  }
  //Source: https://gist.github.com/sugi-cho/6a01cae436acddd72bdf
  vec3 rgb2hsv_2(vec3 c){
    vec4 K=vec4(0.,-1./3.,2./3.,-1.),
    p=mix(vec4(c.bg ,K.wz),vec4(c.gb,K.xy ),step(c.b,c.g)),
    q=mix(vec4(p.xyw,c.r ),vec4(c.r ,p.yzx),step(p.x,c.r));
    float d=q.x-min(q.w,q.y),
    e=1e-10;
    return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);
  }

  //RGB to HSL (hue, saturation, lightness/luminance).
  //Source: https://gist.github.com/yiwenl/745bfea7f04c456e0101
  vec3 rgb2hsl(vec3 c){
    float cMin=min(min(c.r,c.g),c.b),
    cMax=max(max(c.r,c.g),c.b),
    delta=cMax-cMin;
    vec3 hsl=vec3(0.,0.,(cMax+cMin)/2.);
    if(delta!=0.0){ //If it has chroma and isn't gray.
      if(hsl.z<.5){
        hsl.y=delta/(cMax+cMin); //Saturation.
      }else{
        hsl.y=delta/(2.-cMax-cMin); //Saturation.
      }
      float deltaR=(((cMax-c.r)/6.)+(delta/2.))/delta,
      deltaG=(((cMax-c.g)/6.)+(delta/2.))/delta,
      deltaB=(((cMax-c.b)/6.)+(delta/2.))/delta;
      //Hue.
      if(c.r==cMax){
        hsl.x=deltaB-deltaG;
      }else if(c.g==cMax){
        hsl.x=(1./3.)+deltaR-deltaB;
      }else{ //if(c.b==cMax){
        hsl.x=(2./3.)+deltaG-deltaR;
      }
      hsl.x=fract(hsl.x);
    }
    return hsl;
  }

  //HSL to RGB.
  //Source: https://github.com/Jam3/glsl-hsl2rgb/blob/master/index.glsl
  /*float hueRamp(float a,float b,float hue){
    hue=fract(hue);
    float o=a;
    if((6.*hue)<1.){
      o=a+(b-a)*6.*hue;
    }else if((2.*hue)<1.){
      o=b;
    }else if((3.*hue)<2.){
      o=a+(b-a)*((2./3.)-hue)*6.;
    }
    return o;
  }*/
  vec3 hsl2rgb_2(vec3 hsl){
    if(hsl.y==0.){
      return vec3(hsl.z); //Luminance.
    }else{
      float b;
      if(hsl.z<.5){
        b=hsl.z*(1.+hsl.y);
      }else{
        b=hsl.z+hsl.y-hsl.y*hsl.z;
      }
      float a=2.*hsl.z-b;
      return a+hue2rgb(hsl.x)*(b-a);
      /*vec3(
        hueRamp(a,b,hsl.x+(1./3.)),
        hueRamp(a,b,hsl.x),
        hueRamp(a,b,hsl.x-(1./3.))
        );*/
      }
    }`
