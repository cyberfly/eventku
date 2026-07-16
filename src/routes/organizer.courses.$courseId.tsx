import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/organizer/courses/$courseId')({
  component: OrganizerCourseLayout,
})

function OrganizerCourseLayout() {
  return <Outlet />
}
