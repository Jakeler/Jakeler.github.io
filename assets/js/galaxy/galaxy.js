// Spiral galaxy scene: procedural background stars plus one highlighted,
// pickable star per project. Deterministic (seeded PRNG) so the layout is
// identical on every visit.
import * as THREE from '../vendor/three.module.min.js'

// mulberry32, seeded for a stable galaxy
function prng(seed) {
  let a = seed
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function gaussian(rand) {
  // Box-Muller
  const u = Math.max(rand(), 1e-9), v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// soft radial gradient sprite, used for stars and glows
export function glowTexture(color, coreSize = 0.25) {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(coreSize, color)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// logarithmic spiral: r = A * e^(B*t), two arms offset by PI
const ARM = { A: 2.5, B: 0.36, T_MIN: 0.3, T_MAX: 2.5 * Math.PI }
const CAMERA_HOME = new THREE.Vector3(0, 44, 60)

function armPoint(t, arm) {
  const r = ARM.A * Math.exp(ARM.B * t)
  const theta = t + arm * Math.PI
  return new THREE.Vector3(r * Math.cos(theta), 0, r * Math.sin(theta))
}

export class GalaxyScene {
  constructor({ projects, accent, reducedMotion }) {
    this.reducedMotion = reducedMotion
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500)
    this.camera.position.copy(CAMERA_HOME)
    this.camera.lookAt(0, 0, 0)
    this.raycaster = new THREE.Raycaster()

    this.scene.add(this.#makeStars())
    this.projectSprites = this.#makeProjectStars(projects, accent)
    for (const s of this.projectSprites) this.scene.add(s)
  }

  get cameraHome() { return CAMERA_HOME.clone() }

  #makeStars() {
    const rand = prng(1337)
    const positions = [], colors = []
    const push = (x, y, z, r, g, b) => { positions.push(x, y, z); colors.push(r, g, b) }
    const starColor = (radius) => {
      // warm to cool white noise, dimmer towards the rim
      const temp = rand()
      const bright = Math.max(0.15, Math.min(1, 1.15 - radius / 55 - rand() * 0.4))
      return [
        (1.0 * temp + 0.80 * (1 - temp)) * bright,
        (0.93 * temp + 0.88 * (1 - temp)) * bright,
        (0.85 * temp + 1.0 * (1 - temp)) * bright,
      ]
    }
    // spiral arms with scatter fanning out along the radius
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 2200; i++) {
        // bias samples outward: uniform t crowds the center of a log spiral
        const t = ARM.T_MIN + Math.pow(rand(), 0.7) * (ARM.T_MAX - ARM.T_MIN)
        const p = armPoint(t, arm)
        const spread = 0.5 + p.length() * 0.07
        p.x += gaussian(rand) * spread
        p.z += gaussian(rand) * spread
        p.y = gaussian(rand) * 0.6
        push(p.x, p.y, p.z, ...starColor(p.length()))
      }
    }
    // central bulge, yellow tinted and flattened
    for (let i = 0; i < 1200; i++) {
      const x = gaussian(rand) * 4, z = gaussian(rand) * 4, y = gaussian(rand) * 1.6
      const bright = 0.5 + rand() * 0.5
      push(x, y, z, bright, bright * 0.88, bright * 0.68)
    }
    // faint wide halo dust
    for (let i = 0; i < 400; i++) {
      const r = 10 + rand() * 40, theta = rand() * 2 * Math.PI
      const b = 0.1 + rand() * 0.15
      push(r * Math.cos(theta), gaussian(rand) * 1.5, r * Math.sin(theta), b, b, b * 1.1)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    const material = new THREE.PointsMaterial({
      size: 0.7,
      map: glowTexture('rgba(255,255,255,0.6)'),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return new THREE.Points(geometry, material)
  }

  #makeProjectStars(projects, accent) {
    this.spriteMaterial = new THREE.SpriteMaterial({
      map: glowTexture(accent, 0.35),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const perArm = Math.ceil(projects.length / 2)
    const rMin = 8, rMax = ARM.A * Math.exp(ARM.B * ARM.T_MAX) * 0.95
    return projects.map((project, i) => {
      // deterministic placement: exactly on the arm curve, evenly spaced
      // in radius (even t would crowd the center of a log spiral)
      const arm = i % 2
      const slot = Math.floor(i / 2) + 0.5
      const r = rMin + slot * (rMax - rMin) / perArm
      const t = Math.log(r / ARM.A) / ARM.B
      const sprite = new THREE.Sprite(this.spriteMaterial)
      sprite.position.copy(armPoint(t, arm))
      sprite.position.y = 0.8 // float above the disk
      sprite.scale.setScalar(2.6)
      sprite.userData = { project, index: i, baseScale: 2.6 }
      return sprite
    })
  }

  update(dt, elapsed) {
    if (this.reducedMotion) return
    this.scene.rotation.y += 0.012 * dt
    for (const s of this.projectSprites) {
      const { baseScale, index } = s.userData
      s.scale.setScalar(baseScale * (1 + 0.18 * Math.sin(elapsed * 2 + index * 1.7)))
    }
  }

  pick(ndc) {
    this.raycaster.setFromCamera(ndc, this.camera)
    const hits = this.raycaster.intersectObjects(this.projectSprites)
    return hits.length ? hits[0].object : null
  }

  setAccent(color) {
    this.spriteMaterial.map?.dispose()
    this.spriteMaterial.map = glowTexture(color, 0.35)
    this.spriteMaterial.needsUpdate = true
  }
}
