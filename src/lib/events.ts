type EventExperience = {
  audience: string
  category: string
  city: string
  format: string
  heroNote: string
  highlights: string[]
  organizerName: string
  price: number
  startAt: string
  endAt: string
  summary: string
  takeaways: string[]
  title: string
  venue: string
  hostBio: string
}

export const eventExperienceBySlug: Record<string, EventExperience> = {
  'ops-foundations': {
    title: 'Online Seminar: Operations Foundations Live',
    summary:
      'A practical live seminar for support and training teams that need sharper service design, calmer escalations, and faster response playbooks.',
    category: 'Online Seminar',
    format: 'Virtual',
    city: 'Streaming worldwide',
    venue: 'Eventku Live Studio',
    organizerName: 'Aimee Santos',
    audience: 'Support leads, training managers, and operations coordinators',
    heroNote: 'A live operating-systems seminar built for teams scaling service delivery.',
    highlights: [
      'Live facilitation with real workflow examples',
      'Downloadable response templates and escalation maps',
      'Practical service-recovery drills with Q&A',
    ],
    startAt: '2026-04-18T02:00:00.000Z',
    endAt: '2026-04-18T06:30:00.000Z',
    price: 149,
    takeaways: [
      'Build a clearer service ownership model',
      'Reduce handoff delays during escalations',
      'Leave with a reusable operating playbook',
    ],
    hostBio:
      'Aimee Santos advises academy and support teams on service design, escalation systems, and training operations.',
  },
  'cohort-playbooks': {
    title: 'Cohort Launch Intensive',
    summary:
      'A hybrid workshop for teams building premium cohort programs, with launch systems, facilitation rhythms, and repeatable activation plans.',
    category: 'Workshop',
    format: 'Hybrid',
    city: 'Kuala Lumpur',
    venue: 'The Campus Ampang',
    organizerName: 'Mira Tan',
    audience: 'Program builders, facilitators, and community leads',
    heroNote: 'An intensive for teams launching premium cohort-based learning experiences.',
    highlights: [
      'Hybrid delivery with in-room collaboration and digital assets',
      'Launch planning templates used by training operators',
      'Facilitation systems for higher attendance and retention',
    ],
    startAt: '2026-05-02T01:00:00.000Z',
    endAt: '2026-05-02T07:00:00.000Z',
    price: 219,
    takeaways: [
      'Design a cleaner week-one launch sequence',
      'Create stronger facilitation touchpoints',
      'Improve attendance pacing across the cohort run',
    ],
    hostBio:
      'Mira Tan works with cohort-based education teams on launch architecture, facilitation systems, and learner activation.',
  },
  'analytics-for-academies': {
    title: 'Executive Workshop: Learning Analytics',
    summary:
      'An advanced seminar for operators who need cleaner reporting, stronger completion signals, and executive-ready views into program performance.',
    category: 'Executive Workshop',
    format: 'Virtual',
    city: 'Streaming worldwide',
    venue: 'Eventku Broadcast Room',
    organizerName: 'Rohan Patel',
    audience: 'Heads of learning, academy operators, and reporting owners',
    heroNote: 'A strategy-heavy workshop for teams that need better reporting and sharper executive visibility.',
    highlights: [
      'Executive-ready reporting patterns',
      'Hands-on signal mapping for completion and risk',
      'Practical dashboard framing for non-analyst stakeholders',
    ],
    startAt: '2026-05-16T02:30:00.000Z',
    endAt: '2026-05-16T08:30:00.000Z',
    price: 179,
    takeaways: [
      'Define stronger learning health indicators',
      'Turn raw activity into decision-ready dashboards',
      'Present training outcomes with more confidence',
    ],
    hostBio:
      'Rohan Patel helps learning organizations translate reporting noise into practical executive decisions.',
  },
}

export function getEventExperience(slug: string) {
  return eventExperienceBySlug[slug] ?? null
}
