import { vi } from 'vitest'
// Mock useCart hook to avoid needing the real provider
vi.mock('../../src/context/CartContext', () => ({
  useCart: () => ({ setCartOpen: () => {}, cartCount: 0 })
}))

import React from 'react'
import { render } from '@testing-library/react'
import FloatingCartButton from '../../src/components/FloatingCartButton'

describe('FloatingCartButton', () => {
  it('muestra el boton flotante', () => {
    const { container } = render(<FloatingCartButton />)
    const btn = container.querySelector('button')
    expect(btn).toBeTruthy()
  })
})
