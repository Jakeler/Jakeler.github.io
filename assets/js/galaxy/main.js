// Entry point for the /projects/ galaxy page (bundled by Hugo's js.Build).
// Vendored three.js r185 (build/three.module.min.js + three.core.min.js
// from jsdelivr) lives in ../vendor/.
import * as THREE from '../vendor/three.module.min.js'
import { GalaxyScene } from './galaxy.js'
import { SolarSystemScene } from './solar-system.js'
import { Transitions } from './transitions.js'
import { ThemeWatcher } from './theme.js'

const article = document.querySelector('article.galaxy-page')
const container = document.getElementById('galaxy-container')
const canvas = document.getElementById('galaxy-canvas')
const hud = {
  label: document.getElementById('galaxy-label'),
  back: document.getElementById('galaxy-back'),
  info: document.getElementById('galaxy-info'),
  hint: document.getElementById('galaxy-hint'),
  fade: document.getElementById('galaxy-fade'),
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
  const transitions = new Transitions(hud.fade, reducedMotion)
  renderer.setClearColor(theme.background)

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
      galaxy.update(dt, elapsed)
      system.update(dt)
      needsRender = true
    }
    if (needsRender) {
      const scene = active()
      renderer.render(scene.scene, scene.camera)
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
    hud.info.hidden = state !== 'system'
    hud.label.hidden = true
  }

  function showInfo(project) {
    const links = []
    if (project.repo)
      links.push(`<a href="${project.repo}">Repo</a>`)
    for (const url of project.featured ?? [])
      links.push(`<a href="${url}">Featured in ${new URL(url).hostname}</a>`)
    hud.info.innerHTML = `
      <h2>${project.name}</h2>
      <p>${project.description}</p>
      <p>${project.posts.length
        ? `${project.posts.length} post${project.posts.length > 1 ? 's' : ''} orbiting — click a planet to read`
        : 'No posts yet, see the repo'}</p>
      ${links.length ? `<p>${links.join(' · ')}</p>` : ''}`
  }

  function moveLabel(object, text) {
    const pos = object.getWorldPosition(new THREE.Vector3()).project(active().camera)
    const x = (pos.x * 0.5 + 0.5) * container.clientWidth
    const y = (-pos.y * 0.5 + 0.5) * container.clientHeight
    hud.label.textContent = text
    hud.label.style.transform = `translate(-50%, -130%) translate(${x}px, ${y}px)`
    hud.label.hidden = false
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

  canvas.addEventListener('pointermove', event => {
    if (transitions.active) return
    const hit = active().pick(toNdc(event))
    canvas.classList.toggle('pickable', !!hit)
    if (!hit) {
      hud.label.hidden = true
    } else if (state === 'galaxy') {
      const { project } = hit.userData
      moveLabel(hit, `${project.name} (${project.posts.length} post${project.posts.length === 1 ? '' : 's'})`)
    } else if (state === 'system') {
      moveLabel(hit, `${hit.userData.title} · ${hit.userData.date}`)
    }
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
    system.show(star.userData.project)
    showInfo(star.userData.project)
    await transitions.zoomIn(galaxy, star, system, () => {
      current = system
      needsRender = true
    })
    state = 'system'
    setHudState()
  }

  async function exitSystem() {
    if (state !== 'system' || !activeStar) return
    state = 'zooming-out'
    setHudState()
    await transitions.zoomOut(system, galaxy, activeStar, () => {
      current = galaxy
      needsRender = true
    })
    state = 'galaxy'
    setHudState()
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
    showInfo(initial.userData.project)
    // keep a galaxy entry below, so Back zooms out instead of leaving
    const hash = location.hash
    history.replaceState({ view: 'galaxy' }, '', location.pathname)
    history.pushState({ view: 'system' }, '', hash)
  }
  setHudState()
}

try {
  init()
} catch (error) {
  console.warn('Galaxy view unavailable, keeping the plain list:', error)
  article.classList.add('webgl-failed')
}
