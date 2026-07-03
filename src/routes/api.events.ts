import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody, toErrorResponse } from '@/lib/http'
import { organizerCourseInput } from '@/lib/organizer'
import { getEventCatalog } from '@/server/lms'
import { createOrganizerCourse } from '@/server/organizer'

export const Route = createFileRoute('/api/events')({
  server: {
    handlers: {
      GET: () => Response.json(getEventCatalog()),
      POST: async ({ request }) => {
        const { data, response } = await parseJsonBody(request, organizerCourseInput)

        if (!data) {
          return response
        }

        try {
          return Response.json(createOrganizerCourse(data), { status: 201 })
        } catch (error) {
          return toErrorResponse(error, 'Unable to create event.')
        }
      },
    },
  },
})
