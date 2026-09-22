import lightLogo from '../assets/Attento Logomarca.png'
import darkLogo from '../assets/attento-logomarca-dark.png'

export function BrandLogo() {
  return <span className="brand-logo" role="img" aria-label="Attento Saúde Integral">
    <img src={lightLogo} alt="" className="logo-mark brand-logo-light" />
    <img src={darkLogo} alt="" className="logo-mark brand-logo-dark" />
  </span>
}
