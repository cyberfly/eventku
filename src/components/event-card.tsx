import type { CSSProperties } from 'react'

import { Link } from '@tanstack/react-router'

import { formatCurrency, formatEventDate, formatHours } from '@/lib/format'
import { MediaPlaceholder } from '@/components/media-placeholder'

type EventCardProps = {
  accent: string
  attendeeCount: number
  category: string
  city: string
  durationHours: number
  featuredImage?: string | null
  format: string
  price: number
  seatsRemaining: number
  slug: string
  startAt: string
  summary: string
  title: string
  venue: string
}

export function EventCard(props: EventCardProps) {
  return (
    <article className="event-card" style={{ '--course-accent': props.accent } as CSSProperties}>
      <MediaPlaceholder
        accent={props.accent}
        eyebrow={props.category}
        imageUrl={props.featuredImage}
        meta={`${props.format} • ${props.city}`}
        title={props.title}
      />
      <div className="event-card-head">
        <div>
          <p className="event-card-category">{props.category}</p>
          <h3>
            <Link className="event-title-link" params={{ eventSlug: props.slug }} to="/events/$eventSlug">
              {props.title}
            </Link>
          </h3>
        </div>
        <span className="pill">{props.format}</span>
      </div>
      <p className="muted-copy">{props.summary}</p>
      <dl className="stats-grid">
        <div>
          <dt>Date</dt>
          <dd>{formatEventDate(props.startAt)}</dd>
        </div>
        <div>
          <dt>Venue</dt>
          <dd>{props.city}</dd>
        </div>
        <div>
          <dt>Attendees</dt>
          <dd>{props.attendeeCount}</dd>
        </div>
        <div>
          <dt>Seats left</dt>
          <dd>{props.seatsRemaining}</dd>
        </div>
      </dl>
      <div className="event-card-meta">
        <span>{formatCurrency(props.price)}</span>
        <span>{formatHours(props.durationHours)} at {props.venue}</span>
      </div>
      <Link className="ghost-link" params={{ eventSlug: props.slug }} to="/events/$eventSlug">
        View event
      </Link>
    </article>
  )
}
