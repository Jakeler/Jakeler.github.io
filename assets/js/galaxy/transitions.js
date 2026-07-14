// Continuous camera fly between the galaxy and a solar system: while
// `overlap` is set both scenes render into the same frame (additive stars
// on a dark background composite naturally) and crossfade via scene-wide
// material opacity — the screen never cuts to black.
import * as THREE from '../vendor/three.module.min.js'

const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
// clamped smoothstep for the fade windows inside a tween
const window01 = t => {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

export class Transitions {
  constructor(reducedMotion) {
    this.reducedMotion = reducedMotion
    this.queue = []
    this.overlap = false // main.js renders both scenes while set
  }

  get active() { return this.queue.length > 0 }

  #tween(duration, onUpdate) {
    return new Promise(resolve => {
      this.queue.push({ duration, onUpdate, resolve, elapsed: 0 })
    })
  }

  update(dt) {
    const tween = this.queue[0]
    if (!tween) return
    tween.elapsed = Math.min(tween.elapsed + dt, tween.duration)
    const raw = tween.elapsed / tween.duration
    // eased time for motion, raw time for the fade windows: windows cut
    // out of eased time inherit its mid-tween velocity spike and pop
    tween.onUpdate(ease(raw), raw)
    if (tween.elapsed >= tween.duration) {
      this.queue.shift()
      tween.resolve()
    }
  }

  // fly into the star while the solar system materializes inside its glow
  async zoomIn(galaxy, star, system, onSwap) {
    if (this.reducedMotion) {
      onSwap()
      return
    }
    const from = galaxy.camera.position.clone()
    const fromLook = new THREE.Vector3(0, 0, 0)
    const starPos = star.getWorldPosition(new THREE.Vector3())
    const to = starPos.clone().add(new THREE.Vector3(0, 2, 7))
    const look = new THREE.Vector3()
    const sysFrom = system.cameraHome.clone().add(new THREE.Vector3(0, 5, 14))
    const sysTo = system.cameraHome
    system.setOpacity(0)
    this.overlap = true
    await this.#tween(2.4, (t, raw) => {
      galaxy.camera.position.lerpVectors(from, to, t)
      galaxy.camera.lookAt(look.lerpVectors(fromLook, starPos, t))
      // windows run on raw time; eased t is capped at 1 and spikes
      // mid-tween, so windows cut from it pop instead of ramping
      galaxy.setOpacity(1 - window01((raw - 0.9) / 0.1))
      // long gentle reveal: the sun has to outshine the galaxy core
      // before it reads as "appearing", so give it most of the flight
      const s = window01((raw - 0.8) / 0.2)
      system.setOpacity(s)
      system.camera.position.lerpVectors(sysFrom, sysTo, s)
      system.camera.lookAt(0, 0, 0)
    })
    onSwap()
    this.overlap = false
    galaxy.setOpacity(1) // ready for the trip back
    system.setOpacity(1)
  }

  // the system recedes while the galaxy fades back in around the star
  async zoomOut(system, galaxy, star, onSwap) {
    if (this.reducedMotion) {
      onSwap()
      return
    }
    const starPos = star.getWorldPosition(new THREE.Vector3())
    const from = starPos.clone().add(new THREE.Vector3(0, 2.5, 7))
    const to = galaxy.cameraHome
    const look = new THREE.Vector3()
    const sysFrom = system.camera.position.clone()
    const sysTo = system.cameraHome.clone().add(new THREE.Vector3(0, 5, 14))
    galaxy.setOpacity(0)
    this.overlap = true
    await this.#tween(1.2, (t, raw) => {
      const s = window01(raw / 0.6)
      system.camera.position.lerpVectors(sysFrom, sysTo, s)
      system.camera.lookAt(0, 0, 0)
      system.setOpacity(1 - s)
      galaxy.setOpacity(window01((raw - 0.25) / 0.5))
      galaxy.camera.position.lerpVectors(from, to, t)
      galaxy.camera.lookAt(look.lerpVectors(starPos, new THREE.Vector3(0, 0, 0), t))
    })
    onSwap()
    this.overlap = false
    system.setOpacity(1) // dispose/rebuild follows, but keep it sane
  }
}
