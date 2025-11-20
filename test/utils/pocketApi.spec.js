import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We'll import the module after setting up globals so module-level BASE uses default
import * as pocketApi from '../../src/utils/pocketApi'

describe('pocketApi logic tests', () => {
  let originalFetch
  beforeEach(() => {
    originalFetch = global.fetch
    // simple in-memory mock for localStorage
    const store = {}
    vi.stubGlobal('localStorage', {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v) },
      removeItem: (k) => { delete store[k] },
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('fileUrl returns empty string when filename empty', () => {
    expect(pocketApi.fileUrl('products', '123', '')).toBe('')
  })

  it('fileUrl returns full url when filename already url', () => {
    const url = 'https://example.com/img.png'
    expect(pocketApi.fileUrl('products', '123', url)).toBe(url)
  })

  it('fileUrl builds a files url for relative filename', () => {
    const res = pocketApi.fileUrl('products', 'abc', 'photo.jpg')
    expect(res).toContain('/api/files/products/abc/photo.jpg')
  })

  it('request throws hint on 404 with missing collection message', async () => {
    // mock fetch to return 404 and JSON body with that message
    global.fetch = vi.fn(() => Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve(JSON.stringify({ message: 'Missing or invalid collection context' })),
    }))

    await expect(pocketApi.getRecords('unknown')).rejects.toThrow(/Missing or invalid collection context/)
    await expect(pocketApi.getRecords('unknown')).rejects.toThrow(/Hint:/)
  })

  it('createRecordForm throws with field errors included in message when server returns 400 with data', async () => {
    const body = { field: 'value' }
    global.fetch = vi.fn(() => Promise.resolve({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: () => Promise.resolve(JSON.stringify({ message: 'Failed to create', data: { field: ['required'] } })),
    }))

    await expect(pocketApi.createRecordForm('products', new FormData())).rejects.toThrow(/Field errors/)
  })

  it('logout clears pb_token and pb_user from localStorage', () => {
    localStorage.setItem('pb_token', 't')
    localStorage.setItem('pb_user', JSON.stringify({ id: 1 }))
    pocketApi.logout()
    expect(localStorage.getItem('pb_token')).toBeNull()
    expect(localStorage.getItem('pb_user')).toBeNull()
  })

  it('request returns parsed JSON on success', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(JSON.stringify({ hello: 'world' })),
    }))

    const res = await pocketApi.getRecords('products')
    expect(res).toEqual({ hello: 'world' })
  })

  it('request returns empty object for empty body (DELETE)', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(''),
    }))

    const res = await pocketApi.deleteRecord('products', '123')
    expect(res).toEqual({})
  })

  it('createRecordForm returns parsed body on success', async () => {
    const fake = { id: 1 }
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      status: 201,
      statusText: 'Created',
      text: () => Promise.resolve(JSON.stringify(fake)),
    }))

    const out = await pocketApi.createRecordForm('products', new FormData())
    expect(out).toEqual(fake)
  })

  it('updateRecordForm returns parsed body on success and throws on error', async () => {
    // success
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200, statusText: 'OK', text: () => Promise.resolve(JSON.stringify({ ok: true })) }))
    const ok = await pocketApi.updateRecordForm('products', '1', new FormData())
    expect(ok).toEqual({ ok: true })

    // error
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 500, statusText: 'Err', text: () => Promise.resolve('server error') }))
    await expect(pocketApi.updateRecordForm('products', '1', new FormData())).rejects.toThrow(/500 Err - server error/)
  })

  it('authWithPassword stores token and user in localStorage when token present', async () => {
    const resp = { token: 'tok', record: { id: 5, email: 'a@b' } }
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200, statusText: 'OK', text: () => Promise.resolve(JSON.stringify(resp)) }))
    const out = await pocketApi.authWithPassword('a@b', 'pw')
    expect(out).toEqual(resp)
    expect(localStorage.getItem('pb_token')).toBe('tok')
    expect(JSON.parse(localStorage.getItem('pb_user'))).toEqual(resp.record)
  })

  it('registerUser formats fields and calls createRecord', async () => {
    // capture the body sent to fetch when creating a user
    let lastBody = null
    global.fetch = vi.fn((url, opts) => {
      lastBody = opts && opts.body
      return Promise.resolve({ ok: true, status: 201, statusText: 'Created', text: () => Promise.resolve(JSON.stringify({ id: 'u1' })) })
    })

    const created = await pocketApi.registerUser({ primer_nombre: 'P', segundo_nombre: 'S', primer_apellido: 'A', segundo_apellido: 'B', email: 'e@x', password: 'p', passwordConfirm: 'p', phone: '123', address: 'addr' })
    expect(created).toEqual({ id: 'u1' })
    // verify the body was JSON stringified and includes our fields
    const parsed = JSON.parse(lastBody)
    expect(parsed.email).toBe('e@x')
    expect(parsed.primer_nombre).toBe('P')
    expect(parsed.phone).toBe('123')
  })

  it('request throws with plain text body (non-JSON) without hint', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve('not json body'),
    }))

    await expect(pocketApi.getRecords('whatever')).rejects.toThrow(/404 Not Found - not json body/)
    await expect(pocketApi.getRecords('whatever')).rejects.not.toThrow(/Hint:/)
  })

  it('createRecordForm throws with parsed message but no field errors', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: () => Promise.resolve(JSON.stringify({ message: 'Generic failure' })),
    }))

    await expect(pocketApi.createRecordForm('products', new FormData())).rejects.toThrow(/Generic failure/)
    await expect(pocketApi.createRecordForm('products', new FormData())).rejects.not.toThrow(/Field errors/)
  })

  it('authWithPassword handles localStorage.setItem throwing gracefully', async () => {
    const resp = { token: 't2', record: { id: 7 } }
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200, statusText: 'OK', text: () => Promise.resolve(JSON.stringify(resp)) }))
    // make setItem throw to hit the catch block
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('quota') },
      removeItem: () => {},
    })

    const out = await pocketApi.authWithPassword('x', 'y')
    expect(out).toEqual(resp)
    // token not stored because setItem threw
    expect(localStorage.getItem('pb_token')).toBeNull()
  })

  it('registerUser with minimal fields calls createRecord', async () => {
    let lastBody = null
    global.fetch = vi.fn((url, opts) => {
      lastBody = opts && opts.body
      return Promise.resolve({ ok: true, status: 201, statusText: 'Created', text: () => Promise.resolve(JSON.stringify({ id: 'u2' })) })
    })

    const created = await pocketApi.registerUser({ email: 'min@x', password: 'p', passwordConfirm: 'p' })
    expect(created).toEqual({ id: 'u2' })
    const parsed = JSON.parse(lastBody)
    expect(parsed.email).toBe('min@x')
    expect(parsed.primer_nombre).toBeUndefined()
  })
})
