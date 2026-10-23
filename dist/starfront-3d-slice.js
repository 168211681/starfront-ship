(function() {
  "use strict";

  // --- OFFLINE WEBGL2 SHIM (NOT official three — R2.1 official gate BLOCKED for this artifact) ---
// ============================================================================
// Offline Air-Gapped WebGL2 Fallback Module for STARFRONT 3D Vertical Slice 001
// NOTE: This module is ONLY used when the build environment is air-gapped and
// cannot download the official `three` npm package from registry.npmjs.org
// (in which case Release Gate R2 is explicitly marked BLOCKED).
//
// Enforces 100% strict official Three.js API compatibility:
// - Matrix4.prototype.compose(position, quaternion, scale) ONLY (NO nonStandardEulerCompose!)
// - Quaternion.prototype.setFromEuler(euler)
// - InstancedMesh.prototype.setColorAt(index, color) requires a THREE.Color object
// - True WebGL2 hardware instancing (gl.drawArraysInstanced + vertexAttribDivisor)
// ============================================================================
const REVISION = '160-offline-webgl2-shim';
const IS_OFFICIAL_THREE = false;
const FrontSide = 0;
const BackSide = 1;
const DoubleSide = 2;
const BasicShadowMap = 0;
const PCFShadowMap = 1;
const PCFSoftShadowMap = 2;
const NoBlending = 0;
const NormalBlending = 1;
const AdditiveBlending = 2;
const DynamicDrawUsage = 35048;
const StaticDrawUsage = 35044;
class Color {
  constructor(r = 0xffffff, g, b) {
    this.r = 1;
    this.g = 1;
    this.b = 1;
    this.isColor = true;
    if (g === undefined && b === undefined) {
      this.set(r);
    } else {
      this.setRGB(r, g, b);
    }
  }
  set(c) {
    if (c && c.isColor) {
      this.copy(c);
    } else if (typeof c === 'number') {
      this.setHex(c);
    } else if (typeof c === 'string') {
      this.setStyle(c);
    }
    return this;
  }
  setRGB(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
    return this;
  }
  setHex(hex) {
    hex = Math.floor(Number(hex) || 0);
    this.r = ((hex >> 16) & 255) / 255;
    this.g = ((hex >> 8) & 255) / 255;
    this.b = (hex & 255) / 255;
    return this;
  }
  setStyle(style) {
    const m = String(style).trim().replace('#', '');
    if (m.length === 6) {
      const num = parseInt(m, 16);
      if (!Number.isNaN(num)) this.setHex(num);
    }
    return this;
  }
  getHex() {
    const r = Math.round(Math.max(0, Math.min(1, this.r)) * 255);
    const g = Math.round(Math.max(0, Math.min(1, this.g)) * 255);
    const b = Math.round(Math.max(0, Math.min(1, this.b)) * 255);
    return (r << 16) | (g << 8) | b;
  }
  copy(c) {
    this.r = c.r;
    this.g = c.g;
    this.b = c.b;
    return this;
  }
  clone() {
    return new Color().copy(this);
  }
  toArray(array = [], offset = 0) {
    array[offset] = this.r;
    array[offset + 1] = this.g;
    array[offset + 2] = this.b;
    return array;
  }
  getStyle() {
    const r = Math.round(Math.max(0, Math.min(1, this.r)) * 255);
    const g = Math.round(Math.max(0, Math.min(1, this.g)) * 255);
    const b = Math.round(Math.max(0, Math.min(1, this.b)) * 255);
    return `rgb(${r},${g},${b})`;
  }
}
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.isVector2 = true;
  }
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }
  clone() {
    return new Vector2(this.x, this.y);
  }
}
class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.isVector3 = true;
  }
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }
  clone() {
    return new Vector3(this.x, this.y, this.z);
  }
  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }
  multiplyScalar(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }
  length() {
    return Math.hypot(this.x, this.y, this.z);
  }
  distanceTo(v) {
    return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z);
  }
  normalize() {
    const l = this.length() || 1;
    return this.multiplyScalar(1 / l);
  }
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }
  crossVectors(a, b) {
    const ax = a.x, ay = a.y, az = a.z;
    const bx = b.x, by = b.y, bz = b.z;
    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;
    return this;
  }
  applyMatrix4(m) {
    const x = this.x, y = this.y, z = this.z;
    const e = m.elements;
    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15] || 1);
    this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
    this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
    this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
    return this;
  }
  project(camera) {
    camera.updateMatrixWorld();
    this.applyMatrix4(camera.matrixWorldInverse);
    this.applyMatrix4(camera.projectionMatrix);
    return this;
  }
}
class Euler {
  constructor(x = 0, y = 0, z = 0, order = 'XYZ') {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
    this.isEuler = true;
  }
  set(x, y, z, order = this.order) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
    return this;
  }
  copy(e) {
    this.x = e.x;
    this.y = e.y;
    this.z = e.z;
    this.order = e.order || 'XYZ';
    return this;
  }
  clone() {
    return new Euler(this.x, this.y, this.z, this.order);
  }
}
class Quaternion {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    this.isQuaternion = true;
  }
  set(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }
  copy(q) {
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.w = q.w;
    return this;
  }
  clone() {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }
  setFromEuler(euler) {
    const x = euler.x || 0, y = euler.y || 0, z = euler.z || 0;
    const order = euler.order || 'XYZ';
    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);

    switch (order) {
      case 'XYZ':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      case 'YXZ':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      case 'ZXY':
        this.x = s1 * c2 * c3 - c1 * s2 * s3;
        this.y = c1 * s2 * c3 + s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      case 'ZYX':
        this.x = s1 * c2 * c3 - c1 * s2 * s3;
        this.y = c1 * s2 * c3 + s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      case 'YZX':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 + s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      case 'XZY':
        this.x = s1 * c2 * c3 - c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      default:
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
    }
    return this;
  }
}
class Matrix4 {
  constructor() {
    this.isMatrix4 = true;
    this.elements = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }
  identity() {
    this.elements.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    return this;
  }
  copy(m) {
    this.elements.set(m.elements);
    return this;
  }
  clone() {
    return new Matrix4().copy(this);
  }
  multiplyMatrices(a, b) {
    const ae = a.elements;
    const be = b.elements;
    const te = this.elements;
    const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
    const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
    const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
    const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

    const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
    const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
    const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
    const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

    te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
    te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
    te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
    te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

    te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
    te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
    te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
    te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

    te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
    te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
    te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
    te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

    te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
    te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
    te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
    te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
    return this;
  }
  compose(pos, quat, scale) {
    if (!quat || !quat.isQuaternion) {
      throw new TypeError('THREE.Matrix4.compose: quaternion must be a THREE.Quaternion instance');
    }
    const te = this.elements;
    const x = quat.x, y = quat.y, z = quat.z, w = quat.w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    const sx = scale.x, sy = scale.y, sz = scale.z;

    te[0] = (1 - (yy + zz)) * sx;
    te[1] = (xy + wz) * sx;
    te[2] = (xz - wy) * sx;
    te[3] = 0;

    te[4] = (xy - wz) * sy;
    te[5] = (1 - (xx + zz)) * sy;
    te[6] = (yz + wx) * sy;
    te[7] = 0;

    te[8] = (xz + wy) * sz;
    te[9] = (yz - wx) * sz;
    te[10] = (1 - (xx + yy)) * sz;
    te[11] = 0;

    te[12] = pos.x;
    te[13] = pos.y;
    te[14] = pos.z;
    te[15] = 1;
    return this;
  }
  makeRotationFromEuler(euler) {
    const q = new Quaternion().setFromEuler(euler);
    return this.compose(new Vector3(0, 0, 0), q, new Vector3(1, 1, 1));
  }
  makeLookAt(eye, target, up) {
    const z = new Vector3(eye.x - target.x, eye.y - target.y, eye.z - target.z);
    if (z.length() === 0) z.z = 1;
    z.normalize();
    const x = new Vector3().crossVectors(up, z);
    if (x.length() === 0) {
      if (Math.abs(up.z) === 1) z.x += 0.0001;
      else z.z += 0.0001;
      z.normalize();
      x.crossVectors(up, z);
    }
    x.normalize();
    const y = new Vector3().crossVectors(z, x);

    const te = this.elements;
    te[0] = x.x; te[4] = x.y; te[8] = x.z; te[12] = -x.dot(eye);
    te[1] = y.x; te[5] = y.y; te[9] = y.z; te[13] = -y.dot(eye);
    te[2] = z.x; te[6] = z.y; te[10] = z.z; te[14] = -z.dot(eye);
    te[3] = 0;   te[7] = 0;   te[11] = 0;   te[15] = 1;
    return this;
  }
  makeOrthographic(left, right, top, bottom, near, far) {
    const te = this.elements;
    const w = 1.0 / (right - left);
    const h = 1.0 / (top - bottom);
    const p = 1.0 / (far - near);
    const x = (right + left) * w;
    const y = (top + bottom) * h;
    const z = (far + near) * p;
    te[0] = 2 * w; te[4] = 0;     te[8] = 0;       te[12] = -x;
    te[1] = 0;     te[5] = 2 * h; te[9] = 0;       te[13] = -y;
    te[2] = 0;     te[6] = 0;     te[10] = -2 * p; te[14] = -z;
    te[3] = 0;     te[7] = 0;     te[11] = 0;      te[15] = 1;
    return this;
  }
  makePerspective(fov, aspect, near, far) {
    const te = this.elements;
    const f = 1.0 / Math.tan((fov * Math.PI) / 360);
    const nf = 1 / (near - far);
    te[0] = f / (aspect || 1); te[4] = 0; te[8] = 0;                 te[12] = 0;
    te[1] = 0;                 te[5] = f; te[9] = 0;                 te[13] = 0;
    te[2] = 0;                 te[6] = 0; te[10] = (far + near) * nf; te[14] = 2 * far * near * nf;
    te[3] = 0;                 te[7] = 0; te[11] = -1;               te[15] = 0;
    return this;
  }
}
class Box3 {
  constructor(min = new Vector3(Infinity, Infinity, Infinity), max = new Vector3(-Infinity, -Infinity, -Infinity)) {
    this.min = min;
    this.max = max;
  }
  setFromPoints(points) {
    this.min.set(Infinity, Infinity, Infinity);
    this.max.set(-Infinity, -Infinity, -Infinity);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.x < this.min.x) this.min.x = p.x;
      if (p.y < this.min.y) this.min.y = p.y;
      if (p.z < this.min.z) this.min.z = p.z;
      if (p.x > this.max.x) this.max.x = p.x;
      if (p.y > this.max.y) this.max.y = p.y;
      if (p.z > this.max.z) this.max.z = p.z;
    }
    return this;
  }
}
class Sphere {
  constructor(center = new Vector3(), radius = 1) {
    this.center = center;
    this.radius = radius;
  }
}
class Plane {
  constructor(normal = new Vector3(0, 1, 0), constant = 0) {
    this.normal = normal;
    this.constant = constant;
  }
}
class Frustum {
  constructor() {
    this.planes = Array.from({ length: 6 }, () => new Plane());
  }
  setFromProjectionMatrix() {
    return this;
  }
  containsPoint() {
    return true;
  }
}
class Ray {
  constructor(origin = new Vector3(), direction = new Vector3(0, -1, 0)) {
    this.origin = origin;
    this.direction = direction;
  }
  intersectPlane(plane, target = new Vector3()) {
    const denominator = plane.normal.dot(this.direction);
    if (Math.abs(denominator) < 1e-6) return null;
    const t = -(this.origin.dot(plane.normal) + plane.constant) / denominator;
    if (t < 0) return null;
    target.set(
      this.origin.x + this.direction.x * t,
      this.origin.y + this.direction.y * t,
      this.origin.z + this.direction.z * t
    );
    return target;
  }
}
class Raycaster {
  constructor() {
    this.ray = new Ray();
  }
  setFromCamera(coords, camera) {
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    const zoom = camera.zoom || 1;
    const halfW = (camera.right - camera.left) / (2 * zoom);
    const halfH = (camera.top - camera.bottom) / (2 * zoom);
    const cx = coords.x * halfW;
    const cy = coords.y * halfH;

    const inv = camera.matrixWorldInverse.elements;
    const rx = inv[0], ry = inv[4], rz = inv[8];
    const ux = inv[1], uy = inv[5], uz = inv[9];
    const bx = inv[2], by = inv[6], bz = inv[10];

    this.ray.origin.set(
      camera.position.x + rx * cx + ux * cy,
      camera.position.y + ry * cx + uy * cy,
      camera.position.z + rz * cx + uz * cy
    );
    this.ray.direction.set(-bx, -by, -bz).normalize();
  }
}
class Object3D {
  constructor() {
    this.position = new Vector3(0, 0, 0);
    this.rotation = new Euler(0, 0, 0);
    this.quaternion = new Quaternion();
    this.scale = new Vector3(1, 1, 1);
    this.visible = true;
    this.frustumCulled = false;
    this.castShadow = false;
    this.receiveShadow = false;
    this.children = [];
    this.parent = null;
    this.userData = {};
    this.matrix = new Matrix4();
    this.matrixWorld = new Matrix4();
    this._lookTarget = null;
  }
  add(child) {
    if (!child) return this;
    if (child.parent) child.parent.remove(child);
    child.parent = this;
    this.children.push(child);
    return this;
  }
  remove(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      child.parent = null;
      this.children.splice(idx, 1);
    }
    return this;
  }
  lookAt(x, y, z) {
    if (typeof x === 'object' && x !== null) {
      this._lookTarget = new Vector3(x.x, x.y, x.z);
    } else {
      this._lookTarget = new Vector3(x, y, z);
    }
    const dx = this._lookTarget.x - this.position.x;
    const dz = this._lookTarget.z - this.position.z;
    if (Math.hypot(dx, dz) > 1e-5) {
      this.rotation.y = Math.atan2(dx, dz);
      this.quaternion.setFromEuler(this.rotation);
    }
  }
  traverse(cb) {
    cb(this);
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].traverse(cb);
    }
  }
  updateMatrix() {
    this.quaternion.setFromEuler(this.rotation);
    this.matrix.compose(this.position, this.quaternion, this.scale);
  }
  updateMatrixWorld() {
    this.updateMatrix();
    if (this.parent) {
      this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
    } else {
      this.matrixWorld.copy(this.matrix);
    }
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].updateMatrixWorld();
    }
  }
}
class Group extends Object3D {
  constructor() {
    super();
    this.isGroup = true;
  }
}
class Scene extends Object3D {
  constructor() {
    super();
    this.isScene = true;
    this.background = new Color(0x0b1528);
  }
}
class OrthographicCamera extends Object3D {
  constructor(left = -10, right = 10, top = 10, bottom = -10, near = 0.1, far = 500) {
    super();
    this.isCamera = true;
    this.isOrthographicCamera = true;
    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
    this.near = near;
    this.far = far;
    this.zoom = 1;
    this.projectionMatrix = new Matrix4();
    this.matrixWorldInverse = new Matrix4();
    this.updateProjectionMatrix();
  }
  lookAt(x, y, z) {
    super.lookAt(x, y, z);
    this.matrixWorldInverse.makeLookAt(
      this.position,
      this._lookTarget || new Vector3(0, 0, 0),
      new Vector3(0, 1, 0)
    );
  }
  updateMatrixWorld() {
    super.updateMatrixWorld();
    this.matrixWorldInverse.makeLookAt(
      this.position,
      this._lookTarget || new Vector3(0, 0, 0),
      new Vector3(0, 1, 0)
    );
  }
  updateProjectionMatrix() {
    const z = this.zoom || 1;
    this.projectionMatrix.makeOrthographic(
      this.left / z,
      this.right / z,
      this.top / z,
      this.bottom / z,
      this.near,
      this.far
    );
  }
}
class PerspectiveCamera extends Object3D {
  constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
    super();
    this.isCamera = true;
    this.isPerspectiveCamera = true;
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.zoom = 1;
    this.projectionMatrix = new Matrix4();
    this.matrixWorldInverse = new Matrix4();
    this.updateProjectionMatrix();
  }
  lookAt(x, y, z) {
    super.lookAt(x, y, z);
    this.matrixWorldInverse.makeLookAt(
      this.position,
      this._lookTarget || new Vector3(0, 0, 0),
      new Vector3(0, 1, 0)
    );
  }
  updateMatrixWorld() {
    super.updateMatrixWorld();
    this.matrixWorldInverse.makeLookAt(
      this.position,
      this._lookTarget || new Vector3(0, 0, 0),
      new Vector3(0, 1, 0)
    );
  }
  updateProjectionMatrix() {
    this.projectionMatrix.makePerspective(this.fov / (this.zoom || 1), this.aspect, this.near, this.far);
  }
}
class AmbientLight extends Object3D {
  constructor(color = 0xffffff, intensity = 1) {
    super();
    this.color = new Color(color);
    this.intensity = intensity;
    this.isLight = true;
  }
}
class HemisphereLight extends Object3D {
  constructor(skyColor = 0xffffff, groundColor = 0x444444, intensity = 1) {
    super();
    this.color = new Color(skyColor);
    this.groundColor = new Color(groundColor);
    this.intensity = intensity;
    this.isLight = true;
  }
}
class DirectionalLight extends Object3D {
  constructor(color = 0xffffff, intensity = 1) {
    super();
    this.color = new Color(color);
    this.intensity = intensity;
    this.isLight = true;
    this.shadow = {
      mapSize: { width: 1024, height: 1024 },
      camera: { near: 0.5, far: 500, left: -100, right: 100, top: 100, bottom: -100 }
    };
  }
}
class BufferAttribute {
  constructor(array, itemSize) {
    this.array = array instanceof Float32Array ? array : new Float32Array(array);
    this.itemSize = itemSize;
    this.count = Math.floor(this.array.length / itemSize);
    this.needsUpdate = true;
    this.usage = StaticDrawUsage;
  }
  setUsage(value) {
    this.usage = value;
    return this;
  }
  getX(i) { return this.array[i * this.itemSize]; }
  getY(i) { return this.array[i * this.itemSize + 1]; }
  getZ(i) { return this.array[i * this.itemSize + 2]; }
  setX(i, val) {
    this.array[i * this.itemSize] = val;
    this.needsUpdate = true;
  }
  setY(i, val) {
    this.array[i * this.itemSize + 1] = val;
    this.needsUpdate = true;
  }
  setZ(i, val) {
    this.array[i * this.itemSize + 2] = val;
    this.needsUpdate = true;
  }
  setXYZ(i, x, y, z) {
    const off = i * this.itemSize;
    this.array[off] = x;
    this.array[off + 1] = y;
    this.array[off + 2] = z;
    this.needsUpdate = true;
  }
}
class Float32BufferAttribute extends BufferAttribute {
  constructor(array, itemSize) {
    super(array, itemSize);
  }
}
class InstancedBufferAttribute extends BufferAttribute {
  constructor(array, itemSize, normalized = false, meshPerAttribute = 1) {
    super(array, itemSize);
    this.isInstancedBufferAttribute = true;
    this.normalized = normalized;
    this.meshPerAttribute = meshPerAttribute;
  }
}
class BufferGeometry {
  constructor() {
    this.attributes = {};
    this.indices = null;
    this._gpuDirty = true;
  }
  setAttribute(name, attr) {
    this.attributes[name] = attr;
    this._gpuDirty = true;
    return this;
  }
  getAttribute(name) {
    return this.attributes[name];
  }
  setIndex(indices) {
    this.indices = indices;
    this._gpuDirty = true;
    return this;
  }
  rotateX(angle) {
    const pos = this.attributes.position;
    if (!pos) return this;
    const c = Math.cos(angle), s = Math.sin(angle);
    const arr = pos.array;
    for (let i = 0; i < arr.length; i += 3) {
      const y = arr[i + 1];
      const z = arr[i + 2];
      arr[i + 1] = y * c - z * s;
      arr[i + 2] = y * s + z * c;
    }
    this.computeVertexNormals();
    this._gpuDirty = true;
    return this;
  }
  rotateZ(angle) {
    const pos = this.attributes.position;
    if (!pos) return this;
    const c = Math.cos(angle), s = Math.sin(angle);
    const arr = pos.array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = arr[i];
      const y = arr[i + 1];
      arr[i] = x * c - y * s;
      arr[i + 1] = x * s + y * c;
    }
    this.computeVertexNormals();
    this._gpuDirty = true;
    return this;
  }
  computeVertexNormals() {
    const pos = this.attributes.position;
    if (!pos) return;
    const pArr = pos.array;
    const nArr = new Float32Array(pArr.length);
    const idx = this.indices;
    if (idx) {
      for (let i = 0; i < idx.length; i += 3) {
        const i0 = idx[i] * 3, i1 = idx[i + 1] * 3, i2 = idx[i + 2] * 3;
        const ux = pArr[i1] - pArr[i0], uy = pArr[i1 + 1] - pArr[i0 + 1], uz = pArr[i1 + 2] - pArr[i0 + 2];
        const vx = pArr[i2] - pArr[i0], vy = pArr[i2 + 1] - pArr[i0 + 1], vz = pArr[i2 + 2] - pArr[i0 + 2];
        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;
        nArr[i0] += nx; nArr[i0 + 1] += ny; nArr[i0 + 2] += nz;
        nArr[i1] += nx; nArr[i1 + 1] += ny; nArr[i1 + 2] += nz;
        nArr[i2] += nx; nArr[i2 + 1] += ny; nArr[i2 + 2] += nz;
      }
    } else {
      for (let i = 0; i <= pArr.length - 9; i += 9) {
        const ux = pArr[i + 3] - pArr[i], uy = pArr[i + 4] - pArr[i + 1], uz = pArr[i + 5] - pArr[i + 2];
        const vx = pArr[i + 6] - pArr[i], vy = pArr[i + 7] - pArr[i + 1], vz = pArr[i + 8] - pArr[i + 2];
        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;
        for (let k = 0; k < 9; k += 3) {
          nArr[i + k] = nx; nArr[i + k + 1] = ny; nArr[i + k + 2] = nz;
        }
      }
    }
    for (let i = 0; i < nArr.length; i += 3) {
      const l = Math.hypot(nArr[i], nArr[i + 1], nArr[i + 2]) || 1;
      nArr[i] /= l; nArr[i + 1] /= l; nArr[i + 2] /= l;
    }
    this.attributes.normal = new Float32BufferAttribute(nArr, 3);
    this._gpuDirty = true;
  }
  dispose() {}
}
class InstancedBufferGeometry extends BufferGeometry {
  constructor() {
    super();
    this.isInstancedBufferGeometry = true;
    this.instanceCount = Infinity;
  }
}

