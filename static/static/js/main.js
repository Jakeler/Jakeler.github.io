// Theme accent color
function getAccent() {
    const styles = window.getComputedStyle(document.documentElement)
    return styles.getPropertyValue('--accent-color')
  }
function setAccent(color) {
  if(color == null)
    return false

  document.documentElement.style.setProperty('--accent-color', color)
  localStorage.setItem('accent', color)
}

function updatePicker() {
  const picker = document.querySelector('.theme input.accent')
  const color = getAccent()
  if (picker) {
    picker.value = color
    console.log('Updated picker', color)
  }
  return picker
}

// Alternate stylesheets
// The initial theme (stored choice or OS preference) is applied by an inline
// script in <head> before first paint, this only handles switching afterwards.
function currentStyle() {
  const active = document.querySelector('head link.theme-style:not([disabled])')
  return active ? active.title : null
}
function selectStyle(title) {
  console.log('=> Set css theme', title)
  if(title == null)
    return false

  const sheets = document.querySelectorAll('head link.theme-style')
  let found = false
  for(const s of sheets) {
    s.disabled = s.title != title
    found = s.title === title? true : found
  }
  selectCommentsStyle(title)
  updatePicker()

  localStorage.setItem('theme', title)
  return found
}
function selectCommentsStyle(theme) {
  const commentsTrans = {
    "default/dark": 'github-dark',
    "alt/bright": 'github-light',
  }
  if(!(theme in commentsTrans))
    return false

  console.log('Setting comments', commentsTrans[theme])

  const message = {
    type: 'set-theme',
    theme: commentsTrans[theme], // 'github-dark', 'github-light', etc..
  };
  const iframe = document.querySelector('.utterances-frame');
  if (iframe != null) {
    iframe.contentWindow.postMessage(message, 'https://utteranc.es');
  }
}

function reset() {
  localStorage.clear()
  location.reload();
}

window.addEventListener('DOMContentLoaded', _ => {
  // sync the comments iframe with the active theme once it finished loading
  window.onmessage = evt => {
    if (evt.origin === 'https://utteranc.es') {
      selectCommentsStyle(currentStyle())
      window.onmessage = null // reset listener
    }
  }

  const picker = updatePicker()
  picker.onchange = e => setAccent(picker.value)

  const darkBtn = document.querySelector('div.themes button.dark')
  darkBtn.onclick = e => selectStyle('default/dark')
  const brightBtn = document.querySelector('div.themes button.bright')
  brightBtn.onclick = e => selectStyle('alt/bright')

  const resetBtn = document.querySelector('.theme button.reset')
  resetBtn.onclick = e => reset()

  // Contact link: fetch a per-visitor alias on the first click, then behave
  // like a normal mailto. On fetch failure the href (redirect endpoint) stays.
  const reveal = document.querySelector('a.email-reveal')
  if (reveal) reveal.addEventListener('click', async e => {
    e.preventDefault()
    try {
      const { email } = await (await fetch(reveal.dataset.api)).json()
      reveal.href = `mailto:${email}`
      reveal.querySelector('span').textContent = email
    } catch {
      location.href = reveal.href
    }
  }, { once: true })
})
