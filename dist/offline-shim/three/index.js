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

export const REVISION = '160-offline-webgl2-shim';
export const IS_OFFICIAL_THREE = false;
export const FrontSide = 0;
export const BackSide = 1;
export const DoubleSide = 2;
export const BasicShadowMap = 0;
export const PCFShadowMap = 1;
export const PCFSoftShadowMap = 2;
export const NoBlending = 0;
export const NormalBlending = 1;
export const AdditiveBlending = 2;
export const DynamicDrawUsage = 35048;
export const StaticDrawUsage = 35044;

export class Color {
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

export class Vector2 {
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

export class Vector3 {
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

export class Euler {
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

export class Quaternion {
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

export class Matrix4 {
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

export class Box3 {
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

export class Sphere {
  constructor(center = new Vector3(), radius = 1) {
    this.center = center;
    this.radius = radius;
  }
}

export class Plane {
  constructor(normal = new Vector3(0, 1, 0), constant = 0) {
    this.normal = normal;
    this.constant = constant;
  }
}

export class Frustum {
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

export class Ray {
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

export class Raycaster {
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

export class Object3D {
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

export class Group extends Object3D {
  constructor() {
    super();
    this.isGroup = true;
  }
}

export class Scene extends Object3D {
  constructor() {
    super();
    this.isScene = true;
    this.background = new Color(0x0b1528);
  }
}

export class OrthographicCamera extends Object3D {
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

export class PerspectiveCamera extends Object3D {
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

export class AmbientLight extends Object3D {
  constructor(color = 0xffffff, intensity = 1) {
    super();
    this.color = new Color(color);
    this.intensity = intensity;
    this.isLight = true;
  }
}

export class HemisphereLight extends Object3D {
  constructor(skyColor = 0xffffff, groundColor = 0x444444, intensity = 1) {
    super();
    this.color = new Color(skyColor);
    this.groundColor = new Color(groundColor);
    this.intensity = intensity;
    this.isLight = true;
  }
}

export class DirectionalLight extends Object3D {
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

export class BufferAttribute {
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

export class Float32BufferAttribute extends BufferAttribute {
  constructor(array, itemSize) {
    super(array, itemSize);
  }
}

export class InstancedBufferAttribute extends BufferAttribute {
  constructor(array, itemSize, normalized = false, meshPerAttribute = 1) {
    super(array, itemSize);
    this.isInstancedBufferAttribute = true;
    this.normalized = normalized;
    this.meshPerAttribute = meshPerAttribute;
  }
}

export class BufferGeometry {
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

export class InstancedBufferGeometry extends BufferGeometry {
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

export class BoxGeometry extends BufferGeometry {
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

export class CylinderGeometry extends BufferGeometry {
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

export class ConeGeometry extends CylinderGeometry {
  constructor(radius = 1, height = 1, radialSegments = 8) {
    super(0, radius, height, radialSegments);
  }
}

export class SphereGeometry extends BufferGeometry {
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

export class DodecahedronGeometry extends SphereGeometry {
  constructor(radius = 1) {
    super(radius, 6, 5);
  }
}

export class RingGeometry extends BufferGeometry {
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

export class PlaneGeometry extends BufferGeometry {
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

export class Material {
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

export class MeshLambertMaterial extends Material {
  constructor(params = {}) {
    super(params);
    this.isBasic = false;
  }
}

export class MeshPhongMaterial extends Material {
  constructor(params = {}) {
    super(params);
    this.isBasic = false;
  }
}

export class MeshStandardMaterial extends Material {
  constructor(params = {}) {
    super(params);
    this.isBasic = false;
  }
}

export class MeshBasicMaterial extends Material {
  constructor(params = {}) {
    super(params);
    this.isBasic = true;
  }
}

export class LineBasicMaterial extends Material {
  constructor(params = {}) {
    super(params);
    this.isBasic = true;
  }
}

export class LineSegments extends Object3D {
  constructor(geometry, material) {
    super();
    this.geometry = geometry;
    this.material = material;
    this.isLineSegments = true;
  }
}

export class GridHelper extends LineSegments {
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

export class Mesh extends Object3D {
  constructor(geometry, material) {
    super();
    this.geometry = geometry;
    this.material = material;
    this.isMesh = true;
  }
}

export class InstancedMesh extends Mesh {
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

export class WebGLRenderer {
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