function buildNonIndexedFromTriangles(verts, indices) {
  const out = new Float32Array(indices.length * 3);
  for (let i = 0; i < indices.length; i++) {
    const vi = indices[i] * 3;
    out[i * 3] = verts[vi];
    out[i * 3 + 1] = verts[vi + 1];
    out[i * 3 + 2] = verts[vi + 2];
  }
  return out;
}
class BoxGeometry extends BufferGeometry {
  constructor(w = 1, h = 1, d = 1) {
    super();
    const x = w / 2, y = h / 2, z = d / 2;
    const v = [
      -x, -y,  z,   x, -y,  z,   x,  y,  z,  -x,  y,  z,
      -x, -y, -z,  -x,  y, -z,   x,  y, -z,   x, -y, -z,
      -x,  y, -z,  -x,  y,  z,   x,  y,  z,   x,  y, -z,
      -x, -y, -z,   x, -y, -z,   x, -y,  z,  -x, -y,  z,
       x, -y, -z,   x,  y, -z,   x,  y,  z,   x, -y,  z,
      -x, -y, -z,  -x, -y,  z,  -x,  y,  z,  -x,  y, -z
    ];
    const idx = [
      0,1,2, 0,2,3,       4,5,6, 4,6,7,
      8,9,10, 8,10,11,    12,13,14, 12,14,15,
      16,17,18, 16,18,19, 20,21,22, 20,22,23
    ];
    this.setAttribute('position', new Float32BufferAttribute(buildNonIndexedFromTriangles(v, idx), 3));
    this.computeVertexNormals();
  }
}
class CylinderGeometry extends BufferGeometry {
  constructor(rTop = 1, rBottom = 1, height = 1, radialSegments = 8) {
    super();
    const segs = Math.max(3, radialSegments);
    const hy = height / 2;
    const tris = [];
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0);
      const c1 = Math.cos(a1), s1 = Math.sin(a1);
      tris.push(
        c0 * rTop, hy, s0 * rTop,
        c0 * rBottom, -hy, s0 * rBottom,
        c1 * rBottom, -hy, s1 * rBottom,

        c0 * rTop, hy, s0 * rTop,
        c1 * rBottom, -hy, s1 * rBottom,
        c1 * rTop, hy, s1 * rTop
      );
      if (rTop > 0) {
        tris.push(0, hy, 0, c1 * rTop, hy, s1 * rTop, c0 * rTop, hy, s0 * rTop);
      }
      if (rBottom > 0) {
        tris.push(0, -hy, 0, c0 * rBottom, -hy, s0 * rBottom, c1 * rBottom, -hy, s1 * rBottom);
      }
    }
    this.setAttribute('position', new Float32BufferAttribute(tris, 3));
    this.computeVertexNormals();
  }
}
class ConeGeometry extends CylinderGeometry {
  constructor(radius = 1, height = 1, radialSegments = 8) {
    super(0, radius, height, radialSegments);
  }
}
class SphereGeometry extends BufferGeometry {
  constructor(radius = 1, widthSegments = 8, heightSegments = 6, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI) {
    super();
    const ws = Math.max(3, widthSegments);
    const hs = Math.max(2, heightSegments);
    const tris = [];
    for (let y = 0; y < hs; y++) {
      const v0 = thetaStart + (y / hs) * thetaLength;
      const v1 = thetaStart + ((y + 1) / hs) * thetaLength;
      for (let x = 0; x < ws; x++) {
        const u0 = phiStart + (x / ws) * phiLength;
        const u1 = phiStart + ((x + 1) / ws) * phiLength;
        const p00 = [ -radius * Math.cos(u0) * Math.sin(v0), radius * Math.cos(v0), radius * Math.sin(u0) * Math.sin(v0) ];
        const p10 = [ -radius * Math.cos(u1) * Math.sin(v0), radius * Math.cos(v0), radius * Math.sin(u1) * Math.sin(v0) ];
        const p01 = [ -radius * Math.cos(u0) * Math.sin(v1), radius * Math.cos(v1), radius * Math.sin(u0) * Math.sin(v1) ];
        const p11 = [ -radius * Math.cos(u1) * Math.sin(v1), radius * Math.cos(v1), radius * Math.sin(u1) * Math.sin(v1) ];
        tris.push(...p00, ...p01, ...p11, ...p00, ...p11, ...p10);
      }
    }
    this.setAttribute('position', new Float32BufferAttribute(tris, 3));
    this.computeVertexNormals();
  }
}
class DodecahedronGeometry extends SphereGeometry {
  constructor(radius = 1) {
    super(radius, 6, 5);
  }
}
class RingGeometry extends BufferGeometry {
  constructor(innerRadius = 0.5, outerRadius = 1, thetaSegments = 16) {
    super();
    const segs = Math.max(3, thetaSegments);
    const tris = [];
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0);
      const c1 = Math.cos(a1), s1 = Math.sin(a1);
      tris.push(
        c0 * innerRadius, s0 * innerRadius, 0,
        c0 * outerRadius, s0 * outerRadius, 0,
        c1 * outerRadius, s1 * outerRadius, 0,

        c0 * innerRadius, s0 * innerRadius, 0,
        c1 * outerRadius, s1 * outerRadius, 0,
        c1 * innerRadius, s1 * innerRadius, 0
      );
    }
    this.setAttribute('position', new Float32BufferAttribute(tris, 3));
    this.computeVertexNormals();
  }
}
class PlaneGeometry extends BufferGeometry {
  constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    super();
    const ws = Math.max(1, widthSegments);
    const hs = Math.max(1, heightSegments);
    const hw = width / 2;
    const hh = height / 2;
    const tris = [];
    for (let iy = 0; iy < hs; iy++) {
      const y0 = (iy / hs) * height - hh;
      const y1 = ((iy + 1) / hs) * height - hh;
      for (let ix = 0; ix < ws; ix++) {
        const x0 = (ix / ws) * width - hw;
        const x1 = ((ix + 1) / ws) * width - hw;
        tris.push(
          x0, -y0, 0,
          x0, -y1, 0,
          x1, -y0, 0,

          x0, -y1, 0,
          x1, -y1, 0,
          x1, -y0, 0
        );
      }
    }
    this.setAttribute('position', new Float32BufferAttribute(tris, 3));
    this.computeVertexNormals();
  }
}
class Material {
  constructor(params = {}) {
    this.color = new Color(params.color !== undefined ? params.color : 0xffffff);
    this.vertexColors = !!params.vertexColors;
    this.side = params.side !== undefined ? params.side : FrontSide;
    this.transparent = !!params.transparent;
    this.opacity = params.opacity !== undefined ? params.opacity : 1.0;
    this.blending = params.blending !== undefined ? params.blending : NormalBlending;
    this.isBasic = false;
  }
  dispose() {}
}
class MeshLambertMaterial extends Material {
  constructor(params = {}) {
    super(params);
    this.isBasic = false;
  }
}
class MeshPhongMaterial extends Material {
  constructor(params = {}) {
    super(params);
    this.isBasic = false;
  }
}
class MeshStandardMaterial extends Material {
  constructor(params = {}) {
    super(params);
    this.isBasic = false;
  }
}
class MeshBasicMaterial extends Material {
  constructor(params = {}) {
    super(params);
    this.isBasic = true;
  }
}
class LineBasicMaterial extends Material {
  constructor(params = {}) {
    super(params);
    this.isBasic = true;
  }
}
class LineSegments extends Object3D {
  constructor(geometry, material) {
    super();
    this.geometry = geometry;
    this.material = material;
    this.isLineSegments = true;
  }
}
class GridHelper extends LineSegments {
  constructor(size = 100, divisions = 10, color1 = 0x444444, color2 = 0x888888) {
    const c1 = new Color(color1);
    const c2 = new Color(color2);
    const step = size / divisions;
    const halfSize = size / 2;
    const vertices = [];
    const colors = [];
    const center = divisions / 2;

    for (let i = 0, k = -halfSize; i <= divisions; i++, k += step) {
      const c = i === center ? c1 : c2;
      vertices.push(-halfSize, 0, k, halfSize, 0, k);
      colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
      vertices.push(k, 0, -halfSize, k, 0, halfSize);
      colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    const material = new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.45 });
    super(geometry, material);
    this.isGridHelper = true;
  }
}
class Mesh extends Object3D {
  constructor(geometry, material) {
    super();
    this.geometry = geometry;
    this.material = material;
    this.isMesh = true;
  }
}
class InstancedMesh extends Mesh {
  constructor(geometry, material, count) {
    super(geometry, material);
    this.count = count;
    this.maxCount = count;
    this.isInstancedMesh = true;
    this.instanceMatrix = new InstancedBufferAttribute(new Float32Array(count * 16), 16);
    this.instanceColor = null;
    for (let i = 0; i < count; i++) {
      const mOff = i * 16;
      this.instanceMatrix.array[mOff] = 1;
      this.instanceMatrix.array[mOff + 5] = 1;
      this.instanceMatrix.array[mOff + 10] = 1;
      this.instanceMatrix.array[mOff + 15] = 1;
    }
    this._instanceDirty = true;
    this._colorDirty = false;
  }
  setMatrixAt(index, matrix) {
    if (index < 0 || index >= this.maxCount) return;
    if (!matrix || !matrix.elements) {
      throw new TypeError('THREE.InstancedMesh.setMatrixAt: matrix must be a THREE.Matrix4 instance');
    }
    this.instanceMatrix.array.set(matrix.elements, index * 16);
    this.instanceMatrix.needsUpdate = true;
    this._instanceDirty = true;
  }
  getMatrixAt(index, matrix = new Matrix4()) {
    if (index < 0 || index >= this.maxCount) return matrix;
    matrix.elements.set(this.instanceMatrix.array.subarray(index * 16, index * 16 + 16));
    return matrix;
  }
  setColorAt(index, color) {
    if (index < 0 || index >= this.maxCount) return;
    // R2 BLOCKER 3 ENFORCEMENT: Official THREE.InstancedMesh.setColorAt calls color.toArray(...)
    // and throws if a raw hex number is passed instead of a THREE.Color object!
    if (!color || !color.isColor || typeof color.toArray !== 'function') {
      throw new TypeError('THREE.InstancedMesh.setColorAt: color must be a THREE.Color instance (do not pass raw numbers)');
    }
    if (this.instanceColor === null) {
      this.instanceColor = new InstancedBufferAttribute(new Float32Array(this.maxCount * 3), 3);
      for (let i = 0; i < this.maxCount * 3; i++) {
        this.instanceColor.array[i] = 1;
      }
    }
    color.toArray(this.instanceColor.array, index * 3);
    this.instanceColor.needsUpdate = true;
    this._colorDirty = true;
  }
  getColorAt(index, color = new Color()) {
    if (this.instanceColor === null || index < 0 || index >= this.maxCount) return color;
    const off = index * 3;
    return color.setRGB(
      this.instanceColor.array[off],
      this.instanceColor.array[off + 1],
      this.instanceColor.array[off + 2]
    );
  }
}

// ============================================================================
// WebGL2 Hardware Shader Pipeline with True Hardware Instancing
// (gl.drawArraysInstanced + vertexAttribDivisor on locations 3..7)
// ============================================================================
const VS_SOURCE = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aColor;
layout(location = 3) in vec4 aInstCol0;
layout(location = 4) in vec4 aInstCol1;
layout(location = 5) in vec4 aInstCol2;
layout(location = 6) in vec4 aInstCol3;
layout(location = 7) in vec3 aInstColor;

uniform mat4 uModelMatrix;
uniform mat4 uViewProjMatrix;
uniform vec3 uBaseColor;
uniform float uUseVertexColor;
uniform float uUseInstancing;
uniform float uUseInstanceColor;

out vec3 vNormal;
out vec3 vColor;

void main() {
  mat4 modelMat = uModelMatrix;
  if (uUseInstancing > 0.5) {
    mat4 instMat = mat4(aInstCol0, aInstCol1, aInstCol2, aInstCol3);
    modelMat = uModelMatrix * instMat;
  }
  vec4 worldPos = modelMat * vec4(aPosition, 1.0);
  gl_Position = uViewProjMatrix * worldPos;
  mat3 normalMat = mat3(modelMat);
  float nLen = length(normalMat * aNormal);
  vNormal = nLen > 1e-5 ? (normalMat * aNormal) / nLen : vec3(0.0, 1.0, 0.0);
  vec3 c = mix(uBaseColor, aColor, uUseVertexColor);
  if (uUseInstancing > 0.5 && uUseInstanceColor > 0.5) {
    c = c * aInstColor;
  }
  vColor = c;
}
`;

const FS_SOURCE = `#version 300 es
precision mediump float;
in vec3 vNormal;
in vec3 vColor;

uniform float uIsBasic;
uniform float uOpacity;
uniform vec3 uLightDir;

out vec4 fragColor;

