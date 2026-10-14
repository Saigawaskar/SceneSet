export function money(value, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function dateLabel(value, options = {}) {
  if (!value) return 'Date to be decided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', ...(options.year ? { year: 'numeric' } : {}), ...(options.weekday ? { weekday: 'short' } : {}) }).format(date);
}

export function dateTimeLabel(value) {
  if (!value) return 'Time to be decided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(date);
}

export function initials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'S';
}

export function eventEmoji(type) {
  return ({ hangout: '✨', birthday: '🎂', food: '🍜', movie: '🎬', trip: '🧳', game: '🎮', study: '📚', other: '🌈' })[type] || '✨';
}
