// Watches the site theme (alternate stylesheets toggled by main.js and the
// accent color picker) so the WebGL scenes can re-tint live.
export class ThemeWatcher {
  constructor(onChange) {
    const notify = () => onChange(this.read())
    let pending
    const debounced = () => {
      clearTimeout(pending)
      pending = setTimeout(notify, 50)
    }
    for (const link of document.querySelectorAll('head link.theme-style'))
      new MutationObserver(debounced).observe(link, { attributeFilter: ['disabled'] })
    // the accent picker writes an inline --accent-color on <html>
    new MutationObserver(debounced)
      .observe(document.documentElement, { attributeFilter: ['style'] })
  }

  read() {
    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-color').trim() || '#c53e00'
    const active = document.querySelector('head link.theme-style:not([disabled])')
    const mode = active?.title === 'alt/bright' ? 'light' : 'dark'
    // space stays dark in both themes, just lifted a little in light mode
    return { accent, mode, background: mode === 'light' ? '#12121c' : '#000006' }
  }
}
