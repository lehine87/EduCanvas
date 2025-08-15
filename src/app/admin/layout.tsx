'use client'

import { AdminLayout as LegacyAdminLayout } from '@/components/layout/AdminLayout'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LegacyAdminLayout>
      {children}
    </LegacyAdminLayout>
  )
}