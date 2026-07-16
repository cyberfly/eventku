import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { createOrderInput, orderConfirmationCodeInput } from '@/lib/orders'

export const createOrderFn = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof createOrderInput>) => createOrderInput.parse(input))
  .handler(async ({ data }) => {
    const { createOrder } = await import('@/server/orders')

    return createOrder(data)
  })

export const getOrderByConfirmationCodeFn = createServerFn({ method: 'GET' })
  .inputValidator((input: z.infer<typeof orderConfirmationCodeInput>) =>
    orderConfirmationCodeInput.parse(input),
  )
  .handler(async ({ data }) => {
    const { getOrderByConfirmationCode } = await import('@/server/orders')

    return getOrderByConfirmationCode(data.confirmationCode)
  })

export const listOrganizerOrdersFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { listOrganizerOrders } = await import('@/server/orders')

  return listOrganizerOrders()
})
