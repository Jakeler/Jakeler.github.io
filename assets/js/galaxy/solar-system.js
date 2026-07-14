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
    this.built = null
  }

  get cameraHome() { return CAMERA_HOME.clone() }

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
    // invisible anchor above the sun so its name label clears the glow at
    // any zoom (tracked in 3D, unlike a fixed pixel offset)
    this.sunAnchor = new THREE.Object3D()
    this.sunAnchor.position.set(0, 5, 0)
    this.scene.add(this.sunAnchor)

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
    this.built = null
  }
}
