import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/events/$eventSlug/register')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { purchaseEventAccess } = await import('@/server/lms')
        const { eventRegistrationInput } = await import('@/lib/organizer')
        
        try {
          let body
          try {
            body = await request.json()
          } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            })
          }
          
          const parsed = eventRegistrationInput.safeParse(body)
          
          if (!parsed.success) {
            const error = parsed.error as any;
            return new Response(JSON.stringify({ error: error.errors[0].message }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            })
          }
          
          const result = purchaseEventAccess({
            attendeeName: parsed.data.attendeeName,
            attendeeEmail: parsed.data.attendeeEmail,
            slug: params.eventSlug,
          })
          
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
          
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message || 'An error occurred' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      },
    }
  }
})
