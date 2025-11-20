import { vi } from 'vitest'
// mock useAuth for login spy (use .jsx path so resolver finds file)
const loginSpy = vi.fn(() => Promise.resolve())
vi.mock('../../src/context/AuthContext.jsx', () => ({ useAuth: () => ({ login: loginSpy, logout: () => {}, user: null, isAuthenticated: false }) }))

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginForm from '../../src/components/FormLogin'

// allow mocking navigate for success path
const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

describe('LoginForm behavior', () => {
  beforeEach(() => {
    loginSpy.mockClear()
  })

  it('toggles password visibility when clicking eye button', () => {
    const { getByPlaceholderText, getByRole } = render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    )
    const pwdInput = getByPlaceholderText(/contraseña/i)
    const toggle = getByRole('button', { name: /Mostrar contraseña|Ocultar contraseña/i })
    // initial type password
    expect(pwdInput.getAttribute('type')).toBe('password')
    fireEvent.click(toggle)
    expect(pwdInput.getAttribute('type')).toBe('text')
    fireEvent.click(toggle)
    expect(pwdInput.getAttribute('type')).toBe('password')
  })

  it('calls login with email and password when form is submitted', async () => {
    // re-render wrapped in MemoryRouter so navigate works
    const { getByLabelText, getByPlaceholderText, getByRole } = render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    )

    fireEvent.change(getByLabelText(/Correo Electrónico/i), { target: { value: 'test@x.com' } })
    fireEvent.change(getByPlaceholderText(/contraseña/i), { target: { value: 'mypassword' } })

    fireEvent.click(getByRole('button', { name: /Iniciar Sesión/i }))
    await waitFor(() => expect(loginSpy).toHaveBeenCalledWith('test@x.com', 'mypassword'))
  })

  it('navigates to / on successful login', async () => {
    loginSpy.mockImplementationOnce(() => Promise.resolve())
    const { getByLabelText, getByPlaceholderText, getByRole } = render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    )

    fireEvent.change(getByLabelText(/Correo Electrónico/i), { target: { value: 'ok@x.com' } })
    fireEvent.change(getByPlaceholderText(/contraseña/i), { target: { value: 'okpass' } })
    fireEvent.click(getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => expect(loginSpy).toHaveBeenCalled())
    expect(navigateMock).toHaveBeenCalledWith('/')
  })

  it('shows error when login rejects', async () => {
    loginSpy.mockImplementationOnce(() => Promise.reject(new Error('bad creds')))
    const { getByLabelText, getByPlaceholderText, getByRole, findByText } = render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    )

    fireEvent.change(getByLabelText(/Correo Electrónico/i), { target: { value: 'bad@x.com' } })
    fireEvent.change(getByPlaceholderText(/contraseña/i), { target: { value: 'bad' } })
    fireEvent.click(getByRole('button', { name: /Iniciar Sesión/i }))

    expect(await findByText(/bad creds/i)).toBeTruthy()
  })
})
