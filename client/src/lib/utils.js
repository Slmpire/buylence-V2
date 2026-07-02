// Format Naira amounts
export function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString('en-NG')}`
}

// Generate a random order number (used until backend returns real ones)
export function generateOrderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `BUY-${suffix}`
}

// Truncate long text
export function truncate(text, maxLength = 60) {
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

// Get initials from a full name
export function getInitials(name) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}