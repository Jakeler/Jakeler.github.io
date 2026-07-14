// Curved captions: each post title runs along its orbit ring via an SVG
// <textPath>. The ring is a 3D circle, so every rendered frame we project
// an arc of it into screen space, rebuild the path, and the text follows.
// Kept separate from the point-projected LabelLayer (stars, sun) because
// the geometry and DOM are completely different.
import * as THREE from '../vendor/three.module.min.js'

const NS = 'http://www.w3.org/2000/svg'
const SEGMENTS = 40 // sample points per arc; enough that the curve reads smooth
const MIN_SPAN = 0.08 // short titles hug the flat centre and barely curve
// a long title may curl all the way up to vertical rather than truncate;
// stop just short of a full wrap so the two ends never collide
const MAX_SPAN = 3.0

export class OrbitText {
  constructor(container) {
    this.svg = document.createElementNS(NS, 'svg')
    this.svg.setAttribute('class', 'galaxy-orbit-labels dim')
    this.svg.setAttribute('preserveAspectRatio', 'none')
    container.appendChild(this.svg)
    this.items = []
    this._v = new THREE.Vector3()
    this._uid = 0
  }

  // orbits: [{ radius, title }]
  set(orbits) {
    this.svg.replaceChildren()
    this._uid++
    this._last = null // force a rebuild on the next update
    // hidden probe to measure intrinsic (off-path) text length: this is
    // consistent across browsers, whereas getComputedTextLength() on the
    // on-path text is clamped to the path in Firefox, so the fit loop would
    // stop early and truncate the title
    this.probe = document.createElementNS(NS, 'text')
    this.probe.setAttribute('visibility', 'hidden')
    this.svg.appendChild(this.probe)
    this.items = orbits.map((o, i) => {
      const id = `orbit-path-${this._uid}-${i}`
      const path = document.createElementNS(NS, 'path')
      path.setAttribute('id', id)
      const text = document.createElementNS(NS, 'text')
      const tp = document.createElementNS(NS, 'textPath')
      tp.setAttribute('href', `#${id}`)
      tp.setAttribute('startOffset', '50%') // paired with text-anchor:middle to centre
      tp.textContent = o.title
      text.appendChild(tp)
      this.svg.append(path, text)
      // intrinsic length is fixed by the string + font, so measure it once
      this.probe.textContent = o.title
      return { radius: o.radius, path, textLen: this.probe.getComputedTextLength() }
    })
  }

  clear() {
    this.svg.replaceChildren()
    this.items = []
    this._last = null
  }

  show(on) { this.svg.classList.toggle('dim', !on) }

  update(camera, w, h) {
    if (!this.items.length) return
    // the paths only change when the camera or viewport moves; measuring
    // text/path length forces a layout reflow, so skip it when nothing moved
    const { x, z } = camera.position
    if (this._last && this._last.x === x && this._last.z === z
      && this._last.w === w && this._last.h === h) return
    this._last = { x, z, w, h }

    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    // centre every caption on the ring point facing the camera: it sits at
    // the horizontal middle of the view and on the flattest part of the
    // projected ellipse, so all titles line up regardless of orbit size
    const center = Math.atan2(z, x)
    for (const item of this.items) {
      // grow the arc from flat until the whole title fits: short titles stay
      // nearly straight, long ones curl only as far as they must (up to the
      // wrap cap) — the text is never truncated to fit
      const need = item.textLen * 1.06 // slack so the last glyph isn't clipped
      let span = MIN_SPAN
      for (let iter = 0; iter < 8; iter++) {
        this.#buildPath(item, camera, w, h, center, span)
        const pathLen = item.path.getTotalLength()
        if (need <= 0 || pathLen >= need || span >= MAX_SPAN) break
        span = Math.min(MAX_SPAN, span * Math.min(3, need / pathLen))
      }
    }
  }

  #buildPath(item, camera, w, h, center, span) {
    const pts = []
    for (let s = 0; s <= SEGMENTS; s++) {
      const theta = center - span + (2 * span) * (s / SEGMENTS)
      this._v.set(item.radius * Math.cos(theta), 0, item.radius * Math.sin(theta)).project(camera)
      pts.push([(this._v.x * 0.5 + 0.5) * w, (-this._v.y * 0.5 + 0.5) * h])
    }
    // text renders in path direction; flip so it always runs left-to-right
    if (pts[0][0] > pts[pts.length - 1][0]) pts.reverse()
    item.path.setAttribute('d', 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L'))
  }
}
