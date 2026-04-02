import type { CSSProperties } from 'react'

import { getInitials } from '@/lib/format'

type MediaPlaceholderProps = {
  accent: string
  eyebrow?: string
  meta?: string
  title: string
  variant?: 'avatar' | 'card' | 'hero' | 'row'
}


export function MediaPlaceholder({
  accent,
  eyebrow,
  meta,
  title,
  variant = 'card',
}: MediaPlaceholderProps) {
  return (
    <div
      aria-hidden="true"
      className={`media-placeholder media-placeholder-${variant}`}
      style={{ '--placeholder-accent': accent } as CSSProperties}
    >
      {variant === 'avatar' ? (
        <span className="media-placeholder-initials">{getInitials(title)}</span>
      ) : (
        <>
          <div className="media-placeholder-orb" />
          <div className="media-placeholder-grid" />
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
