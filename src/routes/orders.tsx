import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/orders')({
  component: OrdersLayout,
})

function OrdersLayout() {
  return <Outlet />
}