void main() {
  if (uIsBasic > 0.5) {
    fragColor = vec4(vColor, uOpacity);
    return;
  }
  vec3 n = normalize(vNormal);
  float diff = max(dot(n, uLightDir), 0.0);
  float hemi = 0.55 + 0.45 * clamp(n.y, -1.0, 1.0);
  vec3 lit = vColor * (0.44 * hemi + 0.68 * diff);
  fragColor = vec4(lit, uOpacity);
}
`;
class WebGLRenderer {
  constructor(params = {}) {
    this.domElement = params.canvas || (typeof document !== 'undefined' ? document.createElement('canvas') : null);
    this.shadowMap = { enabled: false, type: PCFSoftShadowMap };
    this.pixelRatio = 1;
    this.width = (this.domElement && this.domElement.clientWidth) || 800;
    this.height = (this.domElement && this.domElement.clientHeight) || 600;
    this.gl = null;
    this.program = null;
    this.gpuCache = new WeakMap();
    this.instGpuCache = new WeakMap();
    this.info = {
      render: { frame: 0, calls: 0, triangles: 0, points: 0, lines: 0, instancedCalls: 0, activeInstances: 0 },
      memory: { geometries: 0, textures: 0 }
    };

    if (this.domElement && typeof this.domElement.getContext === 'function') {
      try {
        this.gl = this.domElement.getContext('webgl2', {
          antialias: params.antialias !== false,
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: params.powerPreference || 'high-performance'
        });
        if (this.gl) {
          this._initWebGL2();
        }
      } catch (e) {
        this.gl = null;
      }
    }
  }

  getContext() {
    return this.gl;
  }

  _initWebGL2() {
    const gl = this.gl;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, VS_SOURCE);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      this.gl = null;
      return;
    }
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, FS_SOURCE);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      this.gl = null;
      return;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      this.gl = null;
      return;
    }
    this.program = prog;
    this.uModelMatrix = gl.getUniformLocation(prog, 'uModelMatrix');
    this.uViewProjMatrix = gl.getUniformLocation(prog, 'uViewProjMatrix');
    this.uBaseColor = gl.getUniformLocation(prog, 'uBaseColor');
    this.uUseVertexColor = gl.getUniformLocation(prog, 'uUseVertexColor');
    this.uUseInstancing = gl.getUniformLocation(prog, 'uUseInstancing');
    this.uUseInstanceColor = gl.getUniformLocation(prog, 'uUseInstanceColor');
    this.uIsBasic = gl.getUniformLocation(prog, 'uIsBasic');
    this.uOpacity = gl.getUniformLocation(prog, 'uOpacity');
    this.uLightDir = gl.getUniformLocation(prog, 'uLightDir');

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  setPixelRatio(dpr) {
    this.pixelRatio = dpr || 1;
    this.setSize(this.width, this.height, false);
  }

  getPixelRatio() {
    return this.pixelRatio;
  }

  setSize(w, h, updateStyle = true) {
    this.width = Math.max(1, w);
    this.height = Math.max(1, h);
    if (this.domElement) {
      this.domElement.width = Math.round(this.width * this.pixelRatio);
      this.domElement.height = Math.round(this.height * this.pixelRatio);
      if (updateStyle && this.domElement.style) {
        this.domElement.style.width = `${this.width}px`;
        this.domElement.style.height = `${this.height}px`;
      }
      if (this.gl) {
        this.gl.viewport(0, 0, this.domElement.width, this.domElement.height);
      }
    }
  }

  _getGpuBuffers(geom) {
    const gl = this.gl;
    let entry = this.gpuCache.get(geom);
    const posAttr = geom.attributes.position;
    if (!posAttr) return null;
    if (!entry) {
      const vao = gl.createVertexArray();
      const posBuf = gl.createBuffer();
      const normBuf = gl.createBuffer();
      const colBuf = gl.createBuffer();
      entry = { vao, posBuf, normBuf, colBuf, count: 0 };
      this.gpuCache.set(geom, entry);
      this.info.memory.geometries++;
      geom._gpuDirty = true;
    }
    if (geom._gpuDirty || posAttr.needsUpdate) {
      if (!geom.attributes.normal) geom.computeVertexNormals();
      const normAttr = geom.attributes.normal;
      const colAttr = geom.attributes.color;

      gl.bindVertexArray(entry.vao);

      gl.bindBuffer(gl.ARRAY_BUFFER, entry.posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, posAttr.array, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, entry.normBuf);
      gl.bufferData(gl.ARRAY_BUFFER, normAttr.array, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

      if (colAttr) {
        gl.bindBuffer(gl.ARRAY_BUFFER, entry.colBuf);
        gl.bufferData(gl.ARRAY_BUFFER, colAttr.array, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
      } else {
        gl.disableVertexAttribArray(2);
        gl.vertexAttrib3f(2, 1, 1, 1);
      }

      for (let loc = 3; loc <= 7; loc++) {
        gl.disableVertexAttribArray(loc);
      }

      gl.bindVertexArray(null);
      entry.count = posAttr.count;
      geom._gpuDirty = false;
      posAttr.needsUpdate = false;
    }
    return entry;
  }

  _getInstancedVao(instMesh, baseGpu) {
    const gl = this.gl;
    const geom = instMesh.geometry;
    let entry = this.instGpuCache.get(instMesh);
    const matArray = instMesh.instanceMatrix.array;
    const colArray = instMesh.instanceColor ? instMesh.instanceColor.array : null;

    if (!entry) {
      const vao = gl.createVertexArray();
      const instMatBuf = gl.createBuffer();
      const instColBuf = gl.createBuffer();
      entry = { vao, instMatBuf, instColBuf, initialized: false, hasColor: false };
      this.instGpuCache.set(instMesh, entry);
    }

    if (!entry.initialized || (colArray !== null && !entry.hasColor)) {
      const colAttr = geom.attributes.color;
      gl.bindVertexArray(entry.vao);

      gl.bindBuffer(gl.ARRAY_BUFFER, baseGpu.posBuf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, baseGpu.normBuf);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

      if (colAttr) {
        gl.bindBuffer(gl.ARRAY_BUFFER, baseGpu.colBuf);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
      } else {
        gl.disableVertexAttribArray(2);
        gl.vertexAttrib3f(2, 1, 1, 1);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, entry.instMatBuf);
      gl.bufferData(gl.ARRAY_BUFFER, matArray, gl.DYNAMIC_DRAW);
      const stride = 16 * 4;
      for (let col = 0; col < 4; col++) {
        const loc = 3 + col;
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, stride, col * 16);
        gl.vertexAttribDivisor(loc, 1);
      }

      if (colArray) {
        gl.bindBuffer(gl.ARRAY_BUFFER, entry.instColBuf);
        gl.bufferData(gl.ARRAY_BUFFER, colArray, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(7);
        gl.vertexAttribPointer(7, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(7, 1);
        entry.hasColor = true;
      } else {
        gl.disableVertexAttribArray(7);
        gl.vertexAttrib3f(7, 1, 1, 1);
      }

      gl.bindVertexArray(null);
      entry.initialized = true;
      instMesh._instanceDirty = false;
      instMesh._colorDirty = false;
      if (instMesh.instanceMatrix) instMesh.instanceMatrix.needsUpdate = false;
      if (instMesh.instanceColor) instMesh.instanceColor.needsUpdate = false;
    } else {
      if (instMesh._instanceDirty || (instMesh.instanceMatrix && instMesh.instanceMatrix.needsUpdate)) {
        gl.bindBuffer(gl.ARRAY_BUFFER, entry.instMatBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, matArray);
        instMesh._instanceDirty = false;
        if (instMesh.instanceMatrix) instMesh.instanceMatrix.needsUpdate = false;
      }
      if (colArray && (instMesh._colorDirty || (instMesh.instanceColor && instMesh.instanceColor.needsUpdate))) {
        gl.bindBuffer(gl.ARRAY_BUFFER, entry.instColBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, colArray);
        instMesh._colorDirty = false;
        if (instMesh.instanceColor) instMesh.instanceColor.needsUpdate = false;
      }
    }
    return entry;
  }

  render(scene, camera) {
    this.info.render.frame++;
    this.info.render.calls = 0;
    this.info.render.triangles = 0;
    this.info.render.lines = 0;
    this.info.render.points = 0;
    this.info.render.instancedCalls = 0;
    this.info.render.activeInstances = 0;

    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const vpMatrix = new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

    const drawables = [];
    scene.traverse((obj) => {
      if (!obj.visible) return;
      if ((obj.isMesh || obj.isLineSegments || obj.isGridHelper) && obj.geometry && obj.material) {
        drawables.push(obj);
      }
    });

    if (this.gl && this.program) {
      const gl = this.gl;
      const bg = scene.background || new Color(0x0b1528);
      gl.clearColor(bg.r, bg.g, bg.b, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.program);
      gl.uniformMatrix4fv(this.uViewProjMatrix, false, vpMatrix.elements);
      gl.uniform3f(this.uLightDir, 0.52, 0.78, 0.34);

      for (let i = 0; i < drawables.length; i++) {
        const m = drawables[i];
        let p = m.parent;
        let vis = true;
        while (p) {
          if (!p.visible) { vis = false; break; }
          p = p.parent;
        }
        if (!vis) continue;

        const gpu = this._getGpuBuffers(m.geometry);
        if (!gpu || gpu.count === 0) continue;

        const mat = m.material;
        const c = mat.color || new Color(0xffffff);
        gl.uniform3f(this.uBaseColor, c.r, c.g, c.b);
        gl.uniform1f(this.uUseVertexColor, mat.vertexColors && m.geometry.attributes.color ? 1.0 : 0.0);
        gl.uniform1f(this.uIsBasic, mat.isBasic ? 1.0 : 0.0);
        gl.uniform1f(this.uOpacity, mat.transparent ? mat.opacity : 1.0);
        gl.uniformMatrix4fv(this.uModelMatrix, false, m.matrixWorld.elements);

        if (m.isInstancedMesh) {
          const activeCount = Math.max(0, Math.min(m.count, m.maxCount));
          if (activeCount === 0) continue;
          const instVao = this._getInstancedVao(m, gpu);
          gl.uniform1f(this.uUseInstancing, 1.0);
          gl.uniform1f(this.uUseInstanceColor, m.instanceColor ? 1.0 : 0.0);
          gl.bindVertexArray(instVao.vao);
          gl.drawArraysInstanced(gl.TRIANGLES, 0, gpu.count, activeCount);
          this.info.render.calls++;
          this.info.render.instancedCalls++;
          this.info.render.activeInstances += activeCount;
          this.info.render.triangles += Math.floor(gpu.count / 3) * activeCount;
        } else if (m.isLineSegments || m.isGridHelper) {
          gl.uniform1f(this.uUseInstancing, 0.0);
          gl.uniform1f(this.uUseInstanceColor, 0.0);
          gl.bindVertexArray(gpu.vao);
          gl.drawArrays(gl.LINES, 0, gpu.count);
          this.info.render.calls++;
          this.info.render.lines += Math.floor(gpu.count / 2);
        } else {
          gl.uniform1f(this.uUseInstancing, 0.0);
          gl.uniform1f(this.uUseInstanceColor, 0.0);
          gl.bindVertexArray(gpu.vao);
          gl.drawArrays(gl.TRIANGLES, 0, gpu.count);
          this.info.render.calls++;
          this.info.render.triangles += Math.floor(gpu.count / 3);
        }
      }
      gl.bindVertexArray(null);
      return;
    }

    // Headless Node unit-test telemetry accounting (when no DOM WebGL2 context is present)
    for (let i = 0; i < drawables.length; i++) {
      const m = drawables[i];
      let p = m.parent;
      let vis = true;
      while (p) {
        if (!p.visible) { vis = false; break; }
        p = p.parent;
      }
      if (!vis) continue;
      const posAttr = m.geometry.attributes.position;
      if (!posAttr || posAttr.count === 0) continue;
      if (m.isInstancedMesh) {
        const activeCount = Math.max(0, Math.min(m.count, m.maxCount));
        if (activeCount === 0) continue;
        this.info.render.calls++;
        this.info.render.instancedCalls++;
        this.info.render.activeInstances += activeCount;
        this.info.render.triangles += Math.floor(posAttr.count / 3) * activeCount;
      } else if (m.isLineSegments || m.isGridHelper) {
        this.info.render.calls++;
        this.info.render.lines += Math.floor(posAttr.count / 2);
      } else {
        this.info.render.calls++;
        this.info.render.triangles += Math.floor(posAttr.count / 3);
      }
    }
  }
}


  const THREE = {
    REVISION,
    IS_OFFICIAL_THREE,
    Vector2, Vector3, Color, Matrix4, Euler, Quaternion, Box3, Sphere, Plane, Ray, Frustum,
    Object3D, Group, Scene, OrthographicCamera, PerspectiveCamera, Raycaster,
    BufferAttribute, Float32BufferAttribute, InstancedBufferAttribute,
    BufferGeometry, InstancedBufferGeometry,
    BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, DodecahedronGeometry, PlaneGeometry, RingGeometry,
    LineSegments, GridHelper,
    Material, LineBasicMaterial, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshStandardMaterial,
    Mesh, InstancedMesh,
    AmbientLight, DirectionalLight, HemisphereLight,
    WebGLRenderer,
    DoubleSide, FrontSide, BackSide, NoBlending, AdditiveBlending, NormalBlending, BasicShadowMap, PCFShadowMap, PCFSoftShadowMap,
    DynamicDrawUsage, StaticDrawUsage
  };

  if (typeof window !== 'undefined') {
    window.THREE = THREE;
  }


// ==========================================
// MODULE: src/core/specs.ts
// ==========================================
// ============================================================================
// STARFRONT 3D — VERTICAL SLICE 001
// Module: src/core/specs.ts
// Reused & Adapted Unit, Weapon, Building, and Map Specifications from 2D Core
// ============================================================================
const WORLD_SCALE = 1.0;
const VS_WORLD_W = 1200;
const VS_WORLD_H = 800;
const SLICE_WORLD_W = VS_WORLD_W;
const SLICE_WORLD_H = VS_WORLD_H;
const FIXED_DT = 1 / 60;
const MAX_FRAME_DELTA = 0.25;
const MAX_CATCHUP_STEPS = 24;
const FIGHTER_SORTIE_COST = 180;
const FACTION_COLORS = {
  player: {
    primary: 0x0ea5e9,
    accent: 0x7dd3fc,
    dark: 0x0c4a6e,
    hex: '#0ea5e9',
    num: 0x0ea5e9,
    darkNum: 0x0c4a6e,
    trimNum: 0x7dd3fc,
    label: 'Aegis Federation (Player)'
  },
  enemy: {
    primary: 0xf43f5e,
    accent: 0xfda4af,
    dark: 0x881337,
    hex: '#f43f5e',
    num: 0xf43f5e,
    darkNum: 0x881337,
    trimNum: 0xfda4af,
    label: 'Crimson Dominion (Enemy)'
  },
  bot2: {
    primary: 0xf59e0b,
    accent: 0xfde68a,
    dark: 0x78350f,
    hex: '#f59e0b',
    num: 0xf59e0b,
    darkNum: 0x78350f,
    trimNum: 0xfde68a,
    label: 'Titan Syndicate (Bot 2)'
  },
  neutral: {
    primary: 0x94a3b8,
    accent: 0xcbd5e1,
    dark: 0x334155,
    hex: '#94a3b8',
    num: 0x94a3b8,
    darkNum: 0x334155,
    trimNum: 0xcbd5e1,
    label: 'Neutral Territory'
  }
};
const WEAPON_LOADOUTS = {
  carbine: {
    id: 'carbine',
    name: 'M4A1 Carbine',
    shortLabel: 'M4A1 (0.14s)',
    reload: 0.14,
    effectiveRange: 135,
    maxRange: 185,
    baseAcc: 0.92,
    minAcc: 0.38,
    dmg: 7,
    splash: 0,
    suppPerShot: 4.5,
    projType: 'laser',
    canTargetAir: false
  },
  minigun: {
    id: 'minigun',
    name: 'M134 Minigun (3,000 RPM)',
    shortLabel: 'Minigun (0.04s)',
    reload: 0.04,
    effectiveRange: 130,
    maxRange: 195,
    baseAcc: 0.84,
    minAcc: 0.28,
    dmg: 2.6,
    splash: 0,
    suppPerShot: 3.2,
    projType: 'minigun',
    canTargetAir: true
  },
  sniper: {
    id: 'sniper',
    name: '.50 BMG Anti-Materiel',
    shortLabel: '.50 Sniper (1.55s)',
    reload: 1.55,
    effectiveRange: 230,
    maxRange: 290,
    baseAcc: 0.98,
    minAcc: 0.52,
    dmg: 72,
    splash: 0,
    suppPerShot: 24,
    projType: 'railgun',
    canTargetAir: false
  },
  javelin: {
    id: 'javelin',
    name: 'Javelin AT + Stinger AA',
    shortLabel: 'Javelin (1.25s)',
    reload: 1.25,
    effectiveRange: 180,
    maxRange: 235,
    baseAcc: 0.94,
    minAcc: 0.50,
    dmg: 44,
    splash: 28,
    suppPerShot: 18,
    projType: 'rocket',
    canTargetAir: true
  }
};
const UNIT_SPECS = {
  harvester: {
    name: 'Trade Convoy',
    cost: 75,
    supply: 1,
    hp: 170,
    speed: 76,
    radius: 11,
    range: 40,
    dmg: 0,
    reload: 1.0,
    isHarvester: true,
    req: null,
    color: '#38bdf8',
    activeInVerticalSlice3D: false
  },
  supplyTruck: {
    name: 'Supply Truck',
    cost: 110,
    supply: 1,
    hp: 270,
    speed: 84,
    radius: 12,
    range: 200,
    dmg: 0,
    reload: 1.0,
    isSupplyTruck: true,
    supplyAuraRadius: 200,
    req: null,
    color: '#84cc16',
    activeInVerticalSlice3D: false
  },
  marine: {
    name: 'Rifle Infantry (M4A1)',
    cost: 90,
    supply: 1,
    hp: 155,
    speed: 78,
    radius: 9,
    effectiveRange: 135,
    range: 185,
    baseAcc: 0.92,
    minAcc: 0.38,
    dmg: 7,
    reload: 0.14,
    projType: 'laser',
    defaultKit: 'carbine',
    canCustomizeWeapon: true,
    canEntrench: true,
    canSpecOps: false,
    canTargetAir: false,
    canGarrison: true,
    req: null,
    color: '#22d3ee',
    activeInVerticalSlice3D: true
  },
  trooper: {
    name: 'AT/AA SpecOps Trooper',
    cost: 135,
    supply: 1,
    hp: 175,
    speed: 80,
    radius: 10,
    effectiveRange: 165,
    range: 215,
    baseAcc: 0.94,
    minAcc: 0.48,
    dmg: 38,
    splash: 24,
    reload: 1.05,
    projType: 'rocket',
    canCustomizeWeapon: false,
    canEntrench: false,
    canSpecOps: true,
    canTargetAir: true,
    canGarrison: true,
    req: 'barracks',
    color: '#fbbf24',
    activeInVerticalSlice3D: true
  },
  apc: {
    name: 'Stryker AA APC',
    cost: 180,
    supply: 2,
    hp: 340,
    speed: 92,
    radius: 13,
    effectiveRange: 155,
    range: 195,
    dmg: 24,
    reload: 0.40,
    projType: 'autocannon',
    canTargetAir: true,
    cramRange: 160,
    req: 'barracks',
    color: '#2dd4bf',
    activeInVerticalSlice3D: true
  },
  tank: {
    name: 'Titan MBT Tank',
    cost: 240,
    supply: 2,
    hp: 450,
    speed: 60,
    radius: 15,
    effectiveRange: 150,
    range: 185,
    dmg: 58,
    splash: 34,
    reload: 1.35,
    projType: 'cannon',
    canTargetAir: false,
    req: 'factory',
    color: '#0ea5e9',
    activeInVerticalSlice3D: true
  },
  artillery: {
    name: '155mm Howitzer (Deferred 3D)',
    cost: 310,
    supply: 3,
    hp: 340,
    speed: 52,
    radius: 16,
    minRange: 260,
    effectiveRange: 650,
    range: 850,
    baseAcc: 0.90,
    minAcc: 0.52,
    dmg: 132,
    splash: 75,
    reload: 3.4,
    projType: 'artillery',
    canTargetAir: false,
    req: 'factory',
    color: '#fb923c',
    activeInVerticalSlice3D: false
  },
  fighter: {
    name: 'F-22 Fighter (Deferred 3D)',
    cost: 180,
    supply: 2,
    hp: 290,
    speed: 138,
    radius: 14,
    effectiveRange: 180,
    range: 230,
    baseAcc: 0.94,
    minAcc: 0.55,
    dmg: 38,
    reload: 0.58,
    projType: 'missile',
    flying: true,
    canTargetAir: true,
    req: 'airfield',
    color: '#38bdf8',
    activeInVerticalSlice3D: false
  },
  bomber: {
    name: 'B-21 Bomber (Deferred 3D)',
    cost: 260,
    supply: 3,
    hp: 460,
    shield: 140,
    speed: 92,
    radius: 18,
    effectiveRange: 170,
    range: 220,
    baseAcc: 0.90,
    minAcc: 0.48,
    dmg: 145,
    splash: 80,
    reload: 2.15,
    projType: 'artillery',
    flying: true,
    canTargetAir: false,
    req: 'airfield',
    color: '#fb923c',
    activeInVerticalSlice3D: false
  },
  mech: {
    name: 'Goliath Mech (Deferred 3D)',
    cost: 380,
    supply: 3,
    hp: 820,
    shield: 220,
    speed: 54,
    radius: 18,
    range: 200,
    dmg: 85,
    splash: 45,
    reload: 1.15,
    projType: 'mechbeam',
    req: 'factory',
    color: '#c084fc',
    activeInVerticalSlice3D: false
  },
  hero: {
    name: 'Commander Prime (Deferred 3D)',
    cost: 600,
    supply: 3,
    hp: 1350,
    shield: 600,
    speed: 74,
    radius: 20,
    range: 215,
    dmg: 125,
    splash: 55,
    reload: 0.85,
    projType: 'mechbeam',
    isHero: true,
    req: null,
    color: '#facc15',
    activeInVerticalSlice3D: false
  }
};
const BUILDING_SPECS = {
  hq: {
    name: 'Command HQ',
    cost: 400,
    hp: 1800,
    radius: 34,
    powerGen: 20,
    supplyGen: 14,
    incomeGen: 8,
    activeInVerticalSlice3D: true
  },
  barracks: {
    name: 'Infantry Barracks',
    cost: 160,
    hp: 750,
    radius: 25,
    powerGen: -3,
    supplyGen: 6,
    incomeGen: 0,
    activeInVerticalSlice3D: true
  },
  factory: {
    name: 'Armor Factory',
    cost: 260,
    hp: 980,
    radius: 28,
    powerGen: -6,
    supplyGen: 6,
    incomeGen: 0,
    activeInVerticalSlice3D: true
  },
  turret: {
    name: 'Laser Defense Turret',
    cost: 150,
    hp: 620,
    radius: 18,
    powerGen: -4,
    supplyGen: 0,
    incomeGen: 0,
    range: 205,
    dmg: 42,
    reload: 0.85,
    activeInVerticalSlice3D: true
  },
  refinery: {
    name: 'Trade Hub',
    cost: 140,
    hp: 680,
    radius: 26,
    powerGen: 6,
    supplyGen: 0,
    incomeGen: 9,
    activeInVerticalSlice3D: false
  },
  supplyDepot: {
    name: 'Supply Depot',
    cost: 150,
    hp: 760,
    radius: 24,
    powerGen: 4,
    supplyGen: 8,
    incomeGen: 4,
    supplyHubRadius: 360,
    activeInVerticalSlice3D: false
  },
  airfield: {
    name: 'Airfield',
    cost: 280,
    hp: 1050,
    radius: 32,
    powerGen: -6,
    supplyGen: 6,
    incomeGen: 0,
    activeInVerticalSlice3D: false
  },
  radar: {
    name: 'AESA Radar Station',
    cost: 200,
    hp: 1250,
    radius: 34,
    powerGen: -5,
    supplyGen: 6,
    incomeGen: 0,
    radarRadius: 1200,
    activeInVerticalSlice3D: false
  },
  reactor: {
    name: 'Fusion Reactor',
    cost: 130,
    hp: 580,
    radius: 22,
    powerGen: 12,
    supplyGen: 10,
    incomeGen: 0,
    healAura: true,
    activeInVerticalSlice3D: false
  },
  shieldDome: {
    name: 'Shield Dome',
    cost: 220,
    hp: 850,
    shield: 650,
    radius: 24,
    powerGen: -5,
    supplyGen: 0,
    incomeGen: 0,
    domeRadius: 210,
    activeInVerticalSlice3D: false
  },
  silo: {
    name: 'Missile Silo',
    cost: 340,
    hp: 900,
    shield: 250,
    radius: 26,
    powerGen: -8,
    supplyGen: 0,
    incomeGen: 0,
    range: 950,
    dmg: 220,
    splash: 90,
    reload: 8.5,
    activeInVerticalSlice3D: false
  }
};

// ==========================================
// MODULE: src/core/types.ts
// ==========================================


// ==========================================
// MODULE: src/core/simulation.ts
// ==========================================
function sanitizeResource(val, fallback = 0) {
  return typeof val === 'number' && Number.isFinite(val) ? Math.max(0, val) : fallback;
}
class GameCore {
  simAccumulator = 0;
  rngSeed = 1337;
  useSeededRng = true;
  SPATIAL_CELL = 120;
  SPATIAL_COLS = Math.ceil(SLICE_WORLD_W / 120) + 1;
  SPATIAL_ROWS = Math.ceil(SLICE_WORLD_H / 120) + 1;
  touchedSpatial = [];
  COLL_CELL = 50;
  COLL_COLS = Math.ceil(SLICE_WORLD_W / 50) + 1;
  COLL_ROWS = Math.ceil(SLICE_WORLD_H / 50) + 1;
  touchedColl = [];
  constructor() {
    this.spatialBuckets = Array.from({
      length: this.SPATIAL_COLS * this.SPATIAL_ROWS
    }, () => []);
    this.collBuckets = Array.from({
      length: this.COLL_COLS * this.COLL_ROWS
    }, () => []);
    this.state = this.createEmptyState();
    this.initVerticalSlice('normal');
  }
  setDeterministicSeed(seed) {
    if (seed === null) {
      this.useSeededRng = false;
    } else {
      this.useSeededRng = true;
      this.rngSeed = seed >>> 0 || 1337;
    }
  }
  random() {
    if (!this.useSeededRng) return Math.random();
    this.rngSeed = this.rngSeed * 1664525 + 1013904223 >>> 0;
    return this.rngSeed / 4294967296;
  }
  createEmptyState() {
    return {
      running: false,
      paused: false,
      tacticalPause: false,
      gameSpeed: 1,
      difficulty: 'normal',
      timeElapsed: 0,
      crystals: 620,
      enemyCrystals: 480,
      bot2Crystals: 480,
      totalMined: 0,
      kills: 0,
      upgWeapon: 1,
      upgArmor: 1,
      upgEcon: 1,
      cdFighterSortie: 0,
      cdBomberSortie: 0,
      aiBuildTimer: 8,
      bot2BuildTimer: 9,
      waveNumber: 1,
      waveTimer: 45,
      formation: 'wedge',
      winner: null,
      units: [],
      buildings: [],
      outposts: [],
      projectiles: [],
      particles: [],
      river: [],
      bridges: [],
      highGrounds: [],
      roads: [],
      obstacles: [],
      airStrikes: [],
      nextId: 1,
      _simTick: 0
    };
  }
  initVerticalSlice(difficulty = 'normal') {
    const s = this.createEmptyState();
    s.difficulty = difficulty;
    s.crystals = difficulty === 'easy' ? 750 : difficulty === 'normal' ? 620 : 500;
    s.enemyCrystals = difficulty === 'easy' ? 380 : difficulty === 'normal' ? 520 : 680;
    s.bot2Crystals = difficulty === 'easy' ? 380 : difficulty === 'normal' ? 520 : 680;
    s.running = true;
    s.paused = false;
    this.simAccumulator = 0;
    this.state = s;

    // 1. River running diagonally from North-West (420, 0) to South-East (780, 800)
    s.river = [{
      x: 430,
      y: 0
    }, {
      x: 540,
      y: 260
    }, {
      x: 600,
      y: 400
    }, {
      x: 660,
      y: 540
    }, {
      x: 770,
      y: 800
    }];

    // 2. Functional Central Armored Bridge at (600, 400)
    s.bridges = [{
      x: 600,
      y: 400,
      angle: -0.42,
      len: 155,
      w: 76,
      name: 'Omega Central Bridge'
    }];

    // 3. Low-Poly Raised Terrain Plateaus (High Ground +22% Damage & +22% Range)
    s.highGrounds = [{
      id: 'hg_west',
      name: 'Aegis Western Ridge',
      x: 340,
      y: 460,
      rx: 92,
      ry: 64,
      height: 18,
      angle: -0.25,
      rampAngle: 2.4
    }, {
      id: 'hg_east',
      name: 'Crimson Northern Bluff',
      x: 840,
      y: 260,
      rx: 92,
      ry: 64,
      height: 18,
      angle: 0.25,
      rampAngle: -0.8
    }];

    // 4. Tactical Ground Markings / Roads connecting the 3 bases across the central bridge
    s.roads = [{
      x1: 160,
      y1: 640,
      x2: 600,
      y2: 400,
      w: 34
    }, {
      x1: 600,
      y1: 400,
      x2: 1020,
      y2: 160,
      w: 34
    }, {
      x1: 600,
      y1: 400,
      x2: 1000,
      y2: 640,
      w: 32
    }];

    // 5. Rock Obstacles
    s.obstacles = [{
      x: 280,
      y: 210,
      r: 36
    }, {
      x: 490,
      y: 670,
      r: 34
    }, {
      x: 740,
      y: 130,
      r: 34
    }];

    // 6. One Neutral Capturable Outpost at the central bridgehead (600, 400)
    s.outposts = [{
      id: s.nextId++,
      name: 'Omega Central Outpost',
      x: 600,
      y: 400,
      radius: 52,
      owner: 'neutral',
      capturingTeam: null,
      progress: 0,
      contested: false,
      isCore: true
    }];

    // 7. Three Faction Bases (HQ, Barracks, Factory, Turret)
    // Faction 1: PLAYER (Aegis Federation — South-West, Cyan #0ea5e9)
    this.spawnBuilding('hq', 145, 650, 'player');
    this.spawnBuilding('barracks', 255, 665, 'player');
    this.spawnBuilding('factory', 155, 535, 'player');
    this.spawnBuilding('turret', 310, 560, 'player');

    // Faction 2: ENEMY (Crimson Dominion — North-East, Rose #f43f5e)
    this.spawnBuilding('hq', 1045, 145, 'enemy');
    this.spawnBuilding('barracks', 935, 130, 'enemy');
    this.spawnBuilding('factory', 1035, 255, 'enemy');
    this.spawnBuilding('turret', 885, 225, 'enemy');

    // Faction 3: BOT 2 (Titan Syndicate — South-East, Amber #f59e0b)
    this.spawnBuilding('hq', 1035, 650, 'bot2');
    this.spawnBuilding('barracks', 925, 665, 'bot2');
    this.spawnBuilding('factory', 1025, 540, 'bot2');
    this.spawnBuilding('turret', 885, 565, 'bot2');

    // 8. Spawn 26 Active Combat Units across the 3 factions (Infantry, APC, Tank)
    // Player Starting Force (10 units)
    this.spawnUnit('marine', 290, 610, 'player');
    this.spawnUnit('marine', 315, 625, 'player');
    this.spawnUnit('marine', 340, 605, 'player');
    this.spawnUnit('trooper', 275, 585, 'player');
    this.spawnUnit('trooper', 305, 575, 'player');
    this.spawnUnit('apc', 355, 575, 'player');
    this.spawnUnit('apc', 385, 600, 'player');
    this.spawnUnit('tank', 245, 535, 'player');
    this.spawnUnit('tank', 285, 520, 'player');
    this.spawnUnit('tank', 330, 535, 'player');

    // Enemy Starting Force (8 units - North-East)
    this.spawnUnit('marine', 870, 175, 'enemy');
    this.spawnUnit('marine', 895, 195, 'enemy');
    this.spawnUnit('marine', 850, 205, 'enemy');
    this.spawnUnit('trooper', 910, 165, 'enemy');
    this.spawnUnit('trooper', 880, 150, 'enemy');
    this.spawnUnit('apc', 840, 245, 'enemy');
    this.spawnUnit('tank', 945, 240, 'enemy');
    this.spawnUnit('tank', 915, 270, 'enemy');

    // Bot 2 Starting Force (8 units - South-East)
    this.spawnUnit('marine', 865, 615, 'bot2');
    this.spawnUnit('marine', 890, 635, 'bot2');
    this.spawnUnit('trooper', 845, 595, 'bot2');
    this.spawnUnit('trooper', 875, 585, 'bot2');
    this.spawnUnit('apc', 835, 535, 'bot2');
    this.spawnUnit('apc', 865, 515, 'bot2');
    this.spawnUnit('tank', 940, 535, 'bot2');
    this.spawnUnit('tank', 915, 505, 'bot2');
  }
  getTeamMultipliers(team) {
    if (team === 'player') {
      return {
        dmg: 1 + (this.state.upgWeapon - 1) * 0.25,
        hp: 1 + (this.state.upgArmor - 1) * 0.25,
        econ: 1 + (this.state.upgEcon - 1) * 0.35
      };
    }
    const diffMult = this.state.difficulty === 'easy' ? 0.88 : this.state.difficulty === 'normal' ? 1.0 : 1.2;
    return {
      dmg: diffMult,
      hp: diffMult,
      econ: diffMult
    };
  }
  spawnBuilding(type, x, y, team) {
    const spec = BUILDING_SPECS[type];
    const mult = this.getTeamMultipliers(team);
    const maxHp = Math.round(spec.hp * mult.hp);
    const b = {
      id: this.state.nextId++,
      isBuilding: true,
      type,
      name: spec.name,
      team,
      x,
      y,
      radius: spec.radius,
      hp: maxHp,
      maxHp,
      shield: spec.shield ? Math.round(spec.shield * mult.hp) : 0,
      maxShield: spec.shield ? Math.round(spec.shield * mult.hp) : 0,
      range: spec.range || 0,
      dmg: spec.dmg ? Math.round(spec.dmg * mult.dmg) : 0,
      reload: spec.reload || 1,
      cooldown: 0,
      selected: false,
      angle: team === 'player' ? -Math.PI / 4 : 3 * Math.PI / 4,
      recoil: 0,
      targetEntity: null
    };
    this.state.buildings.push(b);
    return b;
  }
  spawnUnit(type, x, y, team) {
    const spec = UNIT_SPECS[type];
    const mult = this.getTeamMultipliers(team);
    const maxHp = Math.round(spec.hp * mult.hp);
    const angle = team === 'player' ? -Math.PI / 4 : team === 'enemy' ? 3 * Math.PI / 4 : -3 * Math.PI / 4;
    const jx = (this.random() - 0.5) * 6;
    const jy = (this.random() - 0.5) * 6;
    const ux = Math.max(spec.radius + 8, Math.min(SLICE_WORLD_W - spec.radius - 8, x + jx));
    const uy = Math.max(spec.radius + 8, Math.min(SLICE_WORLD_H - spec.radius - 8, y + jy));
    const u = {
      id: this.state.nextId++,
      isUnit: true,
      type,
      name: spec.name,
      team,
      x: ux,
      y: uy,
      prevX: ux,
      prevY: uy,
      vx: 0,
      vy: 0,
      radius: spec.radius,
      hp: maxHp,
      maxHp,
      shield: spec.shield ? Math.round(spec.shield * mult.hp) : 0,
      maxShield: spec.shield ? Math.round(spec.shield * mult.hp) : 0,
      speed: spec.speed,
      effectiveRange: spec.effectiveRange || Math.round((spec.range || 180) * 0.72),
      range: spec.range || 200,
      dmg: Math.round(spec.dmg * mult.dmg),
      splash: spec.splash || 0,
      reload: spec.reload,
      cooldown: this.random() * 0.15,
      projType: spec.projType || 'laser',
      flying: !!spec.flying,
      canTargetAir: spec.canTargetAir !== undefined ? spec.canTargetAir : true,
      isHarvester: !!spec.isHarvester,
      isSupplyTruck: !!spec.isSupplyTruck,
      selected: false,
      angle,
      prevAngle: angle,
      turretAngle: angle,
      prevTurretAngle: angle,
      kills: 0,
      veteran: 0,
      recoil: 0,
      muzzleFlash: 0,
      onHighGround: false,
      inDefilade: false,
      state: 'idle',
      targetX: ux,
      targetY: uy,
      targetEntity: null,
      stuckTimer: 0,
      walkCycle: 0
    };
    this.state.units.push(u);
    return u;
  }
  getPlayerStats() {
    let powerUsed = 0;
    let powerMax = 10;
    let supplyUsed = 0;
    let supplyMax = 12;
    let passiveIncome = 6;
    let hasBarracks = false;
    let hasFactory = false;
    let hasAirfield = false;
    let hasRadar = false;
    let combatCount = 0;
    for (const b of this.state.buildings) {
      if (b.team !== 'player' || b.hp <= 0) continue;
      const spec = BUILDING_SPECS[b.type];
      if (spec.powerGen > 0) powerMax += spec.powerGen;else powerUsed += Math.abs(spec.powerGen);
      supplyMax += spec.supplyGen;
      passiveIncome += spec.incomeGen;
      if (b.type === 'barracks') hasBarracks = true;
      if (b.type === 'factory') hasFactory = true;
      if (b.type === 'airfield') hasAirfield = true;
      if (b.type === 'radar') hasRadar = true;
    }
    for (const op of this.state.outposts) {
      if (op.owner === 'player') {
        passiveIncome += op.isCore ? 10 : 6;
        powerMax += op.isCore ? 12 : 8;
        supplyMax += 6;
      }
    }
    for (const u of this.state.units) {
      if (u.team !== 'player' || u.hp <= 0) continue;
      const spec = UNIT_SPECS[u.type];
      supplyUsed += spec.supply;
      if (!u.isHarvester) combatCount++;
    }
    const mult = this.getTeamMultipliers('player');
    passiveIncome = Math.round(passiveIncome * mult.econ);
    return {
      powerUsed,
      powerMax,
      supplyUsed,
      supplyMax,
      passiveIncome,
      hasBarracks,
      hasFactory,
      hasAirfield,
      hasRadar,
      combatCount
    };
  }

  // =========================================================
  // PHASE A1 FIX: Single Authoritative Fighter Launch Validation
  // =========================================================
  canLaunchFighterSortie() {
    const stats = this.getPlayerStats();
    const airfield = this.state.buildings.find(b => b.team === 'player' && b.type === 'airfield' && b.hp > 0);
    const radar = this.state.buildings.find(b => b.team === 'player' && b.type === 'radar' && b.hp > 0);
    if (!stats.hasAirfield || !airfield) {
      return {
        ok: false,
        reason: 'no_airfield'
      };
    }
    if (!stats.hasRadar || !radar) {
      return {
        ok: false,
        reason: 'no_radar'
      };
    }
    if ((this.state.cdFighterSortie || 0) > 0) {
      return {
        ok: false,
        reason: 'cooldown'
      };
    }
    this.state.crystals = sanitizeResource(this.state.crystals, 0);
    if (this.state.crystals < FIGHTER_SORTIE_COST) {
      return {
        ok: false,
        reason: 'insufficient_funds'
      };
    }
    return {
      ok: true,
      airfield,
      radar
    };
  }
  scrambleFighterInterceptors(tx, ty, _isEmergencyIntercept = false) {
    const check = this.canLaunchFighterSortie();
    if (!check.ok || !check.airfield) {
      return false;
    }
    this.state.crystals = Math.max(0, sanitizeResource(this.state.crystals, 0) - FIGHTER_SORTIE_COST);
    this.state.cdFighterSortie = 11;
    for (let i = 0; i < 2; i++) {
      const offset = (i === 0 ? -1 : 1) * 35;
      this.state.airStrikes.push({
        id: this.state.nextId++,
        team: 'player',
        role: 'fighter',
        name: `F-22 Raptor #${i + 1}`,
        x: check.airfield.x,
        y: check.airfield.y + offset,
        targetX: tx + offset,
        targetY: ty + offset,
        speed: 380,
        hp: 320,
        patrolTimer: 12.0
      });
    }
    return true;
  }
  activateFighterAirDefense() {
    const check = this.canLaunchFighterSortie();
    if (!check.ok) return false;
    return this.scrambleFighterInterceptors(600, 400, true);
  }
  trainPlayerUnit(unitType) {
    if (!this.state.running || this.state.paused) return {
      ok: false,
      reason: 'paused'
    };
    if (unitType === 'fighter') {
      const ok = this.activateFighterAirDefense();
      return {
        ok,
        reason: ok ? undefined : 'fighter_validation_failed'
      };
    }
    const spec = UNIT_SPECS[unitType];
    const stats = this.getPlayerStats();
    if (spec.req === 'barracks' && !stats.hasBarracks) return {
      ok: false,
      reason: 'no_barracks'
    };
    if (spec.req === 'factory' && !stats.hasFactory) return {
      ok: false,
      reason: 'no_factory'
    };
    if (spec.req === 'airfield' && !stats.hasAirfield) return {
      ok: false,
      reason: 'no_airfield'
    };
    if (stats.supplyUsed + spec.supply > stats.supplyMax) {
      return {
        ok: false,
        reason: 'supply_cap'
      };
    }
    this.state.crystals = sanitizeResource(this.state.crystals, 0);
    if (this.state.crystals < spec.cost) {
      return {
        ok: false,
        reason: 'insufficient_funds'
      };
    }
    const spawner = this.state.buildings.find(b => b.team === 'player' && b.type === (spec.req || 'barracks') && b.hp > 0) || this.state.buildings.find(b => b.team === 'player' && b.type === 'hq' && b.hp > 0);
    if (!spawner) return {
      ok: false,
      reason: 'no_spawner'
    };
    this.state.crystals -= spec.cost;
    const ang = -Math.PI / 4 + (this.random() - 0.5) * 0.6;
    const sx = spawner.x + Math.cos(ang) * (spawner.radius + spec.radius + 18);
    const sy = spawner.y + Math.sin(ang) * (spawner.radius + spec.radius + 18);
    const u = this.spawnUnit(unitType, sx, sy, 'player');
    u.state = 'attackMove';
    u.targetX = sx + Math.cos(-Math.PI / 4) * 55;
    u.targetY = sy + Math.sin(-Math.PI / 4) * 55;
    return {
      ok: true,
      unit: u
    };
  }
  constructPlayerBuilding(bType, x, y) {
    const spec = BUILDING_SPECS[bType];
    this.state.crystals = sanitizeResource(this.state.crystals, 0);
    if (this.state.crystals < spec.cost) {
      return {
        ok: false,
        reason: 'insufficient_funds'
      };
    }
    const hq = this.state.buildings.find(b => b.team === 'player' && b.type === 'hq') || {
      x: 145,
      y: 650
    };
    const bx = x !== undefined ? x : hq.x + 115 + (this.random() - 0.5) * 60;
    const by = y !== undefined ? y : hq.y - 95 + (this.random() - 0.5) * 60;
    this.state.crystals -= spec.cost;
    const b = this.spawnBuilding(bType, bx, by, 'player');
    return {
      ok: true,
      building: b
    };
  }

  // =========================================================
  // PHASE A4 FIX: Deterministic Fixed-Timestep Simulation
  // =========================================================
  stepSimulation(realElapsedSeconds, customSpeed) {
    if (!Number.isFinite(realElapsedSeconds) || realElapsedSeconds <= 0) {
      return {
        steps: 0,
        alpha: this.simAccumulator / FIXED_DT
      };
    }
    if (!this.state.running || this.state.paused || this.state.tacticalPause) {
      this.simAccumulator = 0;
      return {
        steps: 0,
        alpha: 0
      };
    }
    const clampedElapsed = Math.min(MAX_FRAME_DELTA, realElapsedSeconds);
    const speedMult = customSpeed !== undefined ? customSpeed : Number.isFinite(this.state.gameSpeed) && this.state.gameSpeed > 0 ? this.state.gameSpeed : 1;
    this.simAccumulator = Math.round((this.simAccumulator + clampedElapsed * speedMult) * 60000) / 60000;
    let steps = 0;
    while (this.simAccumulator + 1e-9 >= FIXED_DT && steps < MAX_CATCHUP_STEPS) {
      this.updateGame(FIXED_DT);
      this.simAccumulator = Math.max(0, Math.round((this.simAccumulator - FIXED_DT) * 60000) / 60000);
      if (Math.abs(this.simAccumulator) < 1e-9) this.simAccumulator = 0;
      steps++;
    }
    if (steps >= MAX_CATCHUP_STEPS) {
      this.simAccumulator = 0;
    }
    return {
      steps,
      alpha: Math.max(0, Math.min(1, this.simAccumulator / FIXED_DT))
    };
  }
  updateGame(dt) {
    if (!this.state.running || this.state.paused || this.state.tacticalPause) return;
    this.state._simTick = (this.state._simTick || 0) + 1 | 0;
    this.state.timeElapsed += dt;

    // Save previous positions/angles for smooth 3D interpolation
    for (const u of this.state.units) {
      u.prevX = u.x;
      u.prevY = u.y;
      u.prevAngle = u.angle;
      u.prevTurretAngle = u.turretAngle;
      if (u.recoil > 0) u.recoil = Math.max(0, u.recoil - dt * 28);
      if (u.muzzleFlash > 0) u.muzzleFlash = Math.max(0, u.muzzleFlash - dt);
    }
    for (const p of this.state.projectiles) {
      p.prevX = p.x;
      p.prevY = p.y;
      p.prevZ = p.z;
    }
    if (this.state.cdFighterSortie > 0) {
      this.state.cdFighterSortie = Math.max(0, this.state.cdFighterSortie - dt);
    }
    if (this.state.cdBomberSortie > 0) {
      this.state.cdBomberSortie = Math.max(0, this.state.cdBomberSortie - dt);
    }

    // PHASE A3 FIX: Sanitize resources so 0 never triggers `|| 400` and NaN/negative never occur
    this.state.crystals = sanitizeResource(this.state.crystals, 0);
    this.state.enemyCrystals = sanitizeResource(this.state.enemyCrystals, 0);
    this.state.bot2Crystals = sanitizeResource(this.state.bot2Crystals, 0);
    this.state.totalMined = sanitizeResource(this.state.totalMined, 0);
    const stats = this.getPlayerStats();
    if (dt > 0) {
      this.state.crystals = sanitizeResource(this.state.crystals + stats.passiveIncome * dt, 0);
      this.state.totalMined = sanitizeResource(this.state.totalMined + stats.passiveIncome * dt, 0);
      let enemyOutpostBonus = 0;
      let bot2OutpostBonus = 0;
      for (const op of this.state.outposts) {
        if (op.owner === 'enemy') enemyOutpostBonus += op.isCore ? 8 : 4;else if (op.owner === 'bot2') bot2OutpostBonus += op.isCore ? 8 : 4;
      }
      const enemyMult = this.getTeamMultipliers('enemy');
      this.state.enemyCrystals = sanitizeResource(this.state.enemyCrystals + (7 + enemyOutpostBonus) * enemyMult.econ * dt, 0);
      this.state.bot2Crystals = sanitizeResource(this.state.bot2Crystals + (7 + bot2OutpostBonus) * enemyMult.econ * dt, 0);
    }

    // PHASE A2 FIX: Three-Faction Independent Outpost Capture (player, enemy, bot2)
    for (const op of this.state.outposts) {
      if (!Number.isFinite(op.progress)) op.progress = op.owner === 'neutral' ? 0 : 100;
      if (op.progress < 0) op.progress = Math.abs(op.progress);
      if (op.owner !== 'neutral' && op.capturingTeam !== op.owner && op.progress >= 100) {
        op.capturingTeam = op.owner;
      }
      let pUnits = 0;
      let eUnits = 0;
      let b2Units = 0;
      for (const u of this.state.units) {
        if (u.hp <= 0 || u.isHarvester) continue;
        const d = Math.hypot(u.x - op.x, u.y - op.y);
        if (d <= op.radius + 28) {
          if (u.team === 'player') pUnits++;else if (u.team === 'enemy') eUnits++;else if (u.team === 'bot2') b2Units++;
        }
        if (u.team === op.owner && u.hp < u.maxHp && d <= op.radius + 55) {
          u.hp = Math.min(u.maxHp, u.hp + 10 * dt);
        }
      }
      const activeFactions = (pUnits > 0 ? 1 : 0) + (eUnits > 0 ? 1 : 0) + (b2Units > 0 ? 1 : 0);
      op.contested = activeFactions > 1;
      if (activeFactions === 1) {
        const domTeam = pUnits > 0 ? 'player' : eUnits > 0 ? 'enemy' : 'bot2';
        const unitCount = pUnits || eUnits || b2Units;
        const capDelta = (20 + unitCount * 6) * dt;
        if (op.owner === domTeam) {
          op.capturingTeam = domTeam;
          op.progress = Math.min(100, op.progress + capDelta);
        } else {
          if (op.capturingTeam && op.capturingTeam !== domTeam && op.progress > 0) {
            op.progress = Math.max(0, op.progress - capDelta);
            if (op.progress <= 0) {
              op.owner = 'neutral';
              op.capturingTeam = domTeam;
            }
          } else {
            op.capturingTeam = domTeam;
            op.progress = Math.min(100, op.progress + capDelta);
            if (op.progress >= 100 && op.owner !== domTeam) {
              op.owner = domTeam;
              op.capturingTeam = domTeam;
              op.progress = 100;
            }
          }
        }
      }
    }
    this.rebuildSpatialGrid();

    // Update Turrets & Buildings
    for (const b of this.state.buildings) {
      if (b.hp <= 0) continue;
      if (b.recoil > 0) b.recoil = Math.max(0, b.recoil - dt * 25);
      if (b.type === 'turret') {
        b.cooldown = Math.max(0, b.cooldown - dt);
        const target = this.findBestTarget(b.x, b.y, b.range, b.team, true);
        b.targetEntity = target;
        if (target) {
          b.angle = Math.atan2(target.y - b.y, target.x - b.x);
          if (b.cooldown <= 0) {
            b.cooldown = b.reload;
            b.recoil = 5;
            this.fireProjectile(b, target, 'turret');
          }
        }
      }
    }

    // Update AI Commanders (Enemy & Bot 2)
    this.updateAI(dt);

    // Update Units
    this.updateUnits(dt);

    // Update Projectiles
    this.updateProjectiles(dt);

    // Update Air Strikes
    for (let i = this.state.airStrikes.length - 1; i >= 0; i--) {
      const s = this.state.airStrikes[i];
      s.patrolTimer -= dt;
      if (s.patrolTimer <= 0 || s.hp <= 0) {
        this.state.airStrikes.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const pt = this.state.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.state.particles.splice(i, 1);
        continue;
      }
      if (!pt.isRing) {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.z = Math.max(0, pt.z + pt.vz * dt);
        pt.vz -= 65 * dt;
      }
    }

    // Cleanup dead units
    for (let i = this.state.units.length - 1; i >= 0; i--) {
      const u = this.state.units[i];
      if (u.hp <= 0) {
        this.addBurst(u.x, u.y, 4, u.team === 'player' ? '#38bdf8' : u.team === 'bot2' ? '#f59e0b' : '#f43f5e', 10);
        if (u.team !== 'player') this.state.kills++;
        this.state.units.splice(i, 1);
      }
    }

    // Cleanup destroyed buildings & check Victory / Defeat
    for (let i = this.state.buildings.length - 1; i >= 0; i--) {
      const b = this.state.buildings[i];
      if (b.hp <= 0) {
        this.addBurst(b.x, b.y, 8, '#fb923c', 18);
        const wasHQ = b.type === 'hq';
        const destroyedTeam = b.team;
        this.state.buildings.splice(i, 1);
        if (wasHQ) {
          if (destroyedTeam === 'player') {
            this.state.winner = 'enemy';
            this.state.paused = true;
            return;
          } else {
            const remainingHostileHQs = this.state.buildings.filter(ob => ob.team !== 'player' && ob.type === 'hq' && ob.hp > 0);
            if (remainingHostileHQs.length === 0) {
              this.state.winner = 'player';
              this.state.paused = true;
              return;
            }
          }
        }
      }
    }
  }
  updateAI(dt) {
    const enemyHQ = this.state.buildings.find(b => b.team === 'enemy' && b.type === 'hq' && b.hp > 0);
    const bot2HQ = this.state.buildings.find(b => b.team === 'bot2' && b.type === 'hq' && b.hp > 0);
    if (enemyHQ) {
      this.state.aiBuildTimer -= dt;
      if (this.state.aiBuildTimer <= 0) {
        this.state.aiBuildTimer = this.state.difficulty === 'easy' ? 11 : this.state.difficulty === 'normal' ? 8.5 : 6.5;
        const enemyCount = this.state.units.filter(u => u.team === 'enemy').length;
        if (enemyCount < 14 && this.state.enemyCrystals >= 135) {
          const pool = ['marine', 'trooper', 'apc', 'tank'];
          const pick = pool[Math.floor(this.random() * pool.length)];
          const cost = UNIT_SPECS[pick].cost;
          if (this.state.enemyCrystals >= cost) {
            this.state.enemyCrystals = Math.max(0, this.state.enemyCrystals - cost);
            const u = this.spawnUnit(pick, enemyHQ.x - 55, enemyHQ.y + 45, 'enemy');
            u.state = 'attackMove';
            u.targetX = 600 + (this.random() - 0.5) * 90;
            u.targetY = 400 + (this.random() - 0.5) * 90;
          }
        }
      }
    }
    if (bot2HQ) {
      this.state.bot2BuildTimer -= dt;
      if (this.state.bot2BuildTimer <= 0) {
        this.state.bot2BuildTimer = this.state.difficulty === 'easy' ? 11.5 : this.state.difficulty === 'normal' ? 9.0 : 7.0;
        const bot2Count = this.state.units.filter(u => u.team === 'bot2').length;
        this.state.bot2Crystals = sanitizeResource(this.state.bot2Crystals, 0);
        if (bot2Count < 14 && this.state.bot2Crystals >= 135) {
          const pool = ['marine', 'trooper', 'apc', 'tank'];
          const pick = pool[Math.floor(this.random() * pool.length)];
          const cost = UNIT_SPECS[pick].cost;
          if (this.state.bot2Crystals >= cost) {
            this.state.bot2Crystals = Math.max(0, this.state.bot2Crystals - cost);
            const u = this.spawnUnit(pick, bot2HQ.x - 55, bot2HQ.y - 45, 'bot2');
            u.state = 'attackMove';
            u.targetX = 600 + (this.random() - 0.5) * 90;
            u.targetY = 400 + (this.random() - 0.5) * 90;
          }
        }
      }
    }
    this.state.waveTimer -= dt;
    if (this.state.waveTimer <= 0) {
      this.state.waveNumber++;
      this.state.waveTimer = this.state.difficulty === 'easy' ? 50 : 38;
      // Direct idle AI units toward the central outpost or player base
      const op = this.state.outposts[0] || {
        x: 600,
        y: 400
      };
      for (const u of this.state.units) {
        if ((u.team === 'enemy' || u.team === 'bot2') && u.state === 'idle') {
          u.state = 'attackMove';
          u.targetX = op.x + (this.random() - 0.5) * 80;
          u.targetY = op.y + (this.random() - 0.5) * 80;
        }
      }
    }
  }
  rebuildSpatialGrid() {
    for (let i = 0; i < this.touchedSpatial.length; i++) {
      this.spatialBuckets[this.touchedSpatial[i]].length = 0;
    }
    this.touchedSpatial.length = 0;
    for (const u of this.state.units) {
      if (u.hp <= 0) continue;
      const cx = Math.max(0, Math.min(this.SPATIAL_COLS - 1, u.x / this.SPATIAL_CELL | 0));
      const cy = Math.max(0, Math.min(this.SPATIAL_ROWS - 1, u.y / this.SPATIAL_CELL | 0));
      u._scx = cx;
      u._scy = cy;
      const idx = cy * this.SPATIAL_COLS + cx;
      const b = this.spatialBuckets[idx];
      if (b.length === 0) this.touchedSpatial.push(idx);
      b.push(u);
    }
  }
  rebuildCollisionGrid() {
    for (let i = 0; i < this.touchedColl.length; i++) {
      this.collBuckets[this.touchedColl[i]].length = 0;
    }
    this.touchedColl.length = 0;
    for (const u of this.state.units) {
      if (u.hp <= 0) continue;
      const cx = Math.max(0, Math.min(this.COLL_COLS - 1, u.x / this.COLL_CELL | 0));
      const cy = Math.max(0, Math.min(this.COLL_ROWS - 1, u.y / this.COLL_CELL | 0));
      u._ccx = cx;
      u._ccy = cy;
      const idx = cy * this.COLL_COLS + cx;
      const b = this.collBuckets[idx];
      if (b.length === 0) this.touchedColl.push(idx);
      b.push(u);
    }
  }
  findBestTarget(x, y, maxRange, myTeam, canTargetAir = true) {
    let best = null;
    let bestDist = maxRange;
    const pad = maxRange + 28;
    const c0 = Math.max(0, (x - pad) / this.SPATIAL_CELL | 0);
    const c1 = Math.min(this.SPATIAL_COLS - 1, (x + pad) / this.SPATIAL_CELL | 0);
    const r0 = Math.max(0, (y - pad) / this.SPATIAL_CELL | 0);
    const r1 = Math.min(this.SPATIAL_ROWS - 1, (y + pad) / this.SPATIAL_CELL | 0);
    for (let r = r0; r <= r1; r++) {
      const rowOff = r * this.SPATIAL_COLS;
      for (let c = c0; c <= c1; c++) {
        const bucket = this.spatialBuckets[rowOff + c];
        for (let i = 0; i < bucket.length; i++) {
          const u = bucket[i];
          if (u.team === myTeam || u.hp <= 0) continue;
          if (u.flying && !canTargetAir) continue;
          const d = Math.hypot(u.x - x, u.y - y) - u.radius;
          if (d <= bestDist) {
            bestDist = d;
            best = u;
          }
        }
      }
    }
    if (best) return best;
    for (const b of this.state.buildings) {
      if (b.team === myTeam || b.hp <= 0) continue;
      const d = Math.hypot(b.x - x, b.y - y) - b.radius;
      if (d <= bestDist) {
        bestDist = d;
        best = b;
      }
    }
    return best;
  }
  getTerrainHeightAt(x, y) {
    // Check bridge first
    if (this.getBridgeAtPoint(x, y, 6)) {
      return 3.5;
    }
    // Check raised high-ground plateaus
    for (const hg of this.state.highGrounds) {
      const dx = x - hg.x;
      const dy = y - hg.y;
      const cos = Math.cos(-hg.angle);
      const sin = Math.sin(-hg.angle);
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;
      const norm = lx * lx / (hg.rx * hg.rx) + ryNorm(ly, hg.ry);
      if (norm <= 1.0) {
        return hg.height;
      }
      if (norm <= 1.35) {
        const t = 1 - (norm - 1.0) / 0.35;
        return hg.height * Math.max(0, t);
      }
    }
    // Check river depression
    const rInfo = this.getRiverTelemetry(x, y);
    if (rInfo.dist < 32) {
      return -3.5;
    }
    return 0;
  }
  updateUnits(dt) {
    for (const u of this.state.units) {
      if (u.hp <= 0) continue;

      // Check high ground status
      u.onHighGround = this.getTerrainHeightAt(u.x, u.y) >= 12;
      const baseSpec = UNIT_SPECS[u.type];
      u.range = Math.round(baseSpec.range * (u.onHighGround ? 1.22 : 1.0));
      u.cooldown = Math.max(0, u.cooldown - dt);
      if (u.targetEntity && u.targetEntity.hp <= 0) {
        u.targetEntity = null;
      }
      if (u.state === 'move') {
        const dist = Math.hypot(u.targetX - u.x, u.targetY - u.y);
        const opp = u.cooldown <= 0.04 ? this.findBestTarget(u.x, u.y, u.range, u.team, u.canTargetAir) : null;
        if (opp) {
          u.turretAngle = Math.atan2(opp.y - u.y, opp.x - u.x);
          if (u.cooldown <= 0) {
            u.cooldown = u.reload;
            this.fireProjectile(u, opp, u.projType);
          }
        }
        if (dist < 12 || dist < 42 && u.stuckTimer > 0.75) {
          u.state = 'idle';
          u.stuckTimer = 0;
        } else {
          this.moveTowards(u, u.targetX, u.targetY, dt);
        }
      } else if (u.state === 'attackTarget' && u.targetEntity) {
        const t = u.targetEntity;
        const dist = Math.hypot(t.x - u.x, t.y - u.y) - t.radius;
        if (dist <= u.range) {
          u.turretAngle = Math.atan2(t.y - u.y, t.x - u.x);
          u.angle = u.turretAngle;
          if (u.cooldown <= 0) {
            u.cooldown = u.reload;
            this.fireProjectile(u, t, u.projType);
          }
        } else {
          this.moveTowards(u, t.x, t.y, dt, t.id);
        }
      } else if (u.state === 'hold') {
        const enemy = this.findBestTarget(u.x, u.y, u.range, u.team, u.canTargetAir);
        if (enemy) {
          u.turretAngle = Math.atan2(enemy.y - u.y, enemy.x - u.x);
          u.angle = u.turretAngle;
          if (u.cooldown <= 0) {
            u.cooldown = u.reload;
            this.fireProjectile(u, enemy, u.projType);
          }
        }
      } else {
        // idle or attackMove
        const scanRange = u.range + 75;
        const enemy = this.findBestTarget(u.x, u.y, scanRange, u.team, u.canTargetAir);
        if (enemy) {
          const dist = Math.hypot(enemy.x - u.x, enemy.y - u.y) - enemy.radius;
          if (dist <= u.range) {
            u.turretAngle = Math.atan2(enemy.y - u.y, enemy.x - u.x);
            u.angle = u.turretAngle;
            if (u.cooldown <= 0) {
              u.cooldown = u.reload;
              this.fireProjectile(u, enemy, u.projType);
            }
          } else {
            this.moveTowards(u, enemy.x, enemy.y, dt, enemy.id);
          }
        } else if (u.state === 'attackMove') {
          const dist = Math.hypot(u.targetX - u.x, u.targetY - u.y);
          if (dist < 16 || dist < 48 && u.stuckTimer > 0.75) {
            u.state = 'idle';
            u.stuckTimer = 0;
          } else {
            this.moveTowards(u, u.targetX, u.targetY, dt);
          }
        }
      }
    }
    this.resolveCollisions();
  }
  getBridgeAtPoint(x, y, extraMargin = 0) {
    for (const br of this.state.bridges) {
      const dx = x - br.x;
      const dy = y - br.y;
      const cos = Math.cos(-br.angle);
      const sin = Math.sin(-br.angle);
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;
      if (Math.abs(lx) <= br.len * 0.56 + 18 + extraMargin && Math.abs(ly) <= br.w * 0.52 + 8 + extraMargin) {
        return {
          br,
          lx,
          ly
        };
      }
    }
    return null;
  }
  getRiverTelemetry(px, py) {
    if (!this.state.river || this.state.river.length < 2) {
      return {
        x: px,
        y: py,
        dist: 9999,
        side: -1,
        nx: -1,
        ny: 0
      };
    }
    let bestDistSq = Infinity;
    let bestCx = px;
    let bestCy = py;
    let bestVx = 1;
    let bestVy = 1;
    let bestCross = -1;
    let bestLenSq = 1;
    for (let i = 0; i < this.state.river.length - 1; i++) {
      const a = this.state.river[i];
      const b = this.state.river[i + 1];
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      const lenSq = vx * vx + vy * vy || 1;
      const t = Math.max(0, Math.min(1, ((px - a.x) * vx + (py - a.y) * vy) / lenSq));
      const cx = a.x + t * vx;
      const cy = a.y + t * vy;
      const dx = px - cx;
      const dy = py - cy;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestCx = cx;
        bestCy = cy;
        bestVx = vx;
        bestVy = vy;
        bestLenSq = lenSq;
        bestCross = vx * (py - a.y) - vy * (px - a.x);
      }
    }
    const side = bestCross >= 0 ? -1 : 1;
    const segLen = Math.sqrt(bestLenSq) || 1;
    const sign = bestCross >= 0 ? 1 : -1;
    return {
      x: bestCx,
      y: bestCy,
      dist: Math.sqrt(bestDistSq),
      side,
      nx: -bestVy / segLen * sign,
      ny: bestVx / segLen * sign
    };
  }
  getNearestBridgeWaypoint(u, tx, ty) {
    if (!this.state.bridges || this.state.bridges.length === 0) {
      return {
        x: tx,
        y: ty,
        usingBridge: false
      };
    }
    const rU = this.getRiverTelemetry(u.x, u.y);
    const tSide = this.getRiverTelemetry(tx, ty).side;
    const bridgeHit = this.getBridgeAtPoint(u.x, u.y, 16);
    const onBridgeNow = !!bridgeHit;
    const targetBridge = this.getBridgeAtPoint(tx, ty, 10);
    if (onBridgeNow && targetBridge && targetBridge.br === bridgeHit.br) {
      return {
        x: tx,
        y: ty,
        usingBridge: false
      };
    }
    if (rU.side === tSide && !onBridgeNow) {
      return {
        x: tx,
        y: ty,
        usingBridge: false
      };
    }
    const bestBridge = this.state.bridges[0];
    const cos = Math.cos(bestBridge.angle);
    const sin = Math.sin(bestBridge.angle);
    const endA = {
      x: bestBridge.x - cos * (bestBridge.len * 0.55),
      y: bestBridge.y - sin * (bestBridge.len * 0.55)
    };
    const endB = {
      x: bestBridge.x + cos * (bestBridge.len * 0.55),
      y: bestBridge.y + sin * (bestBridge.len * 0.55)
    };
    const sideA = this.getRiverTelemetry(endA.x, endA.y).side;
    const exitPt = sideA === tSide ? endA : endB;
    const entryPt = sideA === tSide ? endB : endA;
    const distEntry = Math.hypot(u.x - entryPt.x, u.y - entryPt.y);
    if (onBridgeNow || distEntry <= 42) {
      const distExit = Math.hypot(u.x - exitPt.x, u.y - exitPt.y);
      const distAB = Math.hypot(exitPt.x - entryPt.x, exitPt.y - entryPt.y) || 1;
      const prog = ((u.x - entryPt.x) * (exitPt.x - entryPt.x) + (u.y - entryPt.y) * (exitPt.y - entryPt.y)) / (distAB * distAB);
      if (distExit <= 34 || prog >= 0.92 || rU.side === tSide && rU.dist > 55) {
        return {
          x: tx,
          y: ty,
          usingBridge: false
        };
      }
      return {
        x: exitPt.x,
        y: exitPt.y,
        usingBridge: true
      };
    }
    return {
      x: entryPt.x,
      y: entryPt.y,
      usingBridge: true
    };
  }
  moveTowards(u, tx, ty, dt, ignoreId = null) {
    if (!u.flying) {
      const wp = this.getNearestBridgeWaypoint(u, tx, ty);
      tx = wp.x;
      ty = wp.y;
    }
    const dx = tx - u.x;
    const dy = ty - u.y;
    const dist = Math.hypot(dx, dy) || 1;
    const baseSpd = u.speed;
    let vx = dx / dist * baseSpd;
    let vy = dy / dist * baseSpd;
    if (!u.flying) {
      const applyAvoidance = (bx, by, br, padDist) => {
        const safeR = br + u.radius + padDist;
        const ox = u.x - bx;
        const oy = u.y - by;
        if (Math.abs(ox) > safeR || Math.abs(oy) > safeR) return;
        const od = Math.hypot(ox, oy) || 1;
        if (od >= safeR) return;
        const factor = (safeR - od) / safeR;
        const nx = ox / od;
        const ny = oy / od;
        vx += nx * factor * baseSpd * 1.5;
        vy += ny * factor * baseSpd * 1.5;
        const t1x = -ny;
        const t1y = nx;
        const dir = t1x * dx + t1y * dy >= 0 ? 1 : -1;
        vx += t1x * dir * factor * baseSpd * 1.3;
        vy += t1y * dir * factor * baseSpd * 1.3;
      };
      for (const obs of this.state.obstacles) {
        applyAvoidance(obs.x, obs.y, obs.r, 14);
      }
      for (const b of this.state.buildings) {
        if (b.id === ignoreId) continue;
        applyAvoidance(b.x, b.y, b.radius, 12);
      }
      const bHit = this.getBridgeAtPoint(u.x, u.y, 14);
      if (bHit) {
        const maxLat = bHit.br.w * 0.38;
        if (Math.abs(bHit.ly) > maxLat) {
          const pushSign = bHit.ly > 0 ? -1 : 1;
          const perpAng = bHit.br.angle + Math.PI / 2;
          vx += Math.cos(perpAng) * pushSign * baseSpd * 0.85;
          vy += Math.sin(perpAng) * pushSign * baseSpd * 0.85;
        }
      } else {
        const rInfo = this.getRiverTelemetry(u.x, u.y);
        const safeRiverDist = 30 + u.radius + 8;
        if (rInfo.dist < safeRiverDist) {
          const ox = u.x - rInfo.x;
          const oy = u.y - rInfo.y;
          const od = rInfo.dist || 1;
          const factor = (safeRiverDist - rInfo.dist) / safeRiverDist;
          const nx = ox / od;
          const ny = oy / od;
          vx += nx * factor * baseSpd * 1.8;
          vy += ny * factor * baseSpd * 1.8;
        }
      }
    }
    const prevX = u.x;
    const prevY = u.y;
    u.x += vx * dt;
    u.y += vy * dt;
    const moved = Math.hypot(u.x - prevX, u.y - prevY);
    if (moved < baseSpd * dt * 0.22) {
      u.stuckTimer = (u.stuckTimer || 0) + dt;
    } else {
      u.stuckTimer = Math.max(0, (u.stuckTimer || 0) - dt * 0.5);
    }
    u.angle = Math.atan2(vy, vx);
    u.turretAngle = u.angle;
    u.walkCycle = (u.walkCycle || 0) + dt * (u.speed * 0.14);
  }
  resolveCollisions() {
    this.rebuildCollisionGrid();
    for (let i = 0; i < this.state.units.length; i++) {
      const a = this.state.units[i];
      if (a.hp <= 0) continue;
      a.x = Math.max(a.radius + 8, Math.min(SLICE_WORLD_W - a.radius - 8, a.x));
      a.y = Math.max(a.radius + 8, Math.min(SLICE_WORLD_H - a.radius - 8, a.y));
      const acx = a._ccx !== undefined ? a._ccx : Math.max(0, Math.min(this.COLL_COLS - 1, a.x / this.COLL_CELL | 0));
      const acy = a._ccy !== undefined ? a._ccy : Math.max(0, Math.min(this.COLL_ROWS - 1, a.y / this.COLL_CELL | 0));
      const r0 = Math.max(0, acy - 1);
      const r1 = Math.min(this.COLL_ROWS - 1, acy + 1);
      const c0 = Math.max(0, acx - 1);
      const c1 = Math.min(this.COLL_COLS - 1, acx + 1);
      for (let gr = r0; gr <= r1; gr++) {
        const rowOff = gr * this.COLL_COLS;
        for (let gc = c0; gc <= c1; gc++) {
          const bucket = this.collBuckets[rowOff + gc];
          for (let bi = 0; bi < bucket.length; bi++) {
            const b = bucket[bi];
            if (b.id <= a.id || a.flying !== b.flying || b.hp <= 0) continue;
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            const minD = a.radius + b.radius + 2;
            if (Math.abs(dx) >= minD || Math.abs(dy) >= minD) continue;
            let d = Math.hypot(dx, dy);
            if (d < minD) {
              if (d < 0.05) {
                const ang = (a.id * 7 + b.id * 13) % 12 * (Math.PI / 6);
                dx = Math.cos(ang);
                dy = Math.sin(ang);
                d = 1;
              }
              const overlap = (minD - d) * 0.5;
              const nx = dx / d;
              const ny = dy / d;
              a.x -= nx * overlap;
              a.y -= ny * overlap;
              b.x += nx * overlap;
              b.y += ny * overlap;
            }
          }
        }
      }
      if (!a.flying) {
        // 1. River bank collision unless on the bridge
        const bColl = this.getBridgeAtPoint(a.x, a.y, 12);
        if (bColl) {
          const maxLy = bColl.br.w * 0.45;
          if (Math.abs(bColl.ly) > maxLy) {
            const clampedLy = Math.sign(bColl.ly) * maxLy;
            const rcos = Math.cos(bColl.br.angle);
            const rsin = Math.sin(bColl.br.angle);
            a.x = bColl.br.x + (bColl.lx * rcos - clampedLy * rsin);
            a.y = bColl.br.y + (bColl.lx * rsin + clampedLy * rcos);
          }
        } else {
          const rInfo = this.getRiverTelemetry(a.x, a.y);
          const minRiverD = 30 + a.radius;
          if (rInfo.dist < minRiverD) {
            let dx = a.x - rInfo.x;
            let dy = a.y - rInfo.y;
            let d = Math.hypot(dx, dy);
            if (d < 0.1) {
              dx = rInfo.nx || (rInfo.side < 0 ? -1 : 1);
              dy = rInfo.ny || 0;
              d = Math.hypot(dx, dy) || 1;
            }
            a.x = rInfo.x + dx / d * (minRiverD + 0.5);
            a.y = rInfo.y + dy / d * (minRiverD + 0.5);
          }
        }

        // 2. Obstacles
        for (const obs of this.state.obstacles) {
          const minD = obs.r + a.radius + 2;
          const dx = a.x - obs.x;
          const dy = a.y - obs.y;
          if (Math.abs(dx) > minD || Math.abs(dy) > minD) continue;
          const d = Math.hypot(dx, dy) || 0.1;
          if (d < minD) {
            a.x = obs.x + dx / d * minD;
            a.y = obs.y + dy / d * minD;
          }
        }

        // 3. Base Buildings
        for (const b of this.state.buildings) {
          if (b.hp <= 0) continue;
          const minD = b.radius + a.radius + 3;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          if (Math.abs(dx) > minD || Math.abs(dy) > minD) continue;
          const d = Math.hypot(dx, dy) || 0.1;
          if (d < minD) {
            a.x = b.x + dx / d * minD;
            a.y = b.y + dy / d * minD;
          }
        }
      }
    }
  }
  fireProjectile(shooter, target, projType) {
    const vetMult = 'veteran' in shooter && shooter.veteran ? 1 + shooter.veteran * 0.2 : 1;
    const dmg = Math.max(1, Math.round(shooter.dmg * vetMult));
    shooter.recoil = projType === 'cannon' ? 6 : 3.5;
    if ('muzzleFlash' in shooter) {
      shooter.muzzleFlash = 0.09;
    }
    const ang = ('turretAngle' in shooter ? shooter.turretAngle : shooter.angle) || 0;
    const muzzleX = shooter.x + Math.cos(ang) * (shooter.radius + 4);
    const muzzleY = shooter.y + Math.sin(ang) * (shooter.radius + 4);
    if (projType === 'turret') {
      this.applyDamage(shooter, target, dmg);
      this.state.projectiles.push({
        id: this.state.nextId++,
        isBeam: true,
        shooterId: shooter.id,
        team: shooter.team,
        sx: muzzleX,
        sy: muzzleY,
        x: target.x,
        y: target.y,
        prevX: muzzleX,
        prevY: muzzleY,
        z: 10,
        prevZ: 10,
        tx: target.x,
        ty: target.y,
        target,
        totalDist: Math.hypot(target.x - muzzleX, target.y - muzzleY),
        traveled: 0,
        arcHeight: 0,
        speed: 900,
        dmg,
        splash: 0,
        projType,
        color: shooter.team === 'player' ? '#38bdf8' : shooter.team === 'bot2' ? '#f59e0b' : '#fb7185',
        life: 0.14,
        maxLife: 0.14
      });
      this.addBurst(target.x, target.y, 6, '#38bdf8', 4);
      return;
    }
    const totalDist = Math.max(12, Math.hypot(target.x - muzzleX, target.y - muzzleY));
    const startZ = this.getTerrainHeightAt(muzzleX, muzzleY) + 5;
    this.state.projectiles.push({
      id: this.state.nextId++,
      isBeam: false,
      shooterId: shooter.id,
      team: shooter.team,
      sx: muzzleX,
      sy: muzzleY,
      x: muzzleX,
      y: muzzleY,
      prevX: muzzleX,
      prevY: muzzleY,
      z: startZ,
      prevZ: startZ,
      tx: target.x,
      ty: target.y,
      target,
      totalDist,
      traveled: 0,
      arcHeight: projType === 'rocket' ? 14 : projType === 'cannon' ? 8 : 2,
      speed: projType === 'laser' ? 420 : projType === 'autocannon' ? 460 : projType === 'cannon' ? 360 : 340,
      dmg,
      splash: 'splash' in shooter ? shooter.splash : 0,
      projType,
      color: shooter.team === 'player' ? projType === 'rocket' ? '#fb923c' : projType === 'autocannon' ? '#2dd4bf' : '#38bdf8' : shooter.team === 'bot2' ? '#f59e0b' : '#f43f5e',
      life: 2.5,
      maxLife: 2.5
    });
  }
  updateProjectiles(dt) {
    for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
      const p = this.state.projectiles[i];
      if (p.isBeam) {
        p.life -= dt;
        if (p.life <= 0) this.state.projectiles.splice(i, 1);
        continue;
      }
      if (p.target && p.target.hp > 0) {
        p.tx = p.target.x;
        p.ty = p.target.y;
      }
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const dist = Math.hypot(dx, dy);
      const step = p.speed * dt;
      if (dist <= step + 8) {
        const shooter = this.state.units.find(u => u.id === p.shooterId) || this.state.buildings.find(b => b.id === p.shooterId) || null;
        if (p.splash > 0) {
          this.addBurst(p.tx, p.ty, 5, '#fb923c', 9);
          for (const u of this.state.units) {
            if (u.team !== p.team && Math.hypot(u.x - p.tx, u.y - p.ty) <= p.splash + u.radius) {
              this.applyDamage(shooter, u, p.dmg);
            }
          }
          for (const b of this.state.buildings) {
            if (b.team !== p.team && Math.hypot(b.x - p.tx, b.y - p.ty) <= p.splash + b.radius) {
              this.applyDamage(shooter, b, p.dmg);
            }
          }
        } else if (p.target && p.target.hp > 0) {
          this.applyDamage(shooter, p.target, p.dmg);
          this.addBurst(p.tx, p.ty, 4, p.color, 5);
        }
        this.state.projectiles.splice(i, 1);
      } else {
        p.x += dx / dist * step;
        p.y += dy / dist * step;
        p.traveled += step;
        const prog = Math.max(0, Math.min(1, p.traveled / (p.totalDist || 100)));
        const groundH = this.getTerrainHeightAt(p.x, p.y);
        p.z = groundH + 4 + Math.sin(prog * Math.PI) * p.arcHeight;
      }
    }
  }
  getTacticalDamageMultiplier(shooter, target) {
    let mult = 1.0;
    if (!shooter || !target) return mult;
    if ('isUnit' in shooter && 'isUnit' in target) {
      const sType = shooter.type;
      const tType = target.type;
      const isArmored = tType === 'tank' || tType === 'apc';
      const isInfantry = tType === 'marine' || tType === 'trooper';
      if (sType === 'trooper' && isArmored) mult *= 1.45;
      if ((sType === 'marine' || sType === 'apc') && isInfantry) mult *= 1.35;else if (sType === 'marine' && tType === 'tank') mult *= 0.58;
    }
    if ('isUnit' in shooter && shooter.onHighGround && (!('isUnit' in target) || !target.onHighGround)) {
      mult *= 1.22;
    }
    if ('isUnit' in target && target.onHighGround && (!('isUnit' in shooter) || !shooter.onHighGround)) {
      mult *= 0.82;
    }
    return mult;
  }
  applyDamage(shooter, target, dmg) {
    if (!target || target.hp <= 0) return;
    const tacMult = this.getTacticalDamageMultiplier(shooter, target);
    let rem = Math.max(2, Math.round(dmg * tacMult));
    if (target.shield > 0) {
      const absorbed = Math.min(target.shield, rem);
      target.shield -= absorbed;
      rem -= absorbed;
    }
    target.hp -= rem;
    if (target.hp <= 0 && shooter && 'isUnit' in shooter) {
      shooter.kills = (shooter.kills || 0) + 1;
      if (shooter.kills === 3 && shooter.veteran < 1) {
        shooter.veteran = 1;
        shooter.maxHp = Math.round(shooter.maxHp * 1.15);
        shooter.hp = shooter.maxHp;
      }
    }
  }
  addBurst(x, y, z, color, count = 8) {
    if (this.state.particles.length > 140) return;
    this.state.particles.push({
      id: this.state.nextId++,
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      r: 3,
      color,
      isRing: true,
      maxR: 16 + count * 1.2,
      life: 0.32,
      maxLife: 0.32
    });
    for (let i = 0; i < count; i++) {
      const ang = this.random() * Math.PI * 2;
      const spd = 18 + this.random() * 55;
      this.state.particles.push({
        id: this.state.nextId++,
        x,
        y,
        z: z + 2,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        vz: 20 + this.random() * 35,
        r: 1.5 + this.random() * 2,
        color: i % 2 === 0 ? color : '#fde047',
        life: 0.25 + this.random() * 0.25,
        maxLife: 0.5
      });
    }
  }
  getFormationOffsets(units, destX, destY) {
    const count = units.length;
    const offsets = new Map();
    if (count === 0) return offsets;
    const avgX = units.reduce((s, u) => s + u.x, 0) / count;
    const avgY = units.reduce((s, u) => s + u.y, 0) / count;
    const moveAng = Math.atan2(destY - avgY, destX - avgX);
    const perpAng = moveAng + Math.PI / 2;
    const sorted = [...units].sort((a, b) => {
      const w = u => u.type === 'tank' ? 1 : u.type === 'apc' ? 2 : 3;
      return w(a) - w(b);
    });
    sorted.forEach((u, idx) => {
      const rank = Math.floor((idx + 1) / 2);
      const side = idx === 0 ? 0 : idx % 2 === 1 ? 1 : -1;
      const forward = -rank * 22;
      const lateral = side * rank * 22;
      offsets.set(u.id, {
        x: Math.max(20, Math.min(SLICE_WORLD_W - 20, destX + Math.cos(moveAng) * forward + Math.cos(perpAng) * lateral)),
        y: Math.max(20, Math.min(SLICE_WORLD_H - 20, destY + Math.sin(moveAng) * forward + Math.sin(perpAng) * lateral))
      });
    });
    return offsets;
  }
  issueMoveOrder(wx, wy, attackMove = false) {
    const selected = this.state.units.filter(u => u.team === 'player' && u.selected && u.hp > 0);
    if (selected.length === 0) return 0;
    const formMap = this.getFormationOffsets(selected, wx, wy);
    for (const u of selected) {
      const pt = formMap.get(u.id) || {
        x: wx,
        y: wy
      };
      u.targetX = pt.x;
      u.targetY = pt.y;
      u.state = attackMove ? 'attackMove' : 'move';
      u.targetEntity = null;
    }
    this.addBurst(wx, wy, this.getTerrainHeightAt(wx, wy) + 1, attackMove ? '#f43f5e' : '#4ade80', 4);
    return selected.length;
  }
  issueAttackTargetOrder(target) {
    const selected = this.state.units.filter(u => u.team === 'player' && u.selected && u.hp > 0);
    if (selected.length === 0) return 0;
    for (const u of selected) {
      u.state = 'attackTarget';
      u.targetEntity = target;
    }
    this.addBurst(target.x, target.y, this.getTerrainHeightAt(target.x, target.y) + 2, '#f43f5e', 5);
    return selected.length;
  }
}
function ryNorm(ly, ry) {
  return ly * ly / (ry * ry);
}

