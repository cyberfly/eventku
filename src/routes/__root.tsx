/// <reference types="vite/client" />

import type { ReactNode } from 'react'

import {
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'

import { AppShell } from '@/components/app-shell'
import '@/styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        title: 'Eventku',
      },
      {
        name: 'description',
        content: 'Eventku event marketplace built with TanStack Start, Drizzle, and SQLite.',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <AppShell />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
