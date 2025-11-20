import { vi } from 'vitest'
// Mock context hooks before importing the component
vi.mock('../../src/context/CartContext', () => ({
  useCart: () => ({ setCartOpen: () => {}, cartCount: 0 })
}))
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, logout: () => {} })
}))

import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../../src/components/Navbar'

describe('Navbar snapshot', () => {
  it('matches snapshot (desktop + mobile collapsed)', () => {
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )
    expect(container).toMatchSnapshot()
  })
})
