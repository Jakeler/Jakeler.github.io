// Camera fly + fullscreen fade between the galaxy and a solar system.
// No dual-scene rendering: the fade covers the scene swap.
import * as THREE from '../vendor/three.module.min.js'

const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export class Transitions {
  constructor(fadeEl, reducedMotion) {
    this.fade = fadeEl
    this.reducedMotion = reducedMotion
    this.queue = []
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
    tween.onUpdate(ease(tween.elapsed / tween.duration))
    if (tween.elapsed >= tween.duration) {
      this.queue.shift()
      tween.resolve()
    }
  }

  // fly the galaxy camera into the star, swap scenes at full fade,
  // then dolly the system camera into place while fading back out
  async zoomIn(galaxy, star, system, onSwap) {
    if (this.reducedMotion) {
      onSwap()
      return
    }
    const from = galaxy.camera.position.clone()
    const fromLook = new THREE.Vector3(0, 0, 0)
    const starPos = star.getWorldPosition(new THREE.Vector3())
    const to = starPos.clone().add(new THREE.Vector3(0, 2.5, 7))
    const look = new THREE.Vector3()
    await this.#tween(1.4, t => {
      galaxy.camera.position.lerpVectors(from, to, t)
      galaxy.camera.lookAt(look.lerpVectors(fromLook, starPos, t))
      this.fade.style.opacity = Math.max(0, (t - 0.6) / 0.4)
    })
    onSwap()
    const sysFrom = system.cameraHome.clone().add(new THREE.Vector3(0, 3, 8))
    const sysTo = system.cameraHome
    await this.#tween(0.7, t => {
      system.camera.position.lerpVectors(sysFrom, sysTo, t)
      system.camera.lookAt(0, 0, 0)
      this.fade.style.opacity = 1 - t
    })
  }

  async zoomOut(system, galaxy, star, onSwap) {
    if (this.reducedMotion) {
      onSwap()
      return
    }
    const sysFrom = system.camera.position.clone()
    const sysTo = system.cameraHome.clone().add(new THREE.Vector3(0, 3, 8))
    await this.#tween(0.6, t => {
      system.camera.position.lerpVectors(sysFrom, sysTo, t)
      system.camera.lookAt(0, 0, 0)
      this.fade.style.opacity = t
    })
    onSwap()
    const starPos = star.getWorldPosition(new THREE.Vector3())
    const from = starPos.clone().add(new THREE.Vector3(0, 2.5, 7))
    const to = galaxy.cameraHome
    const look = new THREE.Vector3()
    await this.#tween(1.2, t => {
      galaxy.camera.position.lerpVectors(from, to, t)
      galaxy.camera.lookAt(look.lerpVectors(starPos, new THREE.Vector3(0, 0, 0), t))
      this.fade.style.opacity = Math.max(0, 1 - t / 0.4)
    })
  }
}
