import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from '../../src/components/Footer'

describe('Footer', () => {
  it('muestra el año y enlaces', () => {
    const { getByText } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    )
    const year = new Date().getFullYear()
    expect(getByText((content) => content.includes(String(year)))).toBeTruthy()
  })
})
