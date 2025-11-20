import { vi } from 'vitest'
// Mock useAuth so the LoginForm snapshot doesn't require the real provider
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ login: () => Promise.resolve(), logout: () => {}, user: null, isAuthenticated: false })
}))

import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginForm from '../../src/components/FormLogin'

describe('FormLogin snapshot', () => {
  it('matches snapshot', () => {
    const { container } = render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    )
    expect(container).toMatchSnapshot()
  })
})
