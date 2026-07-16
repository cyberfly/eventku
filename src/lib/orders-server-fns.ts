import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const orderIdInput = z.object({
  orderId: z.number().int().positive(),
})

export const getOrganizerOrdersFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { getOrganizerOrders } = await import('@/server/orders')

  return getOrganizerOrders()
})

export const getOrganizerOrderDetailFn = createServerFn({ method: 'GET' })
  .inputValidator((input: z.infer<typeof orderIdInput>) => orderIdInput.parse(input))
  .handler(async ({ data }) => {
    const { getOrganizerOrderDetail } = await import('@/server/orders')

    return getOrganizerOrderDetail(data.orderId)
  })
