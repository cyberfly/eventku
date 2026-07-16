import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const orderNumberInput = z.object({
  orderNumber: z.string().min(1),
})

export const getOrderByNumberFn = createServerFn({ method: 'GET' })
  .inputValidator((input: z.infer<typeof orderNumberInput>) =>
    orderNumberInput.parse(input),
  )
  .handler(async ({ data }) => {
    const { getOrderByNumber } = await import('@/server/orders')

    return getOrderByNumber(data.orderNumber)
  })

export const getOrganizerOrdersFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getOrganizerOrders } = await import('@/server/orders')

    return getOrganizerOrders()
  },
)
