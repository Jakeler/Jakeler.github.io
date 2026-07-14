// Solar system scene for one project: the sun is the project itself,
// each orbiting planet is a blog post (click target).
import * as THREE from '../vendor/three.module.min.js'
import { glowTexture } from './galaxy.js'

// deterministic per-title variation for planet size/color/phase
function hash01(str, salt = 0) {
  let h = 2166136261 ^ salt
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // murmur3 finalizer: plain FNV-1a barely differs between
  // near-identical titles ("Update 1.1" vs "Update 1.2")
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

const CAMERA_HOME = new THREE.Vector3(0, 20, 46)

// markdownify in the template turns straight quotes into HTML entities
// (&rdquo; etc); canvas fillText would draw them literally, so decode first
const decoder = document.createElement('textarea')
function decodeEntities(s) {
  decoder.innerHTML = s
  return decoder.value
}

// bake the project name + description + a hint onto a canvas mapped over the
// star. The text is kept in a narrow band around the camera-facing point of
// the sphere UV (+Z pole, u≈0.25 v≈0.5), vertically centred, so it sits on
// the flattest part of the visible face and only curves gently. White with a
// dark outline to read over the bright sun.
function infoTexture(project) {
  const W = 2048, H = 1024
  const MAX_W = 400 // narrow column = text stays central, curvature stays mild
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.translate(W * 0.25, H * 0.5) // origin at the camera-facing point
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  const face = (px, style = '') =>
    `${style} ${px}px -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

  // rows: shrink the name to fit, wrap the description, then a hint
  const rows = []
  let nameFont = 46
  ctx.font = face(nameFont, 'bold')
  while (ctx.measureText(decodeEntities(project.name)).width > MAX_W + 40 && nameFont > 24) {
    ctx.font = face(nameFont -= 2, 'bold')
  }
  rows.push({ text: decodeEntities(project.name), px: nameFont, style: 'bold', stroke: 8, h: nameFont + 14 })

  ctx.font = face(26)
  let cur = ''
  for (const word of decodeEntities(project.description).split(/\s+/)) {
    const test = cur ? `${cur} ${word}` : word
    if (cur && ctx.measureText(test).width > MAX_W) { rows.push({ text: cur, px: 26, stroke: 6, h: 32 }); cur = word }
    else cur = test
  }
  if (cur) rows.push({ text: cur, px: 26, stroke: 6, h: 32 })

  const n = project.posts.length
  rows.push({
    text: n ? `${n} post${n > 1 ? 's' : ''} · click one to read` : 'no posts yet · see the repo',
    px: 22, style: 'italic', stroke: 5, h: 46,
  })

  // centre the whole block vertically on the equator
  let y = -rows.reduce((sum, r) => sum + r.h, 0) / 2
  for (const r of rows) {
    y += r.h / 2
    ctx.font = face(r.px, r.style || '')
    ctx.strokeStyle = 'rgba(0,0,0,0.85)'
    ctx.lineWidth = r.stroke
    ctx.strokeText(r.text, 0, y)
    ctx.fillStyle = '#fff'
    ctx.fillText(r.text, 0, y)
    y += r.h / 2
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export class SolarSystemScene {
  constructor({ accent, reducedMotion }) {
    this.reducedMotion = reducedMotion
    this.accent = accent
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500)
    this.camera.position.copy(CAMERA_HOME)
    this.camera.lookAt(0, 0, 0)
    this.raycaster = new THREE.Raycaster()
    this.pivots = []
    this.pickables = []
    this.orbits = []
    this.infoMesh = null
    this.built = null
  }

  get cameraHome() { return CAMERA_HOME.clone() }

  // keep the text side of the star turned toward the camera (called from the
  // render loop so it also tracks drag/zoom in reduced-motion mode)
  orient() {
    if (this.infoMesh) this.infoMesh.lookAt(this.camera.position)
  }

  show(project) {
    this.dispose()
    this.built = project
    // enough ambient that near-side planets aren't pure silhouettes
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const sunLight = new THREE.PointLight(0xffffff, 600)
    this.scene.add(sunLight)

    // sun: emissive core + additive glow halos
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 32, 16),
      new THREE.MeshBasicMaterial({ color: this.accent }),
    )
    this.scene.add(sun)
    for (const [scale, opacity] of [[8, 0.5], [13, 0.22]]) {
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture(this.accent, 0.3),
        transparent: true, opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }))
      glow.scale.setScalar(scale)
      this.scene.add(glow)
    }
    // project name + description painted onto the star's surface so it
    // curves with the sphere. A hair above the surface, rotated to face the
    // camera each frame (orient()) so the text is always the near side. Tiny
    // at the home distance, so you zoom in to read it.
    const info = new THREE.Mesh(
      new THREE.SphereGeometry(2.24, 48, 32),
      new THREE.MeshBasicMaterial({
        map: infoTexture(project),
        transparent: true,
        depthWrite: false,
      }),
    )
    info.renderOrder = 5
    this.scene.add(info)
    this.infoMesh = info

    project.posts.forEach((post, j) => {
      // wide inner radius so even a long title stays a gentle arc, not a
      // vertical curl (a small ring can't hold long text flatly)
      const orbit = 9 + 4 * j
      const size = 0.55 + hash01(post.title) * 0.4
      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(size, 24, 12),
        new THREE.MeshLambertMaterial({
          color: new THREE.Color().setHSL(hash01(post.title, 1), 0.45, 0.6),
        }),
      )
      planet.position.x = orbit
      planet.userData = post
      // oversized invisible proxy keeps taps forgiving (raycaster ignores visibility)
      const proxy = new THREE.Mesh(new THREE.SphereGeometry(size * 2.5, 8, 4))
      proxy.visible = false
      proxy.userData = post
      planet.add(proxy)

      const pivot = new THREE.Object3D()
      pivot.rotation.y = hash01(post.title, 2) * 2 * Math.PI
      pivot.userData.speed = 0.5 / Math.sqrt(orbit)
      pivot.add(planet)
      this.scene.add(pivot)
      this.pivots.push(pivot)
      this.pickables.push(planet, proxy)

      const ring = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          new THREE.EllipseCurve(0, 0, orbit, orbit).getPoints(96)),
        new THREE.LineBasicMaterial({ color: 0x666677, transparent: true, opacity: 0.45 }),
      )
      ring.rotation.x = Math.PI / 2
      this.scene.add(ring)

      // invisible fat torus over the ring so a click anywhere along the
      // orbit (not only on the planet) opens the post
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(orbit, 1.1, 6, 80))
      hoop.rotation.x = Math.PI / 2
      hoop.visible = false
      hoop.userData = post
      this.scene.add(hoop)
      this.pickables.push(hoop)

      // title drawn curving along this ring (orbit-text.js); its centre and
      // arc length are derived from the camera there each frame
      this.orbits.push({ radius: orbit, title: post.title })
    })
  }

  update(dt) {
    if (this.reducedMotion) return
    for (const pivot of this.pivots)
      pivot.rotation.y += pivot.userData.speed * dt
  }

  pick(ndc) {
    this.raycaster.setFromCamera(ndc, this.camera)
    const hits = this.raycaster.intersectObjects(this.pickables)
    return hits.length ? hits[0].object : null
  }

  setAccent(color) {
    this.accent = color
    if (this.built) this.show(this.built) // rebuild with new tint
  }

  // whole-scene fade, used while both scenes render during a transition
  setOpacity(v) {
    this.scene.traverse(obj => {
      const material = obj.material
      if (!material) return
      material.userData.baseOpacity ??= material.opacity
      // an opaque material that has already been compiled (the sun and
      // planets, once a deep-linked scene has rendered at full opacity)
      // needs a program recompile when it turns transparent — otherwise
      // three keeps its opaque program and ignores opacity, so the fade
      // never takes and the system hangs on screen until the swap
      if (!material.transparent) material.needsUpdate = true
      material.transparent = true
      material.opacity = material.userData.baseOpacity * v
    })
  }

  dispose() {
    for (const obj of [...this.scene.children]) {
      this.scene.remove(obj)
      obj.traverse?.(child => {
        child.geometry?.dispose()
        child.material?.map?.dispose()
        child.material?.dispose()
      })
    }
    this.pivots = []
    this.pickables = []
    this.orbits = []
    this.infoMesh = null
    this.built = null
  }
}
