import { vi } from 'vitest'
// prepare mocks for contexts
vi.mock('../../src/context/CartContext.jsx', () => ({ useCart: () => ({ setCartOpen: vi.fn(), cartCount: 2 }) }))

// We'll mock react-router-dom useNavigate to capture navigation calls
const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock, useLocation: () => ({ pathname: '/' }), useSearchParams: () => [new URLSearchParams(), () => {}] }
})

// mock auth separately in tests where needed - use a mutable factory so tests can change it
let mockUseAuth = () => ({ user: null, isAuthenticated: false, logout: vi.fn() })
vi.mock('../../src/context/AuthContext.jsx', () => ({ useAuth: () => mockUseAuth() }))

import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../../src/components/Navbar'

describe('Navbar behavior', () => {
  it('shows Admin link when user.role is boolean true', () => {
    mockUseAuth = () => ({ user: { role: true, primer_nombre: 'Admin' }, isAuthenticated: true, logout: vi.fn() })
    const { getAllByText } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )
    const adminLinks = getAllByText('Admin')
    expect(adminLinks.length).toBeGreaterThan(0)
  })

  it('toggles mobile menu when burger clicked', () => {
    mockUseAuth = () => ({ user: null, isAuthenticated: false, logout: vi.fn() })
    const { getByLabelText, container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )
    const burger = getByLabelText(/Abrir menú/i)
    // initially mobile menu hidden (has class hidden)
    expect(container.querySelector('div.md\\:hidden')).toBeTruthy()
    fireEvent.click(burger)
    // after click, mobile panel should be block (class changed) - look for panel content
    const panel = container.querySelector('div.pb-4')
    expect(panel).toBeTruthy()
  })

  it('navigates to products with query on search submit', () => {
    mockUseAuth = () => ({ user: null, isAuthenticated: false, logout: vi.fn() })
    const { getAllByPlaceholderText, container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )
    const inputs = getAllByPlaceholderText('Buscar Producto')
    const input = inputs[0]
    fireEvent.change(input, { target: { value: 'lechuga' } })
    const form = container.querySelector('form')
    expect(form).toBeTruthy()
    fireEvent.submit(form)
    expect(navigateMock).toHaveBeenCalled()
  })

  it('navigates to /products when search is empty', () => {
    mockUseAuth = () => ({ user: null, isAuthenticated: false, logout: vi.fn() })
    navigateMock.mockClear()
    const { getAllByPlaceholderText, container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )
    const inputs = getAllByPlaceholderText('Buscar Producto')
    const input = inputs[0]
    // ensure input is empty
    fireEvent.change(input, { target: { value: '' } })
    const form = container.querySelector('form')
    fireEvent.submit(form)
    expect(navigateMock).toHaveBeenCalledWith('/products')
  })

  it('shows Admin link when user has role string "admin" and when user.isAdmin true', () => {
    // role as string
    mockUseAuth = () => ({ user: { role: 'admin' }, isAuthenticated: true, logout: vi.fn() })
    const { getAllByText, rerender } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )
    expect(getAllByText('Admin').length).toBeGreaterThan(0)

    // isAdmin true shape
    mockUseAuth = () => ({ user: { isAdmin: true }, isAuthenticated: true, logout: vi.fn() })
    rerender(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )
    expect(getAllByText('Admin').length).toBeGreaterThan(0)
  })
})
