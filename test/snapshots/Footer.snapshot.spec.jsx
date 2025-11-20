import React from 'react'
import { render } from '@testing-library/react'
import Footer from '../../src/components/Footer'

describe('Footer snapshot', () => {
  it('matches snapshot', () => {
    const { container } = render(<Footer />)
    expect(container).toMatchSnapshot()
  })
})
