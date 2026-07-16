import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/organizer/orders')({
  component: OrganizerOrdersLayout,
})

function OrganizerOrdersLayout() {
  return <Outlet />
}
