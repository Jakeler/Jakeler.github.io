// Minimal drag-orbit: rotate the camera around the scene origin while a
// pointer is down. Deliberately not OrbitControls: no zoom/pan/inertia,
// and the camera is also driven by the zoom transitions, so the orbit
// re-syncs from the actual camera position on every drag start.
import * as THREE from '../vendor/three.module.min.js'

export class DragOrbit {
  constructor(el, { camera, enabled, onChange }) {
    this.getCamera = camera
    this.enabled = enabled
    this.onChange = onChange
    this.spherical = new THREE.Spherical()
    this.dragging = false

    el.addEventListener('pointerdown', e => {
      if (!this.enabled()) return
      this.dragging = true
      this.last = [e.clientX, e.clientY]
      this.spherical.setFromVector3(this.getCamera().position)
      el.setPointerCapture(e.pointerId)
    })
    el.addEventListener('pointermove', e => {
      if (!this.dragging || !this.enabled()) return
      const [dx, dy] = [e.clientX - this.last[0], e.clientY - this.last[1]]
      this.last = [e.clientX, e.clientY]
      this.spherical.theta -= dx * 0.005
      this.spherical.phi = Math.min(Math.PI / 2 - 0.05,
        Math.max(0.1, this.spherical.phi - dy * 0.005))
      const cam = this.getCamera()
      cam.position.setFromSpherical(this.spherical)
      cam.lookAt(0, 0, 0)
      this.onChange()
    })
    const stop = () => { this.dragging = false }
    el.addEventListener('pointerup', stop)
    el.addEventListener('pointercancel', stop)

    el.addEventListener('wheel', e => {
      if (!this.enabled()) return
      e.preventDefault()
      const cam = this.getCamera()
      this.spherical.setFromVector3(cam.position)
      this.spherical.radius = Math.min(160,
        Math.max(8, this.spherical.radius * (1 + e.deltaY * 0.001)))
      cam.position.setFromSpherical(this.spherical)
      cam.lookAt(0, 0, 0)
      this.onChange()
    }, { passive: false })
  }
}
