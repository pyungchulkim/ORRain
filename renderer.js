/* ORRain - 
 * An experimental rain drop simulation for my art study. 
 * The code was copied from https://github.com/evanw/webgl-water and
 * modified for my purpose.
 *
 * Pyungchul Kim, 2025
 * http://orderedrandom.com
 *
 * Copyright statement from the original code:
 *
 * WebGL Water
 * http://madebyevan.com/webgl-water/
 *
 * Copyright 2011 Evan Wallace
 * Released under the MIT license
 */

function Renderer() {
  this.waterMesh = GL.Mesh.plane({ detail: 200});
  this.waterShaders = [];
  for (var i = 0; i < 2; i++) {
    this.waterShaders[i] = new GL.Shader('\
      uniform sampler2D water;\
      varying vec3 position;\
      void main() {\
        vec4 info = texture2D(water, gl_Vertex.xy * 0.5 + 0.5);\
        position = gl_Vertex.xzy;\
        position.y += info.r;\
        gl_Position = gl_ModelViewProjectionMatrix * vec4(position, 1.0);\
      }', '\
      uniform sampler2D water;\
      uniform vec3 eye;\
      varying vec3 position;\
      uniform samplerCube sky;\
      \
      vec3 getSurfaceRayColor(vec3 origin, vec3 ray) {\
        vec3 color;\
        color = textureCube(sky, ray).rgb;\
        return color;\
      }\
      \
      void main() {\
        vec2 coord = position.xz * 0.5 + 0.5;\
        vec4 info = texture2D(water, coord);\
        \
        /* make water look more "peaked" */\
        for (int i = 0; i < 5; i++) {\
          coord += info.ba * 0.005;\
          info = texture2D(water, coord);\
        }\
        \
        vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);\
        vec3 incomingRay = normalize(position - eye);\
        \
        vec3 reflectedRay = reflect(incomingRay, normal);\
        vec3 reflectedColor = getSurfaceRayColor(position, reflectedRay);\
        \
        gl_FragColor = vec4(reflectedColor, 1.0);\
      }\
    ');
  }
}

Renderer.prototype.renderWater = function(water, sky) {
  var tracer = new GL.Raytracer();
  water.textureA.bind(0);
  sky.bind(2);
  gl.enable(gl.CULL_FACE);
  for (var i = 0; i < 2; i++) {
    gl.cullFace(i ? gl.BACK : gl.FRONT);
    this.waterShaders[i].uniforms({
      water: 0,
      sky: 2,
      eye: tracer.eye
    }).draw(this.waterMesh);
  }
  gl.disable(gl.CULL_FACE);
};
