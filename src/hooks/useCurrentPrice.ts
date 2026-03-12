import { useState, useEffect } from 'react'
import { getCurrentPrice } from '@/lib/supabase/queries/landing'

type PriceState = {
  price: number | null
  loading: boolean
}

export function useCurrentPrice(): PriceState {
  const [state, setState] = useState<PriceState>({ price: null, loading: true })

  useEffect(() => {
    getCurrentPrice()
      .then(price => setState({ price, loading: false }))
      .catch(() => setState({ price: null, loading: false }))
  }, [])

  return state
}
