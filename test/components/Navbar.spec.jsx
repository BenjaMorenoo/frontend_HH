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

describe('Navbar', () => {
  it('renderiza links principales y boton carrito', () => {
    const { getAllByText } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )
    const inicios = getAllByText('Inicio')
    expect(inicios.length).toBeGreaterThan(0)
    const productos = getAllByText('Productos')
    expect(productos.length).toBeGreaterThan(0)
    const carritos = getAllByText('Carrito')
    expect(carritos.length).toBeGreaterThan(0)
  })
})
