// Entry point for the /projects/ galaxy page (bundled by Hugo's js.Build).
// Vendored three.js r185 (build/three.module.min.js + three.core.min.js
// from jsdelivr) lives in ../vendor/.
import * as THREE from '../vendor/three.module.min.js'
import { GalaxyScene } from './galaxy.js'
import { SolarSystemScene } from './solar-system.js'
import { Transitions } from './transitions.js'
import { ThemeWatcher } from './theme.js'
import { DragOrbit } from './controls.js'
import { LabelLayer } from './labels.js'
import { OrbitText } from './orbit-text.js'

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

const article = document.querySelector('article.galaxy-page')
const container = document.getElementById('galaxy-container')
const canvas = document.getElementById('galaxy-canvas')
const hud = {
  back: document.getElementById('galaxy-back'),
  links: document.getElementById('galaxy-links'),
  hint: document.getElementById('galaxy-hint'),
}

const { projects } = JSON.parse(document.getElementById('projects-data').textContent)
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  || new URLSearchParams(location.search).has('reduced')

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  if (!renderer.getContext()) throw new Error('no WebGL context')

  // reveal the canvas before measuring, hide the fallback list
  article.classList.add('galaxy-active')
  container.setAttribute('aria-hidden', 'false')
  document.getElementById('projects-fallback').setAttribute('aria-hidden', 'true')

  const themes = new ThemeWatcher(applyTheme)
  const theme = themes.read()
  const galaxy = new GalaxyScene({ projects, accent: theme.accent, reducedMotion })
  const system = new SolarSystemScene({ accent: theme.accent, reducedMotion })
  const transitions = new Transitions(reducedMotion)
  renderer.setClearColor(theme.background)

  // always-on captions: point labels for the stars and the sun (LabelLayer),
  // titles curving along each orbit ring for the posts (OrbitText)
  const labels = new LabelLayer(container)
  const orbits = new OrbitText(container)
  const galaxyLabels = galaxy.projectSprites.map(sprite => {
    const { project } = sprite.userData
    return {
      object: sprite,
      kind: 'star',
      html: `<span class="name">${esc(project.name)}</span><span class="count">${project.posts.length}</span>`,
    }
  })

  let state = 'galaxy' // galaxy | zooming-in | system | zooming-out
  let activeStar = null
  let running = true, pageVisible = true, canvasVisible = true
  let needsRender = true

  // the rendered scene; swapped by the transitions at the fade peak,
  // not when the state machine starts moving
  let current = galaxy
  const active = () => current

  function resize() {
    const w = container.clientWidth, h = container.clientHeight
    if (!w || !h) return
    const coarse = matchMedia('(pointer: coarse)').matches
    renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2))
    renderer.setSize(w, h, false)
    galaxy.setViewport(renderer.domElement.height)
    for (const cam of [galaxy.camera, system.camera]) {
      cam.aspect = w / h
      cam.updateProjectionMatrix()
    }
    needsRender = true
  }
  new ResizeObserver(resize).observe(container)
  window.addEventListener('resize', resize)
  resize()

  new DragOrbit(canvas, {
    camera: () => active().camera,
    enabled: () => !transitions.active,
    onChange: () => { needsRender = true },
  })

  function applyTheme({ accent, background }) {
    galaxy.setAccent(accent)
    system.setAccent(accent)
    renderer.setClearColor(background)
    needsRender = true
  }

  // --- render loop; in reduced motion only render on demand ---
  let last = performance.now(), elapsed = 0
  function frame(now) {
    requestAnimationFrame(frame)
    if (!running) { last = now; return }
    const dt = Math.min((now - last) / 1000, 0.1)
    last = now
    elapsed += dt
    if (!reducedMotion || transitions.active) {
      transitions.update(dt)
      galaxy.rotate = !transitions.active
      galaxy.update(dt, elapsed)
      system.update(dt)
      needsRender = true
    }
    if (needsRender) {
      system.orient() // turn the star's text side toward the camera
      if (transitions.overlap) {
        // crossfade: both scenes composite into the same frame
        renderer.render(galaxy.scene, galaxy.camera)
        renderer.autoClear = false
        renderer.render(system.scene, system.camera)
        renderer.autoClear = true
      } else {
        const scene = active()
        renderer.render(scene.scene, scene.camera)
      }
      labels.update(active().camera, container.clientWidth, container.clientHeight)
      orbits.update(active().camera, container.clientWidth, container.clientHeight)
      if (current === system) updateLinks()
      needsRender = false
    }
  }
  requestAnimationFrame(frame)

  const updateRunning = () => { running = pageVisible && canvasVisible }
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden
    updateRunning()
  })
  new IntersectionObserver(([entry]) => {
    canvasVisible = entry.isIntersecting
    updateRunning()
  }).observe(canvas)

  // --- hud helpers ---
  function setHudState() {
    hud.hint.hidden = state !== 'galaxy'
    hud.back.hidden = state !== 'system'
    // name + description now live on the star; only the links stay as HTML
    hud.links.hidden = state !== 'system' || !hud.links.innerHTML
  }

  // the project name/description are painted on the star (see solar-system);
  // repo + featured links can't live on a texture, so keep them as HTML
  function showLinks(project) {
    const links = []
    if (project.repo)
      links.push(`<a href="${project.repo}">Repository</a>`)
    for (const url of project.featured ?? [])
      links.push(`<a href="${url}">Featured on ${new URL(url).hostname}</a>`)
    hud.links.innerHTML = links.join('')
  }

  // links are pinned just under the star and only fade in once you've zoomed
  // in close to it (the .near class drives opacity + clickability). The
  // anchor is offset along screen-down (camera's own down axis), not world
  // -Y, so it stays the same distance below the star at any camera angle —
  // like the on-star text, which always faces the camera.
  const linkAnchor = new THREE.Vector3()
  function updateLinks() {
    if (!hud.links.innerHTML) return
    hud.links.classList.toggle('near', system.camera.position.length() < 28)
    linkAnchor.set(0, -1, 0).applyQuaternion(system.camera.quaternion).multiplyScalar(3.6).project(system.camera)
    const x = (linkAnchor.x * 0.5 + 0.5) * container.clientWidth
    const y = (-linkAnchor.y * 0.5 + 0.5) * container.clientHeight
    hud.links.style.transform = `translate(-50%, 0) translate(${x}px, ${y}px)`
  }

  // --- picking ---
  const ndc = new THREE.Vector2()
  function toNdc(event) {
    const rect = canvas.getBoundingClientRect()
    ndc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    return ndc
  }

  // labels are always on now; hover only sets the pointer affordance
  canvas.addEventListener('pointermove', event => {
    if (transitions.active) return
    canvas.classList.toggle('pickable', !!active().pick(toNdc(event)))
  })

  // ignore clicks that were drags
  let downAt = null
  canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY] })
  canvas.addEventListener('click', event => {
    if (transitions.active) return
    if (downAt && Math.hypot(event.clientX - downAt[0], event.clientY - downAt[1]) > 8) return
    const hit = active().pick(toNdc(event))
    if (!hit) return
    if (state === 'galaxy') {
      history.pushState({ view: 'system' }, '', `#${hit.userData.project.id}`)
      enterSystem(hit)
    } else if (state === 'system') {
      location.href = hit.userData.url
    }
  })

  // --- view switching; browser Back leaves the system view, not the page ---
  async function enterSystem(star) {
    activeStar = star
    state = 'zooming-in'
    setHudState()
    labels.show(false) // fade galaxy names out for the flight
    system.show(star.userData.project)
    showLinks(star.userData.project)
    await transitions.zoomIn(galaxy, star, system, () => {
      current = system
      labels.set([]) // the sun carries its own name now
      orbits.set(system.orbits)
      needsRender = true
    })
    state = 'system'
    setHudState()
    labels.show(true)
    orbits.show(true)
  }

  async function exitSystem() {
    if (state !== 'system' || !activeStar) return
    state = 'zooming-out'
    setHudState()
    labels.show(false)
    orbits.show(false)
    await transitions.zoomOut(system, galaxy, activeStar, () => {
      current = galaxy
      labels.set(galaxyLabels)
      orbits.clear()
      needsRender = true
    })
    state = 'galaxy'
    setHudState()
    labels.show(true)
    system.dispose()
    activeStar = null
  }

  hud.back.addEventListener('click', () => history.back())
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && state === 'system') history.back()
  })
  window.addEventListener('popstate', () => {
    const star = starFromHash()
    if (star && state === 'galaxy') enterSystem(star)
    else if (!star) exitSystem()
  })

  function starFromHash() {
    const id = location.hash.slice(1)
    return galaxy.projectSprites.find(s => s.userData.project.id === id) ?? null
  }

  // deep link: #project-id opens the system view directly
  const initial = starFromHash()
  if (initial) {
    activeStar = initial
    state = 'system'
    current = system
    system.show(initial.userData.project)
    showLinks(initial.userData.project)
    labels.set([])
    orbits.set(system.orbits)
    // keep a galaxy entry below, so Back zooms out instead of leaving
    const hash = location.hash
    history.replaceState({ view: 'galaxy' }, '', location.pathname)
    history.pushState({ view: 'system' }, '', hash)
  } else {
    labels.set(galaxyLabels)
  }
  labels.show(true)
  if (initial) orbits.show(true)
  setHudState()
}

try {
  init()
} catch (error) {
  console.warn('Galaxy view unavailable, keeping the plain list:', error)
  article.classList.add('webgl-failed')
}
