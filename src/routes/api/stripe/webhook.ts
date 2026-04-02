import { createAPIFileRoute } from '@tanstack/react-start/api'

import { getStripe } from '@/lib/stripe'

export const APIRoute = createAPIFileRoute('/api/stripe/webhook')({
  POST: async ({ request }) => {
    const rawBody = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
      return new Response('Missing stripe-signature header', { status: 400 })
    }

    const stripe = getStripe()
    let event

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err) {
      return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const { fulfillCheckoutSession } = await import('@/server/stripe')
      await fulfillCheckoutSession(session.id)
    }

    return Response.json({ received: true })
  },
})
