import { vi } from 'vitest'
// Mock useAuth so the LoginForm doesn't require the real provider
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ login: () => Promise.resolve(), logout: () => {}, user: null, isAuthenticated: false })
}))

import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginForm from '../../src/components/FormLogin'

describe('LoginForm', () => {
  it('muestra error de validacion al enviar vacio', () => {
    const { getByRole, getByText } = render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    )

    const submit = getByRole('button', { name: /Iniciar Sesión/i })
    fireEvent.click(submit)
    expect(getByText(/Por favor completa todos los campos/i)).toBeTruthy()
  })
})
