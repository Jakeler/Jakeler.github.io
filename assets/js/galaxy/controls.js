// Minimal drag-orbit: rotate the camera around the scene origin while a
// pointer is down, wheel or two-finger pinch to zoom. Deliberately not
// OrbitControls: no pan/inertia, and the camera is also driven by the zoom
// transitions, so it re-syncs from the actual camera position each gesture.
import * as THREE from '../vendor/three.module.min.js'

const RADIUS_MIN = 8
const RADIUS_MAX = 160
const clamp = v => Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, v))

export class DragOrbit {
  constructor(el, { camera, enabled, onChange }) {
    this.getCamera = camera
    this.enabled = enabled
    this.onChange = onChange
    this.spherical = new THREE.Spherical()
    this.pointers = new Map() // active pointers by id, for orbit + pinch
    this.pinch = null

    el.addEventListener('pointerdown', e => {
      if (!this.enabled()) return
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      el.setPointerCapture(e.pointerId)
      this.#regrab()
    })
    el.addEventListener('pointermove', e => {
      if (!this.pointers.has(e.pointerId) || !this.enabled()) return
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (this.pointers.size >= 2) this.#pinchMove()
      else this.#dragMove(e)
    })
    const release = e => {
      this.pointers.delete(e.pointerId)
      this.#regrab() // resume single-finger orbit without a jump
    }
    el.addEventListener('pointerup', release)
    el.addEventListener('pointercancel', release)

    el.addEventListener('wheel', e => {
      if (!this.enabled()) return
      e.preventDefault()
      this.#zoom(1 + e.deltaY * 0.001)
    }, { passive: false })
  }

  // re-anchor both gestures to the current camera whenever the pointer count
  // changes (the transitions move the camera between gestures)
  #regrab() {
    const pts = [...this.pointers.values()]
    this.last = pts[0] ? [pts[0].x, pts[0].y] : null
    this.spherical.setFromVector3(this.getCamera().position)
    this.pinch = pts.length >= 2
      ? { dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), radius: this.spherical.radius }
      : null
  }

  #dragMove(e) {
    if (!this.last) return
    const dx = e.clientX - this.last[0], dy = e.clientY - this.last[1]
    this.last = [e.clientX, e.clientY]
    this.spherical.theta -= dx * 0.005
    this.spherical.phi = Math.min(Math.PI / 2 - 0.05, Math.max(0.1, this.spherical.phi - dy * 0.005))
    this.#apply()
  }

  #pinchMove() {
    if (!this.pinch) { this.#regrab(); return }
    const [a, b] = [...this.pointers.values()]
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    if (dist <= 0) return
    // fingers apart (dist up) shrinks the radius = zoom in, like a map
    this.spherical.radius = clamp(this.pinch.radius * this.pinch.dist / dist)
    this.#apply()
  }

  #zoom(factor) {
    this.spherical.setFromVector3(this.getCamera().position)
    this.spherical.radius = clamp(this.spherical.radius * factor)
    this.#apply()
  }

  #apply() {
    const cam = this.getCamera()
    cam.position.setFromSpherical(this.spherical)
    cam.lookAt(0, 0, 0)
    this.onChange()
  }
}
