const shortDateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
})

const longDateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const eventDateFormatter = new Intl.DateTimeFormat('en-MY', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Kuala_Lumpur',
})

const eventDateTimeFormatter = new Intl.DateTimeFormat('en-MY', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kuala_Lumpur',
})

const currencyFormatter = new Intl.NumberFormat('en-MY', {
  style: 'currency',
  currency: 'MYR',
  maximumFractionDigits: 0,
})

export function formatShortDate(value: string) {
  return shortDateFormatter.format(new Date(value))
}

export function formatLongDate(value: string) {
  return longDateFormatter.format(new Date(value))
}

export function formatEventDate(value: string) {
  return eventDateFormatter.format(new Date(value))
}

export function formatEventDateTime(value: string) {
  return `${eventDateTimeFormatter.format(new Date(value))} MYT`
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatPercent(value: number) {
  return `${value}%`
}

export function formatHours(value: number) {
  return `${value}h`
}

export function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