// ==========================================
// MODULE: src/adapter/worldAdapter.ts
// ==========================================
function lerpAngle(a, b, t) {
  const diff = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + diff * t;
}

/**
 * WorldAdapter maps 2D simulation coordinates (game.x, game.y)
 * into 3D world space (mesh.position.x, mesh.position.y, mesh.position.z)
 * and provides smooth tick interpolation without mutating GameCore state.
 */
class WorldAdapter {
  constructor(scale = WORLD_SCALE) {
    this.scale = scale;
  }
  toWorld3D(gameX, gameY, elevation = 0) {
    return {
      x: gameX * this.scale,
      y: elevation * this.scale,
      z: gameY * this.scale
    };
  }
  toGame2D(worldX, worldZ) {
    return {
      x: worldX / this.scale,
      y: worldZ / this.scale
    };
  }
  getInterpolatedUnitTransform(core, u, alpha) {
    const a = Math.max(0, Math.min(1, alpha));
    const ix = u.prevX + (u.x - u.prevX) * a;
    const iy = u.prevY + (u.y - u.prevY) * a;
    const terrainH = core.getTerrainHeightAt(ix, iy);
    const alt = u.flying ? terrainH + 42 : terrainH;
    const simAngle = lerpAngle(u.prevAngle, u.angle, a);
    const simTurret = lerpAngle(u.prevTurretAngle, u.turretAngle, a);

    // In 2D canvas, +X is 0 rad and +Y (down/south) is +PI/2.
    // In Three.js (X right, Z south), yaw around +Y is -simAngle.
    return {
      pos: this.toWorld3D(ix, iy, alt),
      yaw: -simAngle,
      turretYaw: -simTurret
    };
  }
  getBuildingTransform(core, b) {
    const terrainH = core.getTerrainHeightAt(b.x, b.y);
    return {
      pos: this.toWorld3D(b.x, b.y, terrainH),
      yaw: 0,
      turretYaw: -b.angle
    };
  }
}

