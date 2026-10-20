// @ts-nocheck
import { useThemeStore } from './themeStore'
import './ThemeToggle.css'

function IconSun() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-13a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1zm0 14a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zM4 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1zm14 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1zM6.34 6.34a1 1 0 0 1 1.42 0l.7.7a1 1 0 1 1-1.41 1.42l-.7-.71a1 1 0 0 1 0-1.41zm9.2 9.2a1 1 0 0 1 1.41 0l.7.7a1 1 0 1 1-1.41 1.42l-.7-.71a1 1 0 0 1 0-1.41zm1.41-9.2a1 1 0 0 1 0 1.41l-.7.71A1 1 0 1 1 14.83 7l.7-.7a1 1 0 0 1 1.42 0zm-9.2 9.2a1 1 0 0 1 0 1.42l-.7.7A1 1 0 1 1 5.63 16.13l.7-.7a1 1 0 0 1 1.42 0z" />
    </svg>
  )
}

function IconMoon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.74 2.32a1 1 0 0 1 1.08 1.34 8 8 0 0 0 9.92 9.92 1 1 0 0 1 1.34 1.08A10 10 0 1 1 12.74 2.32z" />
    </svg>
  )
}

function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const isLight = theme === 'light'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isLight ? 'Включить тёмную тему' : 'Включить светлую тему'}
      title={isLight ? 'Тёмная тема' : 'Светлая тема'}
    >
      {isLight ? <IconMoon /> : <IconSun />}
    </button>
  )
}

export default ThemeToggle
