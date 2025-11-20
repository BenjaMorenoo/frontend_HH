import { vi } from 'vitest'
// mock useCart with a spy for setCartOpen (use .jsx path so tests resolve)
let setCartOpenSpy = vi.fn()
let mockUseCart = () => ({ setCartOpen: setCartOpenSpy, cartCount: 5 })
vi.mock('../../src/context/CartContext.jsx', () => ({ useCart: () => mockUseCart() }))

import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import FloatingCartButton from '../../src/components/FloatingCartButton'

describe('FloatingCartButton behavior', () => {
  beforeEach(() => {
    setCartOpenSpy = vi.fn()
    // update factory to return new spy
    mockUseCart = () => ({ setCartOpen: setCartOpenSpy, cartCount: 5 })
  })

  it('shows badge when cartCount > 0 and calls setCartOpen on click', () => {
    const { container, getByRole } = render(<FloatingCartButton />)
    const badge = container.querySelector('span.absolute')
    expect(badge).toBeTruthy()
    expect(badge.textContent).toBe('5')

    fireEvent.click(getByRole('button'))
    expect(setCartOpenSpy).toHaveBeenCalledWith(true)
  })
})
