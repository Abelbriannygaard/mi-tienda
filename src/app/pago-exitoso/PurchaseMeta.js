'use client'
import { useEffect } from 'react'
import { track } from '@/lib/fbq'

export default function PurchaseMeta({ pedidoId, value, contents }) {
  useEffect(() => {
    if (!pedidoId || !value) return
    const key = `purchase_${pedidoId}`
    try {
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, '1')
    } catch {}
    track(
      'Purchase',
      { value, currency: 'ARS', content_type: 'product', contents },
      key
    )
  }, [])
  return null
}