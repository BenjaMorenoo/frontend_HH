import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from '../../src/components/Footer'

describe('Footer logo', () => {
  it('renderiza una imagen con alt', () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    )
    const img = container.querySelector('img[alt]')
    expect(img).toBeTruthy()
    expect(img.getAttribute('alt')).toBeTruthy()
  })
})
