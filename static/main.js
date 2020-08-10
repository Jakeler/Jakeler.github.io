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

// Restore stored state
function restore() {
  selectStyle(localStorage.getItem('theme'))
  window.onmessage = evt => { // wait for iframe complete loading
    if (evt.origin === 'https://utteranc.es') {
      selectCommentsStyle(localStorage.getItem('theme'))
      window.onmessage = null // reset listener
    }
  }

  setAccent(localStorage.getItem('accent'))
}
function reset() {
  localStorage.clear()
  location.reload();
}

restore()

window.addEventListener('DOMContentLoaded', _ => {

  const picker = updatePicker()
  picker.onchange = e => setAccent(picker.value)

  const darkBtn = document.querySelector('div.themes button.dark')
  darkBtn.onclick = e => selectStyle('default/dark')
  const brightBtn = document.querySelector('div.themes button.bright')
  brightBtn.onclick = e => selectStyle('alt/bright')

  const resetBtn = document.querySelector('.theme button.reset')
  resetBtn.onclick = e => reset()
})