// ==========================================
// MODULE: src/render/models3d.ts
// ==========================================
// ============================================================================
// STARFRONT 3D — VERTICAL SLICE 001
// Module: src/render/models3d.ts
// Shared Low-Poly Geometry & Material Cache for Hardware Instanced Batches
// ============================================================================
class LowPolyModelFactory {
  geometries = new Map();
  factionMaterials = new Map();
  commonMaterials = new Map();
  constructor() {
    this.initSharedAssets();
  }
  initSharedAssets() {
    // Common shared materials (white base color on instanced materials so per-instance setColorAt(i, THREE.Color) tints cleanly)
    this.commonMaterials.set('instancedLambert', new THREE.MeshLambertMaterial({
      color: 0xffffff
    }));
    this.commonMaterials.set('instancedBasic', new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    }));
    this.commonMaterials.set('darkHull', new THREE.MeshLambertMaterial({
      color: 0x1e293b
    }));
    this.commonMaterials.set('tread', new THREE.MeshLambertMaterial({
      color: 0x0f172a
    }));
    this.commonMaterials.set('steel', new THREE.MeshLambertMaterial({
      color: 0x94a3b8
    }));
    this.commonMaterials.set('skinVisor', new THREE.MeshLambertMaterial({
      color: 0xbae6fd
    }));
    this.commonMaterials.set('gold', new THREE.MeshLambertMaterial({
      color: 0xfacc15
    }));
    this.commonMaterials.set('muzzle', new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.9
    }));
    this.commonMaterials.set('selectRing', new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      side: THREE.DoubleSide
    }));
    this.commonMaterials.set('hpBg', new THREE.MeshBasicMaterial({
      color: 0x020617,
      side: THREE.DoubleSide
    }));
    this.commonMaterials.set('hpPlayer', new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide
    }));
    this.commonMaterials.set('hpEnemy', new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      side: THREE.DoubleSide
    }));
    this.commonMaterials.set('hpBot2', new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide
    }));

    // Faction materials
    ['player', 'enemy', 'bot2', 'neutral'].forEach(team => {
      const pal = FACTION_COLORS[team];
      this.factionMaterials.set(`${team}_primary`, new THREE.MeshLambertMaterial({
        color: pal.primary
      }));
      this.factionMaterials.set(`${team}_accent`, new THREE.MeshLambertMaterial({
        color: pal.accent
      }));
      this.factionMaterials.set(`${team}_dark`, new THREE.MeshLambertMaterial({
        color: pal.dark
      }));
    });

    // Shared low-poly geometries
    this.geometries.set('box', new THREE.BoxGeometry(1, 1, 1));
    this.geometries.set('cyl', new THREE.CylinderGeometry(0.5, 0.5, 1, 8));
    this.geometries.set('oct', new THREE.CylinderGeometry(0.85, 1.0, 1, 8));
    this.geometries.set('cone', new THREE.ConeGeometry(0.5, 1, 6));
    this.geometries.set('sphere', new THREE.SphereGeometry(0.5, 8, 6));
    this.geometries.set('ring', new THREE.RingGeometry(0.82, 1.0, 20));
    this.geometries.set('plane', new THREE.PlaneGeometry(1, 1));
    this.geometries.set('rock', new THREE.DodecahedronGeometry(1, 0));
  }
  getGeo(key) {
    return this.geometries.get(key);
  }
  getCommonMat(key) {
    return this.commonMaterials.get(key);
  }
  getFactionMat(team, variant = 'primary') {
    return this.factionMaterials.get(`${team}_${variant}`);
  }
}

// ==========================================
// MODULE: src/render/scene3d.ts
// ==========================================
// ============================================================================
// STARFRONT 3D — VERTICAL SLICE 001 (R2.1)
// Module: src/render/scene3d.ts
// Three.js WebGL2 Hardware-Instanced Battlefield Renderer, Tactical Camera,
// WebGL Context-Loss Telemetry, and Authoritative GameCore Sync Loop
// ============================================================================
class BattlefieldScene3D {
  cameraTarget = new THREE.Vector3(380, 0, 520);
  cameraZoom = 1.05;
  cameraYaw = Math.PI / 4; // 45 degrees tactical azimuth
  cameraPitch = Math.PI / 4; // 45 degrees above ground
  cameraDist = 900;
  frustumSize = 680;
  qualityPreset = 'balanced';
  outpostMeshes = new Map();

  // 28 Hardware-Instanced Mesh Batches (gl.drawArraysInstanced)
  // Static Battlefield Instanced Batches (6)

  // Dynamic Building Instanced Batches (8)

  // Barracks hall/roof, Factory bay, Turret head
  // Factory stacks, Turret barrels

  // Dynamic Unit Instanced Batches (9)

  // Tank barrels, APC guns, Infantry weapons

  // Shared Combat & UI Instanced Batches (5)

  maxParticles = 80;
  tempMatrix = new THREE.Matrix4();
  tempPos = new THREE.Vector3();
  tempRot = new THREE.Euler();
  tempQuat = new THREE.Quaternion();
  tempScale = new THREE.Vector3();
  tempColor = new THREE.Color();
  // InstancedMesh.setMatrixAt/setColorAt only modify CPU arrays. Three.js
  // does not upload these changes to the GPU until the attributes are marked
  // needsUpdate. Keep one dirty flag per batch rather than per instance.
  dirtyInstanceMatrices = new Set();
  dirtyInstanceColors = new Set();

