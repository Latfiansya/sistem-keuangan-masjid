import { Link } from 'react-router'

export default function Button({ to, variant = 'solid', disabled = false, children, ...props }) {
  const className = `action-button action-button--${variant}`
  if (to && !disabled) {
    return <Link {...props} to={to} className={className}>{children}</Link>
  }
  return <button {...props} type="button" className={className} disabled={disabled}>{children}</button>
}
