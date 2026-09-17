import type { Theme } from './panel'

export function applySavedTheme() {
  let theme: Theme = 'light'
  try {
    const settings = JSON.parse(window.localStorage.getItem('app_settings') || 'null')
    if (settings?.theme === 'dark') theme = 'dark'
  } catch {
    theme = 'light'
  }
  document.documentElement.setAttribute('data-theme', theme)
  return theme
}

export function saveTheme(theme: Theme) {
  const settings = JSON.parse(window.localStorage.getItem('app_settings') || 'null') || {}
  window.localStorage.setItem('app_settings', JSON.stringify({ ...settings, theme }))
  document.documentElement.setAttribute('data-theme', theme)
}