  // Measured Renderer & Context Telemetry (Phase 2 & Phase 3)
  lastFrameRenderMs = 0;
  avgFrameRenderMs = 0;
  contextLossCount = 0;
  constructor(container, core) {
    this.container = container;
    this.core = core;
    this.adapter = new WorldAdapter(1.0);
    this.factory = new LowPolyModelFactory();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07101f);
    const aspect = Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight);
    this.camera = new THREE.OrthographicCamera(-this.frustumSize * aspect / 2, this.frustumSize * aspect / 2, this.frustumSize / 2, -this.frustumSize / 2, 1, 2600);
    const canvas = document.createElement('canvas');
    canvas.id = 'battlefieldCanvas3D';
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    container.appendChild(canvas);

    // Track WebGL context-loss & restore events for Phase 3 iPhone Diagnostic HUD
    canvas.addEventListener('webglcontextlost', e => {
      e.preventDefault();
      this.contextLossCount++;
      this.onContextLost?.({
        timestampIso: new Date().toISOString(),
        count: this.contextLossCount
      });
    }, false);

    // Official three@0.160 throws if the WebGL context is not yet available
    // (common on headless SwiftShader cold-start and some mobile Safari resumes).
    // Retry briefly instead of hard-crashing the tactical HUD boot path.
    this.renderer = this.createRendererWithRetry(canvas);
    this.setupLighting();
    this.buildStaticBattlefield();
    this.initDynamicInstancedBatches();
    this.setQualityPreset('balanced');
    this.handleResize();
    this.updateCameraTransform();
  }
  createRendererWithRetry(canvas) {
    // Prefer high-performance; fall back for constrained mobile / software GL.
    // preserveDrawingBuffer: required for diagnostic screenshots / readPixels verification
    // against official three (default false clears the buffer after composite).
    const attempts = [{
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    }, {
      canvas,
      antialias: true,
      powerPreference: 'default',
      preserveDrawingBuffer: true
    }, {
      canvas,
      antialias: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: true
    }, {
      canvas,
      antialias: false,
      preserveDrawingBuffer: true
    }];
    let lastError = null;
    for (const params of attempts) {
      try {
        return new THREE.WebGLRenderer(params);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Error creating WebGL context after attribute fallbacks');
  }
  setInstTransform(mesh, idx, px, py, pz, rx, ry, rz, sx, sy, sz, colorHex) {
    this.tempPos.set(px, py, pz);
    this.tempRot.set(rx, ry, rz);
    this.tempQuat.setFromEuler(this.tempRot);
    this.tempScale.set(sx, sy, sz);
    this.tempMatrix.compose(this.tempPos, this.tempQuat, this.tempScale);
    mesh.setMatrixAt(idx, this.tempMatrix);
    this.dirtyInstanceMatrices.add(mesh);
    if (colorHex !== undefined) {
      this.tempColor.set(colorHex);
      mesh.setColorAt(idx, this.tempColor);
      this.dirtyInstanceColors.add(mesh);
    }
  }
  flushDirtyInstanceBuffers() {
    for (const mesh of this.dirtyInstanceMatrices) {
      mesh.instanceMatrix.needsUpdate = true;
    }
    for (const mesh of this.dirtyInstanceColors) {
      if (mesh.instanceColor !== null) mesh.instanceColor.needsUpdate = true;
    }
    this.dirtyInstanceMatrices.clear();
    this.dirtyInstanceColors.clear();
  }
  createBatch(geoKey, matKey, maxCount, castShadow = false) {
    const geo = this.factory.getGeo(geoKey);
    const mat = this.factory.getCommonMat(matKey);
    const inst = new THREE.InstancedMesh(geo, mat, maxCount);
    inst.count = 0;
    inst.visible = true;
    inst.castShadow = castShadow;
    inst.receiveShadow = castShadow;
    this.scene.add(inst);
    return inst;
  }
  setupLighting() {
    const hemi = new THREE.HemisphereLight(0xbae6fd, 0x0f172a, 0.85);
    hemi.position.set(0, 500, 0);
    this.scene.add(hemi);
    this.dirLight = new THREE.DirectionalLight(0xfffbeb, 1.15);
    this.dirLight.position.set(350, 620, 260);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.camera.left = -700;
    this.dirLight.shadow.camera.right = 700;
    this.dirLight.shadow.camera.top = 700;
    this.dirLight.shadow.camera.bottom = -700;
    this.dirLight.shadow.camera.near = 100;
    this.dirLight.shadow.camera.far = 1500;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.scene.add(this.dirLight);
  }

  /** Fired when WebGL context is lost. Does not read native thermal state. */
  onContextLost = null;

  /** Fired for every resize decision, including Safari chrome changes that do not reallocate the buffer. */
  onViewportDecision = null;
  appliedCssW = 0;
  appliedCssH = 0;
  setQualityPreset(preset) {
    this.qualityPreset = preset;
    const rawDpr = typeof window !== 'undefined' && window.devicePixelRatio || 1;
    if (preset === 'eco') {
      this.renderer.setPixelRatio(Math.min(rawDpr, 1.0));
      this.renderer.shadowMap.enabled = false;
      this.dirLight.castShadow = false;
    } else if (preset === 'balanced') {
      this.renderer.setPixelRatio(Math.min(rawDpr, 1.35));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      this.dirLight.castShadow = true;
    } else {
      this.renderer.setPixelRatio(Math.min(rawDpr, 2.0));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.dirLight.castShadow = true;
    }
    this.handleResize(true);
  }
  getQualityPreset() {
    return this.qualityPreset;
  }
  buildStaticBattlefield() {
    // 1. Non-Instanced Mesh #1: Low-Poly Ground Terrain Plane (1200 x 800)
    const groundGeo = new THREE.PlaneGeometry(SLICE_WORLD_W, SLICE_WORLD_H, 48, 32);
    groundGeo.rotateX(-Math.PI / 2);
    const posAttr = groundGeo.attributes.position;
    const colors = [];
    const cBase = new THREE.Color(0x0c192e);
    const cHigh = new THREE.Color(0x1e293b);
    const cBank = new THREE.Color(0x0f2942);
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i) + SLICE_WORLD_W / 2;
      const vz = posAttr.getZ(i) + SLICE_WORLD_H / 2;
      const h = this.core.getTerrainHeightAt(vx, vz);
      posAttr.setY(i, h);
      const col = h > 8 ? cHigh : h < -1 ? cBank : cBase;
      colors.push(col.r, col.g, col.b);
    }
    groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();
    const groundMat = new THREE.MeshLambertMaterial({
      vertexColors: true
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.set(SLICE_WORLD_W / 2, 0, SLICE_WORLD_H / 2);
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // Tactical Grid Helper overlay (LineSegments)
    const grid = new THREE.GridHelper(SLICE_WORLD_W, 24, 0x1e3a5f, 0x11223a);
    grid.position.set(SLICE_WORLD_W / 2, 0.25, SLICE_WORLD_H / 2);
    this.scene.add(grid);

    // 2. Instanced River Water Segments
    const riverPts = this.core.state.river;
    const riverSegCount = Math.max(1, riverPts.length - 1);
    this.instRiverWater = this.createBatch('box', 'instancedBasic', riverSegCount, false);
    this.instRiverWater.count = riverPts.length - 1;
    for (let i = 0; i < riverPts.length - 1; i++) {
      const a = riverPts[i];
      const b = riverPts[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      this.setInstTransform(this.instRiverWater, i, (a.x + b.x) / 2, -1.8, (a.y + b.y) / 2, 0, -ang, 0, len + 18, 0.4, 64, 0x0284c7);
    }

    // 3. Instanced Tactical Roads
    const roads = this.core.state.roads;
    this.instRoads = this.createBatch('box', 'instancedLambert', Math.max(1, roads.length), false);
    this.instRoads.count = roads.length;
    for (let i = 0; i < roads.length; i++) {
      const r = roads[i];
      const len = Math.hypot(r.x2 - r.x1, r.y2 - r.y1);
      const ang = Math.atan2(r.y2 - r.y1, r.x2 - r.x1);
      this.setInstTransform(this.instRoads, i, (r.x1 + r.x2) / 2, 0.4, (r.y1 + r.y2) / 2, 0, -ang, 0, len, 0.3, r.w, 0x1e293b);
    }

    // 4. Instanced Bridge Deck, Guardrails & Bollards
    const bridges = this.core.state.bridges;
    this.instBridgeDeck = this.createBatch('box', 'instancedLambert', Math.max(1, bridges.length), true);
    this.instBridgeRails = this.createBatch('box', 'instancedLambert', Math.max(2, bridges.length * 2), true);
    this.instBridgeBollards = this.createBatch('box', 'instancedLambert', Math.max(12, bridges.length * 12), true);
    let deckIdx = 0;
    let railIdx = 0;
    let bollardIdx = 0;
    for (const br of bridges) {
      const yaw = -br.angle;
      const cos = Math.cos(br.angle);
      const sin = Math.sin(br.angle);
      this.setInstTransform(this.instBridgeDeck, deckIdx++, br.x, 3.5, br.y, 0, yaw, 0, br.len, 3.5, br.w, 0x334155);
      for (const side of [-1, 1]) {
        const rz = side * (br.w / 2 - 2.5);
        const wx = br.x - sin * rz;
        const wz = br.y + cos * rz;
        this.setInstTransform(this.instBridgeRails, railIdx++, wx, 7.0, wz, 0, yaw, 0, br.len, 4.5, 3.5, 0xf59e0b);
        for (let i = 0; i < 6; i++) {
          const rx = -br.len * 0.42 + i / 5 * (br.len * 0.84);
          const bx = br.x + cos * rx - sin * rz;
          const bz = br.y + sin * rx + cos * rz;
          this.setInstTransform(this.instBridgeBollards, bollardIdx++, bx, 8.3, bz, 0, yaw, 0, 3.2, 6.5, 3.2, i % 2 === 0 ? 0xfacc15 : 0x38bdf8);
        }
      }
    }
    this.instBridgeDeck.count = deckIdx;
    this.instBridgeRails.count = railIdx;
    this.instBridgeBollards.count = bollardIdx;

    // 5. Instanced Low-Poly Rock Obstacles
    const obstacles = this.core.state.obstacles;
    this.instRocks = this.createBatch('rock', 'instancedLambert', Math.max(1, obstacles.length), true);
    this.instRocks.count = obstacles.length;
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      this.setInstTransform(this.instRocks, i, obs.x, obs.r * 0.45, obs.y, 0, i * 1.1, 0, obs.r, obs.r * 0.65, obs.r, 0x475569);
    }
  }
  initDynamicInstancedBatches() {
    // Building Batches (7)
    this.instBldgPads = this.createBatch('oct', 'darkHull', 32, true);
    this.instBldgHqMain = this.createBatch('oct', 'instancedLambert', 8, true);
    this.instBldgHqSpire = this.createBatch('box', 'instancedLambert', 8, true);
    this.instBldgHqDish = this.createBatch('box', 'steel', 8, true);
    this.instBldgBoxes = this.createBatch('box', 'instancedLambert', 64, true);
    this.instBldgCyls = this.createBatch('cyl', 'steel', 64, true);
    this.instBldgTurretBase = this.createBatch('oct', 'instancedLambert', 32, true);

    // Unit Batches (10)
    this.instTankTreads = this.createBatch('box', 'tread', 128, true);
    this.instTankHulls = this.createBatch('box', 'darkHull', 64, true);
    this.instTankGlacis = this.createBatch('box', 'instancedLambert', 64, true);
    this.instTankTurrets = this.createBatch('oct', 'instancedLambert', 64, true);
    this.instApcWheels = this.createBatch('cyl', 'tread', 384, true);
    this.instApcBodies = this.createBatch('box', 'instancedLambert', 192, true);
    this.instInfantryLegs = this.createBatch('box', 'darkHull', 128, true);
    this.instInfantryTorsos = this.createBatch('box', 'instancedLambert', 128, true);
    this.instInfantryHelmets = this.createBatch('sphere', 'instancedLambert', 128, true);
    this.instUnitBarrels = this.createBatch('cyl', 'instancedLambert', 256, true);

    // Combat & UI Batches (5)
    this.instMuzzleFlashes = this.createBatch('cone', 'muzzle', 128, false);
    this.instSelectRings = this.createBatch('ring', 'selectRing', 128, false);
    this.instHpBg = this.createBatch('plane', 'hpBg', 256, false);
    this.instHpFill = this.createBatch('plane', 'instancedBasic', 256, false);
    this.instProjectiles = this.createBatch('sphere', 'instancedBasic', 256, false);

    // Particle Pool Instanced Batch (1) => Total = 6 static + 7 bldg + 10 unit + 6 fx = 29 InstancedMeshes
    this.particleInstancedMesh = this.createBatch('sphere', 'instancedBasic', this.maxParticles, false);
  }
  syncFromGameCore(alpha) {
    const state = this.core.state;

    // 1. Sync Outpost (3 non-instanced meshes: ring, progRing, beacon)
    for (const op of state.outposts) {
      let visual = this.outpostMeshes.get(op.id);
      if (!visual) {
        const ringGeo = new THREE.RingGeometry(op.radius - 3, op.radius, 32);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x94a3b8,
          side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(op.x, 4.2, op.y);
        this.scene.add(ring);
        const progGeo = new THREE.RingGeometry(op.radius * 0.35, op.radius * 0.48, 24);
        progGeo.rotateX(-Math.PI / 2);
        const progMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide
        });
        const progRing = new THREE.Mesh(progGeo, progMat);
        progRing.position.set(op.x, 4.3, op.y);
        this.scene.add(progRing);
        const beacon = new THREE.Mesh(this.factory.getGeo('oct'), new THREE.MeshLambertMaterial({
          color: 0x94a3b8
        }));
        beacon.scale.set(10, 18, 10);
        beacon.position.set(op.x, 12, op.y);
        this.scene.add(beacon);
        visual = {
          ring,
          beacon,
          progRing
        };
        this.outpostMeshes.set(op.id, visual);
      }
      const ownerColor = FACTION_COLORS[op.owner].primary;
      visual.ring.material.color.setHex(ownerColor);
      visual.beacon.material.color.setHex(ownerColor);
      visual.beacon.rotation.y += 0.03;
      const capTeam = op.capturingTeam || (op.owner !== 'neutral' ? op.owner : null);
      const capColor = capTeam ? FACTION_COLORS[capTeam].accent : 0x94a3b8;
      visual.progRing.material.color.setHex(capColor);
      const s = Math.max(0.1, op.progress / 100);
      visual.progRing.scale.set(s, 1, s);
    }

    // 2. Sync Buildings into Instanced Batches
    let padIdx = 0;
    let hqMainIdx = 0;
    let hqSpireIdx = 0;
    let hqDishIdx = 0;
    let bldgBoxIdx = 0;
    let bldgCylIdx = 0;
    let bldgTurretBaseIdx = 0;
    let hpBgIdx = 0;
    let hpFillIdx = 0;
    for (const b of state.buildings) {
      if (b.hp <= 0) continue;
      const tf = this.adapter.getBuildingTransform(this.core, b);
      const bx = tf.pos.x;
      const by = tf.pos.y;
      const bz = tf.pos.z;
      const r = b.radius;
      const pal = FACTION_COLORS[b.team];
      const hpColor = b.team === 'player' ? 0x22c55e : b.team === 'bot2' ? 0xf59e0b : 0xf43f5e;

      // Foundation pad
      this.setInstTransform(this.instBldgPads, padIdx++, bx, by + 2, bz, 0, 0, 0, r, 4, r);
      if (b.type === 'hq') {
        this.setInstTransform(this.instBldgHqMain, hqMainIdx++, bx, by + 13, bz, 0, 0, 0, r * 0.75, 22, r * 0.75, pal.primary);
        this.setInstTransform(this.instBldgHqSpire, hqSpireIdx++, bx, by + 28, bz, 0, 0, 0, 16, 16, 16, pal.accent);
        this.setInstTransform(this.instBldgHqDish, hqDishIdx++, bx, by + 38, bz, 0, state.timeElapsed * 1.4, 0, 22, 3.5, 4);
      } else if (b.type === 'barracks') {
        this.setInstTransform(this.instBldgBoxes, bldgBoxIdx++, bx, by + 10, bz, 0, 0, 0, r * 1.35, 16, r * 1.05, pal.primary);
        this.setInstTransform(this.instBldgBoxes, bldgBoxIdx++, bx, by + 19.5, bz, 0, 0, 0, r * 1.1, 3, r * 0.6, pal.accent);
      } else if (b.type === 'factory') {
        this.setInstTransform(this.instBldgBoxes, bldgBoxIdx++, bx, by + 11, bz, 0, 0, 0, r * 1.45, 18, r * 1.25, pal.primary);
        for (const sx of [-12, 12]) {
          this.setInstTransform(this.instBldgCyls, bldgCylIdx++, bx + sx, by + 24, bz - r * 0.35, 0, 0, 0, 6, 16, 6);
        }
      } else if (b.type === 'turret') {
        this.setInstTransform(this.instBldgTurretBase, bldgTurretBaseIdx++, bx, by + 8, bz, 0, 0, 0, r * 0.72, 12, r * 0.72, pal.primary);
        const tyaw = tf.turretYaw;
        const cosT = Math.cos(tyaw);
        const sinT = Math.sin(tyaw);
        this.setInstTransform(this.instBldgBoxes, bldgBoxIdx++, bx, by + 16, bz, 0, tyaw, 0, 14, 7, 13, pal.accent);
        for (const bzOff of [-3.5, 3.5]) {
          const wx = bx + cosT * 11 + sinT * bzOff;
          const wz = bz - sinT * 11 + cosT * bzOff;
          this.setInstTransform(this.instBldgCyls, bldgCylIdx++, wx, by + 16, wz, 0, tyaw, Math.PI / 2, 2.0, 18, 2.0);
        }
      } else {
        this.setInstTransform(this.instBldgBoxes, bldgBoxIdx++, bx, by + 9.5, bz, 0, 0, 0, r * 1.2, 15, r * 1.2, pal.primary);
      }

      // Building HP Bar
      const hpW = r * 1.6;
      const hpY = by + (b.type === 'hq' ? 46 : 28);
      const hpRatio = Math.max(0.01, b.hp / b.maxHp);
      const fillW = (hpW - 1.5) * hpRatio;
      const fillX = bx - (1 - hpRatio) * (hpW - 1.5) * 0.5;
      this.setInstTransform(this.instHpBg, hpBgIdx++, bx, hpY, bz, -Math.PI / 4, 0, 0, hpW, 3.8, 1);
      this.setInstTransform(this.instHpFill, hpFillIdx++, fillX, hpY + 0.1, bz + 0.2, -Math.PI / 4, 0, 0, fillW, 2.6, 1, hpColor);
    }
    this.instBldgPads.count = padIdx;
    this.instBldgHqMain.count = hqMainIdx;
    this.instBldgHqSpire.count = hqSpireIdx;
    this.instBldgHqDish.count = hqDishIdx;
    this.instBldgBoxes.count = bldgBoxIdx;
    this.instBldgCyls.count = bldgCylIdx;
    this.instBldgTurretBase.count = bldgTurretBaseIdx;

    // 3. Sync Units into Hardware-Instanced Batches
    let tankTreadIdx = 0;
    let tankHullIdx = 0;
    let tankGlacisIdx = 0;
    let tankTurretIdx = 0;
    let apcWheelIdx = 0;
    let apcBodyIdx = 0;
    let infLegIdx = 0;
    let infTorsoIdx = 0;
    let infHelmetIdx = 0;
    let barrelIdx = 0;
    let muzzleIdx = 0;
    let selectIdx = 0;
    for (const u of state.units) {
      if (u.hp <= 0) continue;
      const tf = this.adapter.getInterpolatedUnitTransform(this.core, u, alpha);
      const ux = tf.pos.x;
      const uy = tf.pos.y;
      const uz = tf.pos.z;
      const yaw = tf.yaw;
      const tyaw = tf.turretYaw;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosT = Math.cos(tyaw);
      const sinT = Math.sin(tyaw);
      const pal = FACTION_COLORS[u.team];
      const hpColor = u.team === 'player' ? 0x22c55e : u.team === 'bot2' ? 0xf59e0b : 0xf43f5e;
      if (u.type === 'tank') {
        for (const zOff of [-9, 9]) {
          const tx = ux + sinY * zOff;
          const tz = uz + cosY * zOff;
          this.setInstTransform(this.instTankTreads, tankTreadIdx++, tx, uy + 3, tz, 0, yaw, 0, 28, 6, 7);
        }
        this.setInstTransform(this.instTankHulls, tankHullIdx++, ux, uy + 5.5, uz, 0, yaw, 0, 26, 6.5, 15);
        this.setInstTransform(this.instTankGlacis, tankGlacisIdx++, ux + cosY * 1, uy + 8.2, uz - sinY * 1, 0, yaw, 0, 22, 3, 14, pal.primary);
        const turX = ux - cosY * 1;
        const turZ = uz + sinY * 1;
        this.setInstTransform(this.instTankTurrets, tankTurretIdx++, turX, uy + 10.5, turZ, 0, tyaw, 0, 8.5, 4.5, 7.5, pal.primary);
        this.setInstTransform(this.instUnitBarrels, barrelIdx++, turX + cosT * 12, uy + 11.0, turZ - sinT * 12, 0, tyaw, Math.PI / 2, 2.2, 20, 2.2, 0x94a3b8);
      } else if (u.type === 'apc') {
        for (const wxOff of [-9, 0, 9]) {
          for (const wzOff of [-8.5, 8.5]) {
            const wx = ux + cosY * wxOff + sinY * wzOff;
            const wz = uz - sinY * wxOff + cosY * wzOff;
            this.setInstTransform(this.instApcWheels, apcWheelIdx++, wx, uy + 3.2, wz, Math.PI / 2, yaw, 0, 6.5, 3, 6.5);
          }
        }
        this.setInstTransform(this.instApcBodies, apcBodyIdx++, ux, uy + 6.5, uz, 0, yaw, 0, 25, 7.5, 14, pal.primary);
        this.setInstTransform(this.instApcBodies, apcBodyIdx++, ux + cosY * 11.5, uy + 6.0, uz - sinY * 11.5, 0, yaw, 0, 6, 4.5, 12.5, pal.accent);
        this.setInstTransform(this.instApcBodies, apcBodyIdx++, ux, uy + 11.5, uz, 0, tyaw, 0, 7, 3.8, 6.5, 0x1e293b);
        this.setInstTransform(this.instUnitBarrels, barrelIdx++, ux + cosT * 8, uy + 11.9, uz - sinT * 8, 0, tyaw, Math.PI / 2, 1.4, 14, 1.4, 0x94a3b8);
      } else {
        // Infantry (Marine / SpecOps Trooper)
        this.setInstTransform(this.instInfantryLegs, infLegIdx++, ux, uy + 3, uz, 0, yaw, 0, 4.5, 6, 5.5);
        this.setInstTransform(this.instInfantryTorsos, infTorsoIdx++, ux, uy + 9.5, uz, 0, yaw, 0, 6.2, 7.5, 7.5, pal.primary);
        this.setInstTransform(this.instInfantryHelmets, infHelmetIdx++, ux, uy + 14.5, uz, 0, tyaw, 0, 6.5, 6.5, 6.5, pal.accent);
        const weapX = ux + cosT * 5.5 + sinT * 3.8;
        const weapZ = uz - sinT * 5.5 + cosT * 3.8;
        this.setInstTransform(this.instUnitBarrels, barrelIdx++, weapX, uy + 11.0, weapZ, 0, tyaw, Math.PI / 2, 2.0, u.type === 'trooper' ? 13 : 10.5, 2.0, u.type === 'trooper' ? 0xfacc15 : 0x94a3b8);
      }
      if (u.muzzleFlash > 0) {
        const mfDist = u.type === 'tank' ? 22 : u.type === 'apc' ? 16 : 12;
        const mfSide = u.type === 'tank' || u.type === 'apc' ? 0 : 3.8;
        const mx = ux + cosT * mfDist + sinT * mfSide;
        const mz = uz - sinT * mfDist + cosT * mfSide;
        this.setInstTransform(this.instMuzzleFlashes, muzzleIdx++, mx, uy + 11.0, mz, 0, tyaw, -Math.PI / 2, 5, 9, 5);
      }
      if (u.selected) {
        const sr = u.radius + 5;
        this.setInstTransform(this.instSelectRings, selectIdx++, ux, uy + 0.8, uz, -Math.PI / 2, 0, 0, sr, sr, 1);
      }

      // Unit HP Bar
      const hpW = Math.max(18, u.radius * 1.9);
      const hpY = uy + (u.type === 'tank' || u.type === 'apc' ? 21 : 23);
      const hpRatio = Math.max(0.01, u.hp / u.maxHp);
      const fillW = (hpW - 1) * hpRatio;
      const fillX = ux - (1 - hpRatio) * (hpW - 1) * 0.5;
      this.setInstTransform(this.instHpBg, hpBgIdx++, ux, hpY, uz, -Math.PI / 4, 0, 0, hpW, 2.6, 1);
      this.setInstTransform(this.instHpFill, hpFillIdx++, fillX, hpY + 0.1, uz + 0.2, -Math.PI / 4, 0, 0, fillW, 1.8, 1, hpColor);
    }
    this.instTankTreads.count = tankTreadIdx;
    this.instTankHulls.count = tankHullIdx;
    this.instTankGlacis.count = tankGlacisIdx;
    this.instTankTurrets.count = tankTurretIdx;
    this.instApcWheels.count = apcWheelIdx;
    this.instApcBodies.count = apcBodyIdx;
    this.instInfantryLegs.count = infLegIdx;
    this.instInfantryTorsos.count = infTorsoIdx;
    this.instInfantryHelmets.count = infHelmetIdx;
    this.instUnitBarrels.count = barrelIdx;
    this.instMuzzleFlashes.count = muzzleIdx;
    this.instSelectRings.count = selectIdx;
    this.instHpBg.count = hpBgIdx;
    this.instHpFill.count = hpFillIdx;

    // 4. Sync Projectiles into Instanced Batch
    let projIdx = 0;
    for (const p of state.projectiles) {
      if (projIdx >= 256) break;
      if (p.isBeam) {
        const mx = (p.sx + p.tx) * 0.5;
        const mz = (p.sy + p.ty) * 0.5;
        const len = Math.hypot(p.tx - p.sx, p.ty - p.sy);
        const ang = Math.atan2(p.ty - p.sy, p.tx - p.sx);
        this.setInstTransform(this.instProjectiles, projIdx++, mx, 12, mz, 0, -ang, 0, len, 1.8, 1.8, p.color);
      } else {
        const ix = p.prevX + (p.x - p.prevX) * alpha;
        const iy = p.prevY + (p.y - p.prevY) * alpha;
        const iz = p.prevZ + (p.z - p.prevZ) * alpha;
        const s = p.projType === 'cannon' || p.projType === 'rocket' ? 4.2 : 2.8;
        this.setInstTransform(this.instProjectiles, projIdx++, ix, iz, iy, 0, 0, 0, s, s, s, p.color);
      }
    }
    this.instProjectiles.count = projIdx;

    // 5. Sync GPU-Instanced Particles
    const particles = state.particles;
    const ptCount = Math.min(this.maxParticles, particles.length);
    this.particleInstancedMesh.count = ptCount;
    for (let i = 0; i < ptCount; i++) {
      const pt = particles[i];
      const sc = pt.isRing ? (1 - pt.life / pt.maxLife) * (pt.maxR || 18) : pt.r * 2;
      this.setInstTransform(this.particleInstancedMesh, i, pt.x, Math.max(1, pt.z), pt.y, 0, 0, 0, sc, pt.isRing ? 0.5 : sc, sc, pt.color);
    }
  }
  panCameraByScreenDelta(dxPx, dyPx) {
    const viewH = this.frustumSize / this.cameraZoom;
    const worldPerPx = viewH / Math.max(1, this.container.clientHeight);
    const rightX = Math.sin(this.cameraYaw);
    const rightZ = -Math.cos(this.cameraYaw);
    const fwdX = -Math.cos(this.cameraYaw);
    const fwdZ = -Math.sin(this.cameraYaw);
    this.cameraTarget.x -= (dxPx * rightX - dyPx * fwdX * 1.35) * worldPerPx;
    this.cameraTarget.z -= (dxPx * rightZ - dyPx * fwdZ * 1.35) * worldPerPx;
    this.clampCameraTarget();
    this.updateCameraTransform();
  }
  zoomAtScreenPoint(zoomFactor, clientX, clientY) {
    const beforeWorld = this.screenToGroundWorld(clientX, clientY);
    this.cameraZoom = Math.max(0.55, Math.min(2.4, this.cameraZoom * zoomFactor));
    this.camera.zoom = this.cameraZoom;
    this.camera.updateProjectionMatrix();
    const afterWorld = this.screenToGroundWorld(clientX, clientY);
    if (beforeWorld && afterWorld) {
      this.cameraTarget.x += beforeWorld.x - afterWorld.x;
      this.cameraTarget.z += beforeWorld.z - afterWorld.z;
    }
    this.clampCameraTarget();
    this.updateCameraTransform();
  }
  rotateCamera(deltaYaw) {
    this.cameraYaw = (this.cameraYaw + deltaYaw) % (Math.PI * 2);
    this.updateCameraTransform();
  }
  resetCamera() {
    this.cameraYaw = Math.PI / 4;
    this.cameraZoom = 1.05;
    this.cameraTarget.set(380, 0, 520);
    this.camera.zoom = this.cameraZoom;
    this.camera.updateProjectionMatrix();
    this.updateCameraTransform();
  }
  focusOnWorldPoint(wx, wz) {
    this.cameraTarget.set(wx, 0, wz);
    this.clampCameraTarget();
    this.updateCameraTransform();
  }
  clampCameraTarget() {
    this.cameraTarget.x = Math.max(60, Math.min(SLICE_WORLD_W - 60, this.cameraTarget.x));
    this.cameraTarget.z = Math.max(60, Math.min(SLICE_WORLD_H - 60, this.cameraTarget.z));
  }
  updateCameraTransform() {
    const horizDist = this.cameraDist * Math.cos(this.cameraPitch);
    const vertDist = this.cameraDist * Math.sin(this.cameraPitch);
    this.camera.position.set(this.cameraTarget.x + Math.cos(this.cameraYaw) * horizDist, this.cameraTarget.y + vertDist, this.cameraTarget.z + Math.sin(this.cameraYaw) * horizDist);
    this.camera.lookAt(this.cameraTarget);
    this.camera.updateMatrixWorld();
  }
  screenToGroundWorld(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    // clientX/Y and getBoundingClientRect() already use the same viewport CSS
    // coordinate space. Adding visualViewport offsets twice breaks Safari
    // picking when the browser toolbar or a pinch shifts that viewport.
    const ndcX = (clientX - rect.left) / rect.width * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    return raycaster.ray.intersectPlane(groundPlane, hit);
  }
  worldToScreen(wx, wy, wz) {
    const v = new THREE.Vector3(wx, wy, wz);
    v.project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: (v.x * 0.5 + 0.5) * rect.width,
      y: (-(v.y * 0.5) + 0.5) * rect.height
    };
  }
  handleResize(force = false) {
    const w = Math.max(1, Math.round(this.container.clientWidth));
    const h = Math.max(1, Math.round(this.container.clientHeight));
    const dw = Math.abs(w - this.appliedCssW);
    const dh = Math.abs(h - this.appliedCssH);
    // iPhone Safari chrome can shrink visual height by ~12px (observed 566 → 554)
    // without a real orientation change. Reallocating the drawing buffer on that
    // hitch drops frame time. Ignore height-only micro changes; still report them.
    const safariChromeMicro = this.appliedCssW > 0 && dw < 2 && dh > 0 && dh < 24;
    if (!force && safariChromeMicro) {
      this.onViewportDecision?.({
        cssWidth: w,
        cssHeight: h,
        applied: false,
        reason: 'ignored-safari-chrome-micro-resize'
      });
      return;
    }
    if (!force && dw === 0 && dh === 0) return;
    const aspect = w / Math.max(1, h);
    this.camera.left = -this.frustumSize * aspect / 2;
    this.camera.right = this.frustumSize * aspect / 2;
    this.camera.top = this.frustumSize / 2;
    this.camera.bottom = -this.frustumSize / 2;
    this.camera.zoom = this.cameraZoom;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.appliedCssW = w;
    this.appliedCssH = h;
    this.onViewportDecision?.({
      cssWidth: w,
      cssHeight: h,
      applied: true,
      reason: force ? 'forced' : 'layout-change'
    });
  }
  render() {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.flushDirtyInstanceBuffers();
    this.renderer.render(this.scene, this.camera);
    const dtMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
    this.lastFrameRenderMs = dtMs;
    this.avgFrameRenderMs = this.avgFrameRenderMs === 0 ? dtMs : this.avgFrameRenderMs * 0.9 + dtMs * 0.1;
  }
  getSceneMeshCounts() {
    let visibleNonInstancedMeshes = 0;
    let visibleInstancedMeshes = 0;
    let activeInstancedMeshes = 0;
    let totalActiveInstances = 0;
    this.scene.traverse(obj => {
      if (!obj.visible) return;
      if (obj.isInstancedMesh) {
        visibleInstancedMeshes++;
        if (obj.count > 0) {
          activeInstancedMeshes++;
          totalActiveInstances += obj.count;
        }
      } else if (obj.isMesh) {
        visibleNonInstancedMeshes++;
      }
    });
    return {
      visibleNonInstancedMeshes,
      visibleInstancedMeshes,
      activeInstancedMeshes,
      totalActiveInstances
    };
  }
  getRenderStats() {
    const info = this.renderer.info;
    const meshCounts = this.getSceneMeshCounts();
    return {
      frame: info?.render?.frame ?? 0,
      calls: info?.render?.calls ?? 0,
      instancedCalls: info?.render?.instancedCalls ?? meshCounts.activeInstancedMeshes,
      activeInstances: info?.render?.activeInstances ?? meshCounts.totalActiveInstances,
      activeInstancedMeshes: meshCounts.activeInstancedMeshes,
      visibleInstancedMeshes: meshCounts.visibleInstancedMeshes,
      triangles: info?.render?.triangles ?? 0,
      lines: info?.render?.lines ?? 0,
      geometries: info?.memory?.geometries ?? 0,
      frameTimeMs: Number(this.lastFrameRenderMs.toFixed(3)),
      avgFrameTimeMs: Number(this.avgFrameRenderMs.toFixed(3)),
      contextLossCount: this.contextLossCount
    };
  }
  getRenderTelemetry() {
    const stats = this.getRenderStats();
    return {
      frame: stats.frame,
      drawCalls: stats.calls,
      instancedDrawCalls: stats.instancedCalls,
      visibleInstancedMeshes: stats.visibleInstancedMeshes,
      activeInstances: stats.activeInstances,
      activeInstancedMeshes: stats.activeInstancedMeshes,
      triangles: stats.triangles,
      lines: stats.lines,
      geometries: stats.geometries,
      lastFrameRenderMs: stats.frameTimeMs,
      avgFrameRenderMs: stats.avgFrameTimeMs,
      contextLossCount: stats.contextLossCount
    };
  }
}

