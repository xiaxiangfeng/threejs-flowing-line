import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import lineData from "./linegeo.js";
import d3geo from "./d3-geo.min.js";

const vertexShader = `uniform float time;
uniform float size;
uniform float len;
uniform vec3 bcolor;
uniform vec3 fcolor;
varying vec3 vColor; 
void main() {
  vColor = bcolor;
  vec3 pos = position;
  float d = uv.x - time;

  if(abs(d) < len) {
    pos = pos + normal * size;
    vColor = fcolor;
  }
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

const fragmentShader = `
varying vec3 vColor; 
void main() {
  gl_FragColor =vec4(vColor, 1.0);
}`;

let scene;
let renderer;
let camera;
let controls;
let canvas = document.getElementById("c");
let material;
let time = 0;

init();

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  //

  camera = new THREE.PerspectiveCamera(
    70,
    canvas.innerWidth / canvas.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 1;
  camera.position.x = 0;
  camera.position.y = 1;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe3dd);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();
  controls.enablePan = true;
  controls.enableDamping = true;

  const gridHelper = new THREE.GridHelper(2, 40, 0x808080, 0x808080);
  gridHelper.position.y = 0;
  gridHelper.position.x = 0;
  scene.add(gridHelper);

  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  let one;
  const points = lineData.map((d) => {
    const res = d3geo.geoMercator().scale(50)(d);
    if (!one) {
      one = res;
    }
    return new THREE.Vector3(res[0] - one[0], 0, res[1] - one[1]);
  });
  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0);

  const geometry = new THREE.TubeGeometry(
    curve,
    Math.round(points.length * 0.5),
    0.003,
    8,
    true
  );
  material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      len: { value: 0.05 },
      size: { value: 0.001 },
      bcolor: { value: new THREE.Color("#FFFFFF") },
      fcolor: { value: new THREE.Color(0xbfe3dd) },
    },
    vertexShader,
    fragmentShader,
  });

  const mesh = new THREE.Mesh(geometry, material);

  scene.add(mesh);
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }

  return needResize;
}

function render() {
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  controls.update();

  renderer.render(scene, camera);

  if (material) {
    if (time >= 1.0) {
      time = 0.0;
    }
    time = time + 0.005;
    material.uniforms.time.value = time;
  }

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
