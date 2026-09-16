export function openDashboard() {
  window.location.replace(`/legacy/index.html${window.location.hash || '#dashboard'}`)
}

export function applySavedTheme() {
  let theme = 'light'
  try {
    const settings = JSON.parse(window.localStorage.getItem('app_settings') || 'null')
    if (settings?.theme === 'dark') theme = 'dark'
  } catch {
    theme = 'light'
  }
  document.documentElement.setAttribute('data-theme', theme)
}
