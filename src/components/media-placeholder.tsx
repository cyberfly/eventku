import type { CSSProperties } from 'react'

type MediaPlaceholderProps = {
  accent: string
  eyebrow?: string
  imageUrl?: string | null
  meta?: string
  title: string
  variant?: 'avatar' | 'card' | 'hero' | 'row'
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function MediaPlaceholder({
  accent,
  eyebrow,
  imageUrl,
  meta,
  title,
  variant = 'card',
}: MediaPlaceholderProps) {
  const hasImage = Boolean(imageUrl)

  return (
    <div
      aria-hidden="true"
      className={`media-placeholder media-placeholder-${variant}${hasImage ? ' media-placeholder-has-image' : ''}`}
      style={{ '--placeholder-accent': accent } as CSSProperties}
    >
      {hasImage ? <img alt="" className="media-placeholder-image" src={imageUrl ?? undefined} /> : null}
      {variant === 'avatar' ? (
        hasImage ? null : (
          <span className="media-placeholder-initials">{getInitials(title)}</span>
        )
      ) : (
        <>
          {hasImage ? null : <div className="media-placeholder-orb" />}
          {hasImage ? null : <div className="media-placeholder-grid" />}
          {hasImage ? <div className="media-placeholder-scrim" /> : null}
          <div className="media-placeholder-copy">
            {eyebrow ? <span className="media-placeholder-eyebrow">{eyebrow}</span> : null}
            <strong>{title}</strong>
            {meta ? <span className="media-placeholder-meta">{meta}</span> : null}
          </div>
        </>
      )}
    </div>
  )
}
