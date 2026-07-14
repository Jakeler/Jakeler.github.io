// Always-on HTML caption overlay. Each label tracks a 3D object by
// projecting its world position to the screen every rendered frame, so the
// galaxy reads as an overview and touch devices work without hover (which
// the old single tooltip needed). Positions follow scene rotation and
// planet orbits because getWorldPosition accounts for parent transforms.
import * as THREE from '../vendor/three.module.min.js'

export class LabelLayer {
  constructor(container) {
    this.el = document.createElement('div')
    this.el.className = 'galaxy-labels dim'
    container.appendChild(this.el)
    this.items = []
    this._v = new THREE.Vector3()
  }

  // items: [{ object, kind, html }]; kind picks the .galaxy-<kind>-label class
  set(items) {
    this.el.replaceChildren()
    this.items = items.map(item => {
      const node = document.createElement('div')
      node.className = `galaxy-${item.kind}-label`
      node.innerHTML = item.html
      this.el.appendChild(node)
      return { object: item.object, node }
    })
  }

  clear() {
    this.el.replaceChildren()
    this.items = []
  }

  // fade the whole layer in/out so it doesn't pop during transitions
  show(on) { this.el.classList.toggle('dim', !on) }

  update(camera, w, h) {
    for (const { object, node } of this.items) {
      object.getWorldPosition(this._v).project(camera)
      // z >= 1 is behind the camera; the margin culls off-screen labels
      const onScreen = this._v.z < 1 &&
        Math.abs(this._v.x) < 1.3 && Math.abs(this._v.y) < 1.3
      node.style.display = onScreen ? '' : 'none'
      if (!onScreen) continue
      const x = (this._v.x * 0.5 + 0.5) * w
      const y = (-this._v.y * 0.5 + 0.5) * h
      node.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`
    }
  }
}