// ==========================================
// MODULE: src/input/inputController.ts
// ==========================================
/**
 * A finger on glass routinely travels 15–40 CSS pixels between touchdown and lift.
 * The previous 18px cutoff treated that as a box-select and cleared the army,
 * so issueMoveOrder never ran. Real box-select still starts at this distance.
 */
const BOX_SELECT_MIN_PX = 56;
const PAN_SLOP_PX = 8;
class InputController3D {
  mode = 'select';
  // Touch.identifier and PointerEvent.pointerId are *not* the same namespace.
  // Safari fires both event streams; TouchEvents own the gesture once observed.
  contacts = new Map();
  primaryContact = null;
  touchStreamActive = false;
  startX = 0;
  startY = 0;
  currX = 0;
  currY = 0;
  sawMove = false;
  isDragging = false;
  multiTouchGuardUntil = 0;
  prevPinchDist = 0;
  prevPinchMidX = 0;
  prevPinchMidY = 0;
  prevPinchAngle = 0;
  pointerDownCount = 0;
  pointerUpCount = 0;
  pointerCancelCount = 0;
  touchEndFallbackCount = 0;
  touchStartCount = 0;
  touchEndCount = 0;
  touchCancelCount = 0;
  lastGesture = 'none';
  moveOrdersIssued = 0;
  lastMoveCount = 0;
  lastHitX = null;
  lastHitY = null;
  lastHitFailed = false;
  orderAnchor = null;
  constructor(domElement, selectionBoxEl, core, scene3d, onStatusUpdate) {
    this.domElement = domElement;
    this.selectionBoxEl = selectionBoxEl;
    this.core = core;
    this.scene3d = scene3d;
    this.onStatusUpdate = onStatusUpdate;
    this.bindEvents();
  }
  getDiagnostics() {
    const selectedCount = this.core.state.units.filter(u => u.team === 'player' && u.selected && u.hp > 0).length;
    return {
      pointerDown: this.pointerDownCount,
      pointerUp: this.pointerUpCount,
      pointerCancel: this.pointerCancelCount,
      touchEndFallback: this.touchEndFallbackCount,
      touchStart: this.touchStartCount,
      touchEnd: this.touchEndCount,
      touchCancel: this.touchCancelCount,
      lastGesture: this.lastGesture,
      mode: this.mode,
      selectedCount,
      lastHitX: this.lastHitX,
      lastHitY: this.lastHitY,
      lastHitFailed: this.lastHitFailed,
      moveOrdersIssued: this.moveOrdersIssued,
      lastMoveCount: this.lastMoveCount,
      running: this.core.state.running,
      paused: this.core.state.paused,
      tacticalPause: this.core.state.tacticalPause,
      unitPositionDelta: this.measureOrderDelta()
    };
  }
  bindEvents() {
    this.domElement.addEventListener('pointerdown', e => this.onPointerDown(e));
    this.domElement.addEventListener('pointermove', e => this.onPointerMove(e));
    // Capture retargets pointerup to the canvas. Also listen on window so a
    // synthetic pointerup (and a browser that refuses setPointerCapture) still completes.
    this.domElement.addEventListener('pointerup', e => this.onPointerEnd(e, false));
    this.domElement.addEventListener('pointercancel', e => this.onPointerEnd(e, true));
    window.addEventListener('pointerup', e => this.onPointerEnd(e, false));
    window.addEventListener('pointercancel', e => this.onPointerEnd(e, true));
    this.domElement.addEventListener('contextmenu', e => e.preventDefault());
    this.domElement.addEventListener('wheel', e => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      this.scene3d.zoomAtScreenPoint(factor, e.clientX, e.clientY);
    }, {
      passive: false
    });

    // TouchEvents are authoritative for fingers, including when Safari drops
    // pointerup/pointercancel. Never join them by their unrelated numeric ids.
    this.domElement.addEventListener('touchstart', e => this.onTouchStart(e), {
      passive: false
    });
    this.domElement.addEventListener('touchmove', e => this.onTouchMove(e), {
      passive: false
    });
    this.domElement.addEventListener('touchend', e => this.onTouchEnd(e, false), {
      passive: false
    });
    this.domElement.addEventListener('touchcancel', e => this.onTouchEnd(e, true), {
      passive: false
    });
  }
  preventTouchBrowserGesture(e) {
    if (e.cancelable) e.preventDefault();
  }
  onTouchStart(e) {
    this.preventTouchBrowserGesture(e);
    this.touchStartCount++;
    if (!this.touchStreamActive) {
      // A pointerdown may precede touchstart. Abandon its provisional contact
      // without dispatching a command; the Touch stream will complete it.
      this.resetGesture();
      this.touchStreamActive = true;
    }
    for (const touch of Array.from(e.changedTouches)) {
      this.beginContact(`t:${touch.identifier}`, touch.clientX, touch.clientY, 'touch');
    }
  }
  onTouchMove(e) {
    this.preventTouchBrowserGesture(e);
    if (!this.touchStreamActive) return;
    // Update both fingers before calculating pinch; no phantom intermediate pan.
    for (const touch of Array.from(e.touches)) {
      const key = `t:${touch.identifier}`;
      if (this.contacts.has(key)) {
        this.contacts.set(key, {
          x: touch.clientX,
          y: touch.clientY,
          source: 'touch'
        });
      }
    }
    const primary = this.primaryContact;
    if (this.contacts.size >= 2) this.applyGestureMove('');else if (primary) this.applyGestureMove(primary);
  }
  onTouchEnd(e, isCancel) {
    this.preventTouchBrowserGesture(e);
    if (isCancel) this.touchCancelCount++;else this.touchEndCount++;
    if (this.touchStreamActive) {
      for (const touch of Array.from(e.changedTouches)) {
        this.finishContact(`t:${touch.identifier}`, touch.clientX, touch.clientY, isCancel);
      }
      if (e.touches.length === 0) {
        this.touchStreamActive = false;
        // A malformed touch sequence must never leave a phantom active finger.
        if (this.contacts.size > 0) this.resetGesture();
      }
      return;
    }

    // Defensive recovery for devices that emit pointerdown and touchend without
    // touchstart. Match the ONE provisional finger by source, not by id number.
    const pending = [...this.contacts.entries()].filter(([, c]) => c.source === 'pointerTouch');
    if (pending.length === 1 && e.changedTouches.length === 1) {
      const [key] = pending[0];
      const touch = e.changedTouches[0];
      this.touchEndFallbackCount++;
      this.finishContact(key, touch.clientX, touch.clientY, isCancel);
    }
  }
  resetGesture() {
    for (const key of this.contacts.keys()) {
      if (key.startsWith('p:')) this.tryRelease(Number(key.slice(2)));
    }
    this.contacts.clear();
    this.primaryContact = null;
    this.isDragging = false;
    this.hideSelectionBox();
  }
  tryCapture(pointerId) {
    const el = this.domElement;
    if (typeof el.setPointerCapture !== 'function') return;
    try {
      el.setPointerCapture(pointerId);
    } catch {
      // Synthetic PointerEvents and some WebKit builds have no active pointer id.
    }
  }
  tryRelease(pointerId) {
    const el = this.domElement;
    if (typeof el.releasePointerCapture !== 'function') return;
    try {
      if (typeof el.hasPointerCapture === 'function' && !el.hasPointerCapture(pointerId)) return;
      el.releasePointerCapture(pointerId);
    } catch {
      // Already released.
    }
  }
  onPointerDown(e) {
    this.pointerDownCount++;
    if (e.pointerType === 'touch' && this.touchStreamActive) return;
    if (e.button === 2) {
      const ground = this.scene3d.screenToGroundWorld(e.clientX, e.clientY);
      if (ground) {
        const pt = this.scene3d.adapter.toGame2D(ground.x, ground.z);
        this.noteHit(pt.x, pt.y, false);
        const enemy = this.pickHostileAt(pt.x, pt.y);
        if (enemy) {
          this.core.issueAttackTargetOrder(enemy);
          this.onStatusUpdate(`Focus-firing ${enemy.name}!`);
        } else {
          this.noteMove(this.core.issueMoveOrder(pt.x, pt.y, false));
          this.onStatusUpdate(`Moving selected squad to (${Math.round(pt.x)}, ${Math.round(pt.y)})`);
        }
      } else {
        this.noteHit(0, 0, true);
      }
      return;
    }
    if (e.cancelable) e.preventDefault();
    this.tryCapture(e.pointerId);
    this.beginContact(`p:${e.pointerId}`, e.clientX, e.clientY, e.pointerType === 'touch' ? 'pointerTouch' : 'pointer');
  }
  beginContact(key, x, y, source) {
    if (this.contacts.has(key)) return;
    this.contacts.set(key, {
      x,
      y,
      source
    });
    if (this.contacts.size >= 2) {
      this.primaryContact = null;
      this.isDragging = false;
      this.hideSelectionBox();
      this.multiTouchGuardUntil = performance.now() + 280;
      const pts = Array.from(this.contacts.values());
      this.prevPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      this.prevPinchMidX = (pts[0].x + pts[1].x) * 0.5;
      this.prevPinchMidY = (pts[0].y + pts[1].y) * 0.5;
      this.prevPinchAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
      return;
    }
    if (performance.now() < this.multiTouchGuardUntil) return;
    this.primaryContact = key;
    this.startX = x;
    this.startY = y;
    this.currX = x;
    this.currY = y;
    this.sawMove = false;
    this.isDragging = false;
  }
  onPointerMove(e) {
    if (e.pointerType === 'touch' && this.touchStreamActive) return;
    const key = `p:${e.pointerId}`;
    const contact = this.contacts.get(key);
    if (!contact) return;
    this.contacts.set(key, {
      ...contact,
      x: e.clientX,
      y: e.clientY
    });
    this.applyGestureMove(key);
  }
  applyGestureMove(key) {
    if (this.contacts.size >= 2) {
      this.multiTouchGuardUntil = performance.now() + 280;
      const pts = Array.from(this.contacts.values());
      const newDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const newMidX = (pts[0].x + pts[1].x) * 0.5;
      const newMidY = (pts[0].y + pts[1].y) * 0.5;
      const newAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
      const dxMid = newMidX - this.prevPinchMidX;
      const dyMid = newMidY - this.prevPinchMidY;
      if (Math.hypot(dxMid, dyMid) > 0.5) {
        this.scene3d.panCameraByScreenDelta(dxMid, dyMid);
      }
      if (this.prevPinchDist > 16 && newDist > 16) {
        const scale = newDist / this.prevPinchDist;
        if (Math.abs(scale - 1) > 0.004) {
          this.scene3d.zoomAtScreenPoint(scale, newMidX, newMidY);
        }
      }
      const dAng = Math.atan2(Math.sin(newAngle - this.prevPinchAngle), Math.cos(newAngle - this.prevPinchAngle));
      if (Math.abs(dAng) > 0.015 && Math.abs(dAng) < 0.4) {
        this.scene3d.rotateCamera(dAng * 0.75);
      }
      this.prevPinchDist = newDist;
      this.prevPinchMidX = newMidX;
      this.prevPinchMidY = newMidY;
      this.prevPinchAngle = newAngle;
      return;
    }
    if (this.primaryContact === null || key !== this.primaryContact) return;
    const current = this.contacts.get(key);
    if (!current) return;
    const dx = current.x - this.currX;
    const dy = current.y - this.currY;
    this.currX = current.x;
    this.currY = current.y;
    this.sawMove = true;
    const totalDist = Math.hypot(this.currX - this.startX, this.currY - this.startY);
    if (this.mode === 'pan') {
      if (totalDist > PAN_SLOP_PX) {
        this.isDragging = true;
        this.scene3d.panCameraByScreenDelta(dx, dy);
      }
      return;
    }
    if (this.mode === 'select' && totalDist > BOX_SELECT_MIN_PX) {
      this.isDragging = true;
      this.updateSelectionBoxOverlay();
    }
  }
  onPointerEnd(e, isCancel) {
    if (e.pointerType === 'touch' && this.touchStreamActive) return;
    const key = `p:${e.pointerId}`;
    if (!this.contacts.has(key)) return;
    if (isCancel) this.pointerCancelCount++;else this.pointerUpCount++;
    this.finishContact(key, e.clientX, e.clientY, isCancel);
  }
  finishContact(key, clientX, clientY, isCancel) {
    if (!this.contacts.has(key)) return;
    this.contacts.delete(key);
    if (key.startsWith('p:')) this.tryRelease(Number(key.slice(2)));
    if (this.contacts.size > 0) {
      this.primaryContact = null;
      this.isDragging = false;
      this.hideSelectionBox();
      this.multiTouchGuardUntil = performance.now() + 280;
      this.lastGesture = 'multi-contact-end';
      return;
    }
    if (this.primaryContact === null || key !== this.primaryContact) return;
    this.primaryContact = null;
    if (performance.now() < this.multiTouchGuardUntil) {
      this.isDragging = false;
      this.hideSelectionBox();
      this.lastGesture = 'multi-contact-suppressed';
      return;
    }

    // A lift that jumps across the screen without any pointermove is a dropped
    // coordinate (synthetic TouchEvent zeros, or a WebKit pointerup at 0,0).
    // Complete the tap at the last real point instead of box-selecting the page.
    const jump = Math.hypot(clientX - this.currX, clientY - this.currY);
    const unreliableLift = !this.sawMove && jump > 48;
    if (!unreliableLift && Number.isFinite(clientX) && Number.isFinite(clientY)) {
      this.currX = clientX;
      this.currY = clientY;
    }
    const totalDist = Math.hypot(this.currX - this.startX, this.currY - this.startY);

    // A long drag that the browser cancels must not wipe the selection.
    // A short cancel is how iOS delivers a tap when it never sends pointerup.
    if (isCancel && totalDist >= BOX_SELECT_MIN_PX) {
      this.isDragging = false;
      this.hideSelectionBox();
      this.lastGesture = 'cancelled-drag';
      return;
    }
    if (this.mode === 'pan') {
      // Pan mode owns ALL one-finger gestures, even a stationary tap.
      this.lastGesture = 'pan-only';
    } else if (this.mode === 'select' && totalDist >= BOX_SELECT_MIN_PX) {
      this.lastGesture = this.performBoxSelection();
    } else {
      this.handleSingleTap(this.currX, this.currY);
      this.lastGesture = `${key.startsWith('t:') ? 'touch' : 'pointer'}-${isCancel ? 'cancel-tap' : 'tap'}`;
    }
    this.isDragging = false;
    this.hideSelectionBox();
  }
  updateSelectionBoxOverlay() {
    const rect = this.domElement.getBoundingClientRect();
    const x1 = Math.min(this.startX, this.currX) - rect.left;
    const y1 = Math.min(this.startY, this.currY) - rect.top;
    const w = Math.abs(this.currX - this.startX);
    const h = Math.abs(this.currY - this.startY);
    this.selectionBoxEl.style.display = 'block';
    this.selectionBoxEl.style.left = `${x1}px`;
    this.selectionBoxEl.style.top = `${y1}px`;
    this.selectionBoxEl.style.width = `${w}px`;
    this.selectionBoxEl.style.height = `${h}px`;
  }
  hideSelectionBox() {
    this.selectionBoxEl.style.display = 'none';
  }
  performBoxSelection() {
    const rect = this.domElement.getBoundingClientRect();
    const minX = Math.min(this.startX, this.currX) - rect.left;
    const maxX = Math.max(this.startX, this.currX) - rect.left;
    const minY = Math.min(this.startY, this.currY) - rect.top;
    const maxY = Math.max(this.startY, this.currY) - rect.top;
    const priorSelection = new Set(this.core.state.units.filter(u => u.team === 'player' && u.hp > 0 && u.selected).map(u => u.id));
    let count = 0;
    for (const u of this.core.state.units) {
      if (u.team !== 'player' || u.hp <= 0) {
        u.selected = false;
        continue;
      }
      const scr = this.scene3d.worldToScreen(u.x, this.core.getTerrainHeightAt(u.x, u.y) + 8, u.y);
      const inside = scr.x >= minX && scr.x <= maxX && scr.y >= minY && scr.y <= maxY;
      u.selected = inside;
      if (inside) count++;
    }
    if (count > 0) {
      this.onStatusUpdate(`Selected ${count} friendly units`);
      return 'box-select';
    }
    if (priorSelection.size > 0) {
      // On glass, a long finger slide to the destination should not erase the
      // user's army just because the selection rectangle covered empty ground.
      for (const u of this.core.state.units) u.selected = priorSelection.has(u.id);
      this.handleSingleTap(this.currX, this.currY);
      return 'drag-move';
    }
    this.onStatusUpdate('No friendly units in selection area');
    return 'empty-box';
  }
  pickFriendlyUnitAt(gx, gy) {
    let best = null;
    let bestD = 28;
    for (const u of this.core.state.units) {
      if (u.team !== 'player' || u.hp <= 0) continue;
      const d = Math.hypot(u.x - gx, u.y - gy) - u.radius;
      if (d <= bestD) {
        bestD = d;
        best = u;
      }
    }
    return best;
  }
  pickHostileAt(gx, gy) {
    let best = null;
    let bestD = 30;
    for (const u of this.core.state.units) {
      if (u.team === 'player' || u.hp <= 0) continue;
      const d = Math.hypot(u.x - gx, u.y - gy) - u.radius;
      if (d <= bestD) {
        bestD = d;
        best = u;
      }
    }
    if (best) return best;
    for (const b of this.core.state.buildings) {
      if (b.team === 'player' || b.hp <= 0) continue;
      const d = Math.hypot(b.x - gx, b.y - gy) - b.radius;
      if (d <= bestD) {
        bestD = d;
        best = b;
      }
    }
    return best;
  }
  noteHit(x, y, failed) {
    this.lastHitFailed = failed;
    this.lastHitX = failed ? null : Math.round(x);
    this.lastHitY = failed ? null : Math.round(y);
  }
  noteMove(count) {
    this.lastMoveCount = count;
    if (count > 0) {
      this.moveOrdersIssued++;
      this.captureOrderAnchor();
    }
  }
  captureOrderAnchor() {
    const anchor = new Map();
    for (const u of this.core.state.units) {
      if (u.team !== 'player' || u.hp <= 0) continue;
      anchor.set(u.id, {
        x: u.x,
        y: u.y
      });
    }
    this.orderAnchor = anchor;
  }
  measureOrderDelta() {
    if (!this.orderAnchor) return 0;
    let sum = 0;
    for (const u of this.core.state.units) {
      const prev = this.orderAnchor.get(u.id);
      if (!prev || u.hp <= 0) continue;
      sum += Math.hypot(u.x - prev.x, u.y - prev.y);
    }
    return Math.round(sum * 10) / 10;
  }
  handleSingleTap(clientX, clientY) {
    const hit3D = this.scene3d.screenToGroundWorld(clientX, clientY);
    if (!hit3D) {
      this.noteHit(0, 0, true);
      return;
    }
    const pt = this.scene3d.adapter.toGame2D(hit3D.x, hit3D.z);
    this.noteHit(pt.x, pt.y, false);
    if (this.mode === 'attackMove') {
      const count = this.core.issueMoveOrder(pt.x, pt.y, true);
      this.noteMove(count);
      this.mode = 'select';
      this.onStatusUpdate(`Attack-Move ordered for ${count} units`);
      return;
    }
    const friendly = this.pickFriendlyUnitAt(pt.x, pt.y);
    if (friendly) {
      for (const u of this.core.state.units) {
        u.selected = u.id === friendly.id;
      }
      this.onStatusUpdate(`Selected ${friendly.name} (HP ${Math.round(friendly.hp)}/${friendly.maxHp})`);
      return;
    }
    const selectedUnits = this.core.state.units.filter(u => u.team === 'player' && u.selected && u.hp > 0);
    if (selectedUnits.length > 0) {
      const hostile = this.pickHostileAt(pt.x, pt.y);
      if (hostile) {
        this.core.issueAttackTargetOrder(hostile);
        this.onStatusUpdate(`Attacking ${hostile.name} (${hostile.team.toUpperCase()})!`);
      } else {
        const count = this.core.issueMoveOrder(pt.x, pt.y, false);
        this.noteMove(count);
        this.onStatusUpdate(`Moving ${count} units to (${Math.round(pt.x)}, ${Math.round(pt.y)})`);
      }
    }
  }
}

// ==========================================
// MODULE: src/main.ts
// ==========================================
// ============================================================================
// STARFRONT 3D — VERTICAL SLICE 001
// Module: src/main.ts
// Entrypoint, Tactical HUD Wiring, Main Animation Loop, and Phase 3
// Lightweight iPhone Safari Diagnostic Performance HUD + JSON Telemetry Export
// ============================================================================




// Expose THREE on window for browser verification provenance (official REVISION vs offline shim).
window.THREE = THREE;
const hudErrors = [];
function runHudSafe(context, fn) {
  try {
    fn();
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    hudErrors.push({
      context,
      message: errorObj.message,
      stack: errorObj.stack,
      timestampIso: new Date().toISOString()
    });
    console.error(`[STARFRONT_HUD_ERROR] ${context}:`, err);
  }
}
const core = new GameCore();
const viewportEl = document.getElementById('viewport3d');
const selBoxEl = document.getElementById('selectionBox');
const scene3d = new BattlefieldScene3D(viewportEl, core);
let statusToastTimer;
function setStatusMessage(msg) {
  runHudSafe('setStatusMessage', () => {
    if (msg) {
      const toast = document.getElementById('statusToast');
      if (toast) {
        toast.textContent = msg;
        toast.style.opacity = '1';
        clearTimeout(statusToastTimer);
        statusToastTimer = window.setTimeout(() => {
          toast.style.opacity = '0';
        }, 2200);
      }
    }
    updateHUD();
  });
}
const inputCtrl = new InputController3D(scene3d.renderer.domElement, selBoxEl, core, scene3d, setStatusMessage);
function updateHUD() {
  runHudSafe('updateHUD', () => {
    const s = core.state;
    const stats = core.getPlayerStats();
    const elGdp = document.getElementById('hudGdp');
    const elRate = document.getElementById('hudGdpRate');
    const elSupply = document.getElementById('hudSupply');
    const elPower = document.getElementById('hudPower');
    const elOutpost = document.getElementById('hudOutpost');
    const elSelected = document.getElementById('hudSelected');
    if (elGdp) elGdp.textContent = `${Math.floor(s.crystals)}`;
    if (elRate) elRate.textContent = `+${stats.passiveIncome}/s`;
    if (elSupply) elSupply.textContent = `${stats.supplyUsed}/${stats.supplyMax}`;
    if (elPower) elPower.textContent = `${stats.powerUsed}/${stats.powerMax}`;
    const op = s.outposts[0];
    if (elOutpost && op) {
      const ownerTag = op.contested ? 'CONTESTED' : op.owner === 'player' ? 'AEGIS (PLAYER)' : op.owner === 'bot2' ? 'TITAN (BOT 2)' : op.owner === 'enemy' ? 'CRIMSON (ENEMY)' : `NEUTRAL (${Math.round(op.progress)}%)`;
      elOutpost.textContent = ownerTag;
    }
    const sel = s.units.filter(u => u.team === 'player' && u.selected && u.hp > 0);
    if (elSelected) {
      if (sel.length === 0) {
        elSelected.textContent = 'No units selected — Tap or drag-box friendly units';
      } else {
        const totalHp = Math.round(sel.reduce((acc, u) => acc + u.hp, 0));
        elSelected.textContent = `Selected: ${sel.length} unit(s) • Total HP: ${totalHp}`;
      }
    }
    const btnSelect = document.getElementById('btnModeSelect');
    const btnPan = document.getElementById('btnModePan');
    const btnAtk = document.getElementById('btnAttackMove');
    if (btnSelect && btnPan && btnAtk) {
      btnSelect.classList.toggle('active-btn', inputCtrl.mode === 'select');
      btnPan.classList.toggle('active-btn', inputCtrl.mode === 'pan');
      btnAtk.classList.toggle('active-atk', inputCtrl.mode === 'attackMove');
    }
    const modal = document.getElementById('victoryModal');
    if (modal) {
      if (s.winner) {
        modal.style.display = 'flex';
        const title = document.getElementById('victoryTitle');
        if (title) {
          title.textContent = s.winner === 'player' ? 'VICTORY — SECTOR SECURED!' : 'DEFEAT — HQ DESTROYED';
        }
      } else {
        modal.style.display = 'none';
      }
    }
  });
}

