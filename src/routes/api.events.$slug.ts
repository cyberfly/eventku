import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody, toErrorResponse } from '@/lib/http'
import { organizerCourseInput } from '@/lib/organizer'
import { getEventDetail } from '@/server/lms'
import { deleteOrganizerCourseBySlug, updateOrganizerCourseBySlug } from '@/server/organizer'

export const Route = createFileRoute('/api/events/$slug')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const result = getEventDetail(params.slug)

        if (!result) {
          return Response.json({ error: 'Event not found.' }, { status: 404 })
        }

        return Response.json(result)
      },
      PUT: async ({ request, params }) => {
        const { data, response } = await parseJsonBody(request, organizerCourseInput)

        if (!data) {
          return response
        }

        try {
          return Response.json(updateOrganizerCourseBySlug(params.slug, data))
        } catch (error) {
          return toErrorResponse(error, 'Unable to update event.')
        }
      },
      DELETE: ({ params }) => {
        try {
          deleteOrganizerCourseBySlug(params.slug)

          return Response.json({ ok: true })
        } catch (error) {
          return toErrorResponse(error, 'Unable to delete event.')
        }
      },
    },
  },
})
