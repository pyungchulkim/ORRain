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

var gl = GL.create();
var water;
var cubemap;
var renderer;

// Initial scene
var angleX = -30;  // looking from standing at the shore
var angleY = 0;  // looking from the center
var fov = 20.0;  // start with lower number to minimize fisheye distortion
var aspect = 2.0;
var near = 0.1;
var far = 100.0;

var paused = false;
var ratio = window.devicePixelRatio || 1;

// Control parameters for rain drops
var dropsMean = 3.0;
var radiusMean = 0.01;
var strengthMean = 0.001;

window.onload = function() {
  
  // Design the scene - this will happen between each frame update
  function updateScene() {
    var d = Math.max(1.0, gaussianRandom(dropsMean));
    for (var i = 0; i < d; i++) {
      var r = Math.max(0.0, gaussianRandom(radiusMean));
      var s = gaussianRandom(strengthMean);
      water.addDrop(Math.random() * 2 - 1, Math.random() * 2 - 1, r, s);
    }
  }
  
  function gaussianRandom(mean) {
    const stdev = mean / 3.0;
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
  }
  
  document.body.appendChild(gl.canvas);
  gl.clearColor(0, 0, 0, 1);

  water = new Water();
  renderer = new Renderer();
  cubemap = new Cubemap({
    xneg: document.getElementById('land'),
    xpos: document.getElementById('land'),
    yneg: document.getElementById('sky'),
    ypos: document.getElementById('sky'),
    zneg: document.getElementById('land'),
    zpos: document.getElementById('land')
  });

  onresize();
  window.onresize = onresize;

  function onresize() {
    var width = innerWidth;
    var height = innerHeight;
    console.log(width, height);
    gl.canvas.width = width * ratio;
    gl.canvas.height = height * ratio;
    gl.canvas.style.width = width + 'px';
    gl.canvas.style.height = height + 'px';
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.matrixMode(gl.PROJECTION);
    gl.loadIdentity();
    gl.perspective(fov, aspect, near, far);
    gl.matrixMode(gl.MODELVIEW);
    draw();
  }

  function animate() {
    if (!paused) {
      update();
      draw();
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  var leftPressed = false;  // true when left mouse button is pressed
  var dragged = false;  // true when the mouse is actually dragged
  var oldX, oldY;

  document.onmousedown = function(e) {
    if (e.button == 0) {
      e.preventDefault();
      oldX = e.pageX;
      oldY = e.pageY;
      leftPressed = true;
      dragged = false;
    }
  };

  document.onmousemove = function(e) {
    if (leftPressed && (e.pageX != oldX || e.pageY != oldY)) {
      // rotate by dragging
      angleY -= (e.pageX - oldX) * 0.1;
      angleX -= (e.pageY - oldY) * 0.1;
      angleX = Math.max(-89.999, Math.min(89.999, angleX));
      oldX = e.pageX;
      oldY = e.pageY;
      dragged = true;
      draw();
    }
  };

  document.onmouseup = function() {
    leftPressed = false;
  };

  document.onclick = function(e) {
    if (!dragged) {
      // mouse clicked (not dragged) - add a drop to the water surface
      var tracer = new GL.Raytracer();
      var ray = tracer.getRayForPixel(e.pageX * ratio, e.pageY * ratio);
      var pointOnPlane = tracer.eye.add(ray.multiply(-tracer.eye.y / ray.y));
      if (Math.abs(pointOnPlane.x) < 1 && Math.abs(pointOnPlane.z) < 1) {
        var r = gaussianRandom(radiusMean);
        var s = gaussianRandom(strengthMean);
        water.addDrop(pointOnPlane.x, pointOnPlane.z, r, s);
        if (paused) {
          water.updateNormals();
        }
      }
    }
  };

  document.onkeypress = function(e) {
    if (e.which == '+'.charCodeAt(0)) {
      // Zoom-in
      fov /= 1.1;
      gl.matrixMode(gl.PROJECTION);
      gl.loadIdentity();
      gl.perspective(fov, aspect, near, far);
      gl.matrixMode(gl.MODELVIEW);
      draw();
    }
    else if (e.which == '-'.charCodeAt(0)) {
      // Zoom-out
      fov *= 1.1;
      gl.matrixMode(gl.PROJECTION);
      gl.loadIdentity();
      gl.perspective(fov, aspect, near, far);
      gl.matrixMode(gl.MODELVIEW);
      draw();
    }
    else if (e.which == 'p'.charCodeAt(0) || e.which == 'P'.charCodeAt(0)) {
      paused = !paused;
    }
  };

  function update() {
    updateScene();
    // Update the water simulation and graphics
    water.stepSimulation();
    water.updateNormals();
  }

  function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.loadIdentity();
    gl.translate(0, -0.3, -2.5);
    gl.rotate(-angleX, 1, 0, 0);
    gl.rotate(-angleY, 0, 1, 0);
    gl.translate(0, 0.5, 0);

    gl.enable(gl.DEPTH_TEST);
    renderer.renderWater(water, cubemap);
    gl.disable(gl.DEPTH_TEST);
  }
};
