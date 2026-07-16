import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/organizer/attendees')({
  component: OrganizerAttendeesLayout,
})

function OrganizerAttendeesLayout() {
  return <Outlet />
}