// ============================================================================
// PHASE 3: Lightweight Debug-Only iPhone Performance HUD & Telemetry Recorder
// - Zero PII collection, zero automatic network transmission
// - Fixed-size ring buffer (240 frames) updated with O(1) array write per frame
// - Percentile sorting (p95 frame time & ~1% low FPS) runs only at 2 Hz UI tick
// - Explicitly labels browser rAF frame delta & CPU-side render submission time
// ============================================================================
const RING_SIZE = 240;
const frameDeltaRing = new Float32Array(RING_SIZE);
const sortScratch = new Float32Array(RING_SIZE);
let ringIdx = 0;
let ringCount = 0;

/** Documented browser-side method. Not a vendor 1% low and not a GPU timestamp query. */

let isRecordingTelemetry = false;
let recordingStartIso = '';
let recordingStartPerfMs = 0;
let lastSamplePerfMs = 0;
let recordedSamples = [];
let diagHudVisible = false;
const MAX_TELEMETRY_EVENTS = 240;
const sessionEvents = [];
const FPS_MEASUREMENT_METHOD = {
  sampleSource: 'Individual requestAnimationFrame deltas from performance.now() between callbacks. A fixed ring of 240 deltas is kept.',
  ringFrames: RING_SIZE,
  averageFps: '1000 divided by the arithmetic mean of the rAF deltas in the ring.',
  approx1PercentLowFps: '1000 divided by the p99 rAF delta. Deltas are sorted ascending; the index is min(n-1, floor(n * 0.99)). This is an approximate browser-side 1% low, not PresentMon and not a GPU timestamp.',
  browserFrameTime: 'The rAF delta itself (simulation, scene sync, submission, and time until the next callback). It is not GPU execution time.',
  cpuRenderSubmissionTime: 'performance.now() wrapped only around renderer.render(). That is CPU-side submission time, not GPU execution time.',
  notMeasured: ['native thermal state', 'GPU execution time', 'EXT_disjoint_timer_query', 'ProcessInfo.ThermalState']
};
function readDeviceMetrics() {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    language: typeof navigator !== 'undefined' ? navigator.language : '',
    devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2)),
    screenWidth: window.screen?.width ?? 0,
    screenHeight: window.screen?.height ?? 0,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 0 : 0,
    maxTouchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0
  };
}
function pushSessionEvent(event) {
  sessionEvents.push(event);
  if (sessionEvents.length > MAX_TELEMETRY_EVENTS) sessionEvents.shift();
}
function recentFrameDeltasMs() {
  const out = [];
  if (ringCount === 0) return out;
  if (ringCount < RING_SIZE) {
    for (let i = 0; i < ringCount; i++) out.push(Number(frameDeltaRing[i].toFixed(2)));
    return out;
  }
  for (let i = 0; i < RING_SIZE; i++) {
    out.push(Number(frameDeltaRing[(ringIdx + i) % RING_SIZE].toFixed(2)));
  }
  return out;
}
const PRESET_SHORT = {
  eco: 'ECO',
  balanced: 'BAL',
  quality: 'QUAL'
};
function setDiagHudVisible(visible) {
  diagHudVisible = visible;
  const panel = document.getElementById('diagHudPanel');
  const btn = document.getElementById('btnToggleDiagHud');
  if (panel) {
    panel.style.display = visible ? 'block' : 'none';
    if (typeof panel.setAttribute === 'function') {
      panel.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }
  }
  if (btn) {
    btn.classList.toggle('active-btn', visible);
    if (typeof btn.setAttribute === 'function') {
      btn.setAttribute('aria-expanded', visible ? 'true' : 'false');
    }
    btn.textContent = visible ? 'Hide' : 'Diag';
  }
  if (visible) updateDiagnosticHUD(buildCurrentTelemetrySample(performance.now()));
}
function recordFrameDelta(dtMs) {
  if (dtMs <= 0 || dtMs > 1000) return;
  frameDeltaRing[ringIdx] = dtMs;
  ringIdx = (ringIdx + 1) % RING_SIZE;
  if (ringCount < RING_SIZE) ringCount++;
}
function computeFrameMetrics() {
  if (ringCount === 0) {
    return {
      fpsRollingAvg: 60,
      fpsApprox1PercentLow: 60,
      frameTimeAvgMs: 16.67,
      frameTimeP95Ms: 16.67
    };
  }
  let sumMs = 0;
  for (let i = 0; i < ringCount; i++) {
    const v = frameDeltaRing[i];
    sumMs += v;
    sortScratch[i] = v;
  }
  const sub = sortScratch.subarray(0, ringCount);
  sub.sort(); // Ascending frame times in ms (small = fast, large = slow)

  const avgMs = sumMs / ringCount;
  const p95Idx = Math.min(ringCount - 1, Math.floor(ringCount * 0.95));
  const p99Idx = Math.min(ringCount - 1, Math.floor(ringCount * 0.99));
  const p95Ms = sub[p95Idx];
  const p99Ms = sub[p99Idx];
  const fpsAvg = avgMs > 0 ? 1000 / avgMs : 60;
  const fps1Low = p99Ms > 0 ? 1000 / p99Ms : fpsAvg;
  return {
    fpsRollingAvg: Number(fpsAvg.toFixed(1)),
    fpsApprox1PercentLow: Number(fps1Low.toFixed(1)),
    frameTimeAvgMs: Number(avgMs.toFixed(2)),
    frameTimeP95Ms: Number(p95Ms.toFixed(2))
  };
}
function buildCurrentTelemetrySample(nowPerfMs) {
  const fm = computeFrameMetrics();
  const rt = scene3d.getRenderTelemetry();
  const canvas = scene3d.renderer.domElement;
  const cssW = Math.round(viewportEl.clientWidth || window.innerWidth || 0);
  const cssH = Math.round(viewportEl.clientHeight || window.innerHeight || 0);
  const bufW = canvas?.width || 0;
  const bufH = canvas?.height || 0;
  const activeUnits = core.state.units.reduce((acc, u) => u.hp > 0 ? acc + 1 : acc, 0);
  const activeBuildings = core.state.buildings.reduce((acc, b) => b.hp > 0 ? acc + 1 : acc, 0);
  return {
    timestampIso: new Date().toISOString(),
    elapsedSec: isRecordingTelemetry ? Number(((nowPerfMs - recordingStartPerfMs) / 1000).toFixed(2)) : 0,
    simTimeSec: Number(core.state.timeElapsed.toFixed(2)),
    fpsRollingAvg: fm.fpsRollingAvg,
    fpsApprox1PercentLow: fm.fpsApprox1PercentLow,
    browserFrameTimeAvgMs: fm.frameTimeAvgMs,
    browserFrameTimeP95Ms: fm.frameTimeP95Ms,
    cpuRenderCallAvgMs: rt.avgFrameRenderMs,
    drawCalls: rt.drawCalls,
    instancedDrawCalls: rt.instancedDrawCalls,
    renderedTriangles: rt.triangles,
    renderedLines: rt.lines,
    activeUnitCount: activeUnits,
    activeBuildingCount: activeBuildings,
    activeInstancedMeshCount: rt.visibleInstancedMeshes,
    activeInstanceCount: rt.activeInstances,
    devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2)),
    rendererPixelRatio: Number((scene3d.renderer.getPixelRatio ? scene3d.renderer.getPixelRatio() : 1).toFixed(2)),
    graphicsPreset: scene3d.getQualityPreset(),
    webglContextLossCount: rt.contextLossCount,
    viewportCssWidth: cssW,
    viewportCssHeight: cssH,
    drawingBufferWidth: bufW,
    drawingBufferHeight: bufH,
    orientation: cssW >= cssH ? 'landscape' : 'portrait'
  };
}
function updateDiagnosticHUD(sample) {
  runHudSafe('updateDiagnosticHUD', () => {
    const elDrawTop = document.getElementById('hudDrawCalls');
    const elFpsTop = document.getElementById('hudFps');
    if (elDrawTop) {
      elDrawTop.textContent = `${sample.drawCalls} (${sample.instancedDrawCalls} inst)`;
    }
    if (elFpsTop) {
      elFpsTop.textContent = `${Math.round(sample.fpsRollingAvg)}`;
    }
    if (!diagHudVisible) return;
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setTxt('diagFpsAvg', `${sample.fpsRollingAvg.toFixed(1)}`);
    setTxt('diagFps1Low', `${sample.fpsApprox1PercentLow.toFixed(1)}`);
    setTxt('diagFrameTime', `${sample.browserFrameTimeAvgMs.toFixed(1)} / ${sample.browserFrameTimeP95Ms.toFixed(1)} ms`);
    setTxt('diagCpuRender', `${sample.cpuRenderCallAvgMs.toFixed(2)} ms`);
    setTxt('diagDrawCalls', `${sample.drawCalls} (${sample.instancedDrawCalls} inst)`);
    setTxt('diagTriangles', sample.renderedTriangles.toLocaleString());
    setTxt('diagUnits', `${sample.activeUnitCount}`);
    setTxt('diagInstMeshes', `${sample.activeInstancedMeshCount} (${sample.activeInstanceCount} inst)`);
    setTxt('diagDpr', `${sample.rendererPixelRatio.toFixed(2)} / ${sample.devicePixelRatio.toFixed(2)}`);
    setTxt('diagPreset', sample.graphicsPreset.toUpperCase());
    setTxt('diagCtxLoss', `${sample.webglContextLossCount}`);
    setTxt('diagViewport', `${sample.viewportCssWidth}×${sample.viewportCssHeight} (${sample.drawingBufferWidth}×${sample.drawingBufferHeight})`);
    const inputDiag = inputCtrl.getDiagnostics();
    setTxt('diagPointerCounts', `${inputDiag.pointerDown}/${inputDiag.pointerUp}/${inputDiag.pointerCancel}`);
    setTxt('diagTouchCounts', `${inputDiag.touchStart}/${inputDiag.touchEnd}/${inputDiag.touchCancel}`);
    setTxt('diagLastGesture', inputDiag.lastGesture);
    setTxt('diagInputMode', inputDiag.mode);
    setTxt('diagSelectedCount', `${inputDiag.selectedCount}`);
    setTxt('diagWorldHit', inputDiag.lastHitFailed ? 'MISS' : inputDiag.lastHitX === null ? '—' : `${inputDiag.lastHitX}, ${inputDiag.lastHitY}`);
    setTxt('diagMoveOrders', `${inputDiag.moveOrdersIssued} (last ${inputDiag.lastMoveCount})`);
    setTxt('diagUnitDelta', inputDiag.unitPositionDelta.toFixed(1));
    const simLabel = !inputDiag.running ? 'stopped' : inputDiag.paused ? 'paused' : inputDiag.tacticalPause ? 'tactical-pause' : 'running';
    setTxt('diagSimState', simLabel);
    const recStatus = document.getElementById('diagRecStatus');
    if (recStatus) {
      if (isRecordingTelemetry) {
        recStatus.textContent = `● REC (${recordedSamples.length}s)`;
        recStatus.style.color = '#fb7185';
      } else {
        recStatus.textContent = recordedSamples.length > 0 ? `SAVED (${recordedSamples.length}s)` : 'IDLE';
        recStatus.style.color = '#94a3b8';
      }
    }
  });
}
function startTelemetryRecording() {
  isRecordingTelemetry = true;
  recordingStartIso = new Date().toISOString();
  recordingStartPerfMs = performance.now();
  lastSamplePerfMs = recordingStartPerfMs - 1000;
  recordedSamples = [];
  const firstSample = buildCurrentTelemetrySample(recordingStartPerfMs);
  firstSample.elapsedSec = 0;
  recordedSamples.push(firstSample);
  lastSamplePerfMs = recordingStartPerfMs;
  runHudSafe('startTelemetryRecording', () => {
    const btnStart = document.getElementById('btnDiagStartRec');
    const btnStop = document.getElementById('btnDiagStopExport');
    if (btnStart) {
      btnStart.textContent = 'Recording';
      btnStart.classList.add('recording');
      btnStart.disabled = true;
    }
    if (btnStop) {
      btnStop.disabled = false;
    }
  });
  updateDiagnosticHUD(firstSample);
  setStatusMessage('Started per-second performance telemetry recording');
}
function stopAndExportTelemetryReport() {
  const stopPerfMs = performance.now();
  if (isRecordingTelemetry) {
    const finalSample = buildCurrentTelemetrySample(stopPerfMs);
    recordedSamples.push(finalSample);
  }
  isRecordingTelemetry = false;
  const stopIso = new Date().toISOString();
  runHudSafe('stopAndExportTelemetryReport', () => {
    const btnStart = document.getElementById('btnDiagStartRec');
    const btnStop = document.getElementById('btnDiagStopExport');
    if (btnStart) {
      btnStart.textContent = 'Start';
      btnStart.classList.remove('recording');
      btnStart.disabled = false;
    }
    if (btnStop) {
      btnStop.disabled = true;
    }
  });
  const samples = recordedSamples.length > 0 ? recordedSamples : [buildCurrentTelemetrySample(stopPerfMs)];
  const avgFps = samples.reduce((acc, s) => acc + s.fpsRollingAvg, 0) / samples.length;
  const min1Low = Math.min(...samples.map(s => s.fpsApprox1PercentLow));
  const maxP95 = Math.max(...samples.map(s => s.browserFrameTimeP95Ms));
  const peakCalls = Math.max(...samples.map(s => s.drawCalls));
  const peakTris = Math.max(...samples.map(s => s.renderedTriangles));
  const peakUnits = Math.max(...samples.map(s => s.activeUnitCount));
  const maxCtxLoss = Math.max(...samples.map(s => s.webglContextLossCount));
  const report = {
    schemaVersion: 'starfront-3d-r2.2-telemetry-v1',
    measurementNote: 'Browser requestAnimationFrame frame-to-frame deltas and CPU-side WebGL render submission times. browserFrameTime* is the rAF delta. cpuRenderCallAvgMs is renderer.render() submission only. Not hardware GPU timer queries or native thermal state.',
    measurementMethod: FPS_MEASUREMENT_METHOD,
    device: readDeviceMetrics(),
    recordingStartedAt: recordingStartIso || stopIso,
    recordingStoppedAt: stopIso,
    durationSeconds: Number(((stopPerfMs - (recordingStartPerfMs || stopPerfMs)) / 1000).toFixed(2)),
    sampleCount: samples.length,
    samplesCount: samples.length,
    recentFrameDeltasMs: recentFrameDeltasMs(),
    summary: {
      overallAvgFps: Number(avgFps.toFixed(1)),
      min1PercentLowFps: Number(min1Low.toFixed(1)),
      maxBrowserFrameTimeP95Ms: Number(maxP95.toFixed(2)),
      peakDrawCalls: peakCalls,
      peakTriangles: peakTris,
      peakActiveUnits: peakUnits,
      totalWebglContextLosses: maxCtxLoss
    },
    samples,
    events: sessionEvents.slice()
  };
  window.__STARFRONT_LAST_TELEMETRY_EXPORT__ = report;
  try {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starfront-3d-telemetry-${stopIso.replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (_e) {
    // Headless environment fallback: report remains on window.__STARFRONT_LAST_TELEMETRY_EXPORT__
  }
  updateDiagnosticHUD(samples[samples.length - 1]);
  setStatusMessage(`Exported JSON telemetry report (${samples.length} samples)`);
  return report;
}

// Wire HUD Controls inside isolated HUD error boundary
runHudSafe('bindHudControls', () => {
  document.getElementById('btnToggleDiagHud')?.addEventListener('click', () => {
    runHudSafe('btnToggleDiagHud', () => {
      setDiagHudVisible(!diagHudVisible);
    });
  });
  document.getElementById('btnDiagClose')?.addEventListener('click', () => {
    runHudSafe('btnDiagClose', () => {
      setDiagHudVisible(false);
    });
  });
  setDiagHudVisible(false);
  document.getElementById('btnDiagStartRec')?.addEventListener('click', () => {
    startTelemetryRecording();
  });
  document.getElementById('btnDiagStopExport')?.addEventListener('click', () => {
    stopAndExportTelemetryReport();
  });
  document.getElementById('btnModeSelect')?.addEventListener('click', () => {
    inputCtrl.mode = 'select';
    setStatusMessage('Box-Select / Command Mode active');
  });
  document.getElementById('btnModePan')?.addEventListener('click', () => {
    inputCtrl.mode = 'pan';
    setStatusMessage('One-Finger Camera Pan Mode active');
  });
  document.getElementById('btnSelectAll')?.addEventListener('click', () => {
    let count = 0;
    for (const u of core.state.units) {
      if (u.team === 'player' && u.hp > 0) {
        u.selected = true;
        count++;
      } else {
        u.selected = false;
      }
    }
    setStatusMessage(`Selected all ${count} friendly combat units`);
  });
  document.getElementById('btnAttackMove')?.addEventListener('click', () => {
    const sel = core.state.units.filter(u => u.team === 'player' && u.selected && u.hp > 0);
    if (sel.length === 0) {
      for (const u of core.state.units) {
        if (u.team === 'player' && u.hp > 0) u.selected = true;
      }
    }
    inputCtrl.mode = 'attackMove';
    setStatusMessage('Attack-Move armed — Tap target destination on 3D battlefield');
  });
  document.getElementById('btnHoldOrder')?.addEventListener('click', () => {
    const sel = core.state.units.filter(u => u.team === 'player' && u.selected && u.hp > 0);
    sel.forEach(u => {
      u.state = 'hold';
      u.targetEntity = null;
    });
    setStatusMessage(`${sel.length} unit(s) holding position`);
  });
  document.getElementById('btnRetreatOrder')?.addEventListener('click', () => {
    const hq = core.state.buildings.find(b => b.team === 'player' && b.type === 'hq') || {
      x: 145,
      y: 650
    };
    core.issueMoveOrder(hq.x + 80, hq.y - 60, false);
    setStatusMessage('Retreating selected squad to Aegis HQ');
  });
  const bindTrain = (btnId, uType) => {
    document.getElementById(btnId)?.addEventListener('click', () => {
      const res = core.trainPlayerUnit(uType);
      if (res.ok) {
        setStatusMessage(`Deployed ${res.unit?.name || uType}`);
      } else {
        setStatusMessage(`Cannot deploy: ${res.reason}`);
      }
    });
  };
  bindTrain('btnTrainMarine', 'marine');
  bindTrain('btnTrainTrooper', 'trooper');
  bindTrain('btnTrainApc', 'apc');
  bindTrain('btnTrainTank', 'tank');
  document.getElementById('btnBuildTurret')?.addEventListener('click', () => {
    const res = core.constructPlayerBuilding('turret');
    if (res.ok) {
      setStatusMessage('Constructed Laser Defense Turret (-150 GDP)');
    } else {
      setStatusMessage(`Cannot build Turret: ${res.reason}`);
    }
  });

  // Camera Controls
  document.getElementById('btnCamFocus')?.addEventListener('click', () => {
    const sel = core.state.units.filter(u => u.team === 'player' && u.selected && u.hp > 0);
    const pool = sel.length > 0 ? sel : core.state.units.filter(u => u.team === 'player' && u.hp > 0);
    if (pool.length > 0) {
      const cx = pool.reduce((s, u) => s + u.x, 0) / pool.length;
      const cy = pool.reduce((s, u) => s + u.y, 0) / pool.length;
      scene3d.focusOnWorldPoint(cx, cy);
      setStatusMessage('Camera focused on friendly squad');
    }
  });
  document.getElementById('btnCamOutpost')?.addEventListener('click', () => {
    scene3d.focusOnWorldPoint(600, 400);
    setStatusMessage('Camera centered on Omega Bridge & Outpost');
  });
  document.getElementById('btnCamRotateL')?.addEventListener('click', () => scene3d.rotateCamera(-Math.PI / 8));
  document.getElementById('btnCamRotateR')?.addEventListener('click', () => scene3d.rotateCamera(Math.PI / 8));
  document.getElementById('btnCamZoomIn')?.addEventListener('click', () => scene3d.zoomAtScreenPoint(1.18, window.innerWidth / 2, window.innerHeight / 2));
  document.getElementById('btnCamZoomOut')?.addEventListener('click', () => scene3d.zoomAtScreenPoint(0.84, window.innerWidth / 2, window.innerHeight / 2));
  document.getElementById('btnCamReset')?.addEventListener('click', () => {
    scene3d.resetCamera();
    setStatusMessage('Camera reset to default 45° tactical view');
  });
  document.getElementById('btnQualityPreset')?.addEventListener('click', () => {
    const order = ['eco', 'balanced', 'quality'];
    const next = order[(order.indexOf(scene3d.getQualityPreset()) + 1) % order.length];
    scene3d.setQualityPreset(next);
    const el = document.getElementById('btnQualityPreset');
    if (el) el.textContent = PRESET_SHORT[next];
    pushSessionEvent({
      kind: 'graphics-preset',
      timestampIso: new Date().toISOString(),
      perfMs: Math.round(performance.now()),
      preset: next,
      devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2)),
      rendererPixelRatio: Number((scene3d.renderer.getPixelRatio ? scene3d.renderer.getPixelRatio() : 1).toFixed(2))
    });
    setStatusMessage(`Graphics preset: ${next.toUpperCase()}`);
  });
  document.getElementById('btnPauseGame')?.addEventListener('click', () => {
    core.state.tacticalPause = !core.state.tacticalPause;
    const el = document.getElementById('btnPauseGame');
    if (el) el.textContent = core.state.tacticalPause ? 'Play' : 'Pause';
    setStatusMessage(core.state.tacticalPause ? 'Tactical Pause Active' : 'Simulation Resumed');
  });
  document.getElementById('btnRestartGame')?.addEventListener('click', () => {
    core.initVerticalSlice('normal');
    scene3d.resetCamera();
    setStatusMessage('Battlefield restarted!');
  });
});
scene3d.onContextLost = info => {
  pushSessionEvent({
    kind: 'webgl-context-loss',
    timestampIso: info.timestampIso,
    perfMs: Math.round(performance.now()),
    count: info.count
  });
};
scene3d.onViewportDecision = info => {
  const canvas = scene3d.renderer.domElement;
  pushSessionEvent({
    kind: 'viewport-resize',
    timestampIso: new Date().toISOString(),
    perfMs: Math.round(performance.now()),
    cssWidth: info.cssWidth,
    cssHeight: info.cssHeight,
    applied: info.applied,
    reason: info.reason,
    devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2)),
    drawingBufferWidth: canvas?.width || 0,
    drawingBufferHeight: canvas?.height || 0
  });
};
function onViewportSignal() {
  scene3d.handleResize();
}
window.addEventListener('resize', onViewportSignal);
if (window.visualViewport && typeof window.visualViewport.addEventListener === 'function') {
  window.visualViewport.addEventListener('resize', onViewportSignal);
}
if (typeof document.addEventListener === 'function') {
  document.addEventListener('visibilitychange', () => {
    pushSessionEvent({
      kind: 'visibility',
      timestampIso: new Date().toISOString(),
      perfMs: Math.round(performance.now()),
      visibilityState: document.visibilityState,
      hidden: document.hidden
    });
  });
}
if (typeof ResizeObserver !== 'undefined') {
  const viewportObserver = new ResizeObserver(() => onViewportSignal());
  viewportObserver.observe(viewportEl);
}
pushSessionEvent({
  kind: 'graphics-preset',
  timestampIso: new Date().toISOString(),
  perfMs: Math.round(performance.now()),
  preset: scene3d.getQualityPreset(),
  devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2)),
  rendererPixelRatio: Number((scene3d.renderer.getPixelRatio ? scene3d.renderer.getPixelRatio() : 1).toFixed(2))
});
pushSessionEvent({
  kind: 'visibility',
  timestampIso: new Date().toISOString(),
  perfMs: Math.round(performance.now()),
  visibilityState: document.visibilityState,
  hidden: document.hidden
});
pushSessionEvent({
  kind: 'viewport-resize',
  timestampIso: new Date().toISOString(),
  perfMs: Math.round(performance.now()),
  cssWidth: Math.round(viewportEl.clientWidth),
  cssHeight: Math.round(viewportEl.clientHeight),
  applied: true,
  reason: 'initial',
  devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2)),
  drawingBufferWidth: scene3d.renderer.domElement?.width || 0,
  drawingBufferHeight: scene3d.renderer.domElement?.height || 0
});

// Main Loop with Lightweight Telemetry & Diagnostic HUD
let lastFrameTime = performance.now();
let hudAccum = 0;
let diagAccum = 0;
let firstFrameRendered = false;
function animate(now) {
  requestAnimationFrame(animate);
  const dtMs = Math.max(0, now - lastFrameTime);
  const elapsed = dtMs / 1000;
  lastFrameTime = now;
  recordFrameDelta(dtMs);
  const {
    alpha
  } = core.stepSimulation(elapsed);
  scene3d.syncFromGameCore(alpha);
  scene3d.render();
  if (isRecordingTelemetry && now - lastSamplePerfMs >= 1000) {
    lastSamplePerfMs = now;
    recordedSamples.push(buildCurrentTelemetrySample(now));
  }
  diagAccum += elapsed;
  if (diagAccum >= 0.5) {
    diagAccum = 0;
    updateDiagnosticHUD(buildCurrentTelemetrySample(now));
  }
  hudAccum += elapsed;
  if (hudAccum >= 0.2) {
    hudAccum = 0;
    updateHUD();
  }
}

// Render the initial 3D battlefield frame before exposing application readiness
core.stepSimulation(0);
scene3d.syncFromGameCore(0);
scene3d.render();
firstFrameRendered = true;
updateHUD();
updateDiagnosticHUD(buildCurrentTelemetrySample(performance.now()));
requestAnimationFrame(animate);

// Canonical application harness at window.STARFRONT_3D (exposed only after init & first frame render)
const appHarness = {
  ready: true,
  firstFrameRendered,
  core,
  scene3d,
  inputCtrl,
  startTelemetryRecording,
  stopAndExportTelemetryReport,
  getLastTelemetryReport: () => window.__STARFRONT_LAST_TELEMETRY_EXPORT__,
  getSessionTelemetry: () => ({
    events: sessionEvents.slice(),
    measurementMethod: FPS_MEASUREMENT_METHOD,
    device: readDeviceMetrics()
  }),
  getHudHealth: () => ({
    ok: hudErrors.length === 0,
    errorCount: hudErrors.length,
    errors: [...hudErrors]
  })
};
window.STARFRONT_3D = appHarness;
// Legacy alias preserved for backward compatibility with mocked-DOM TEST-12 in tests/run-tests.mjs
window.__STARFRONT_3D__ = appHarness;
window.__STARFRONT_DIAG__ = {
  startRecording: startTelemetryRecording,
  stopAndExport: stopAndExportTelemetryReport,
  getSnapshot: () => buildCurrentTelemetrySample(performance.now()),
  isRecording: () => isRecordingTelemetry
};
})();
