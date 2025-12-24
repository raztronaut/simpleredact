import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { presetsRouter } from './presets'
import { db } from '../db'
import { auth } from '../auth'

// Mock db and auth
vi.mock('../db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
    }
}))

vi.mock('../auth', () => ({
    auth: {
        api: {
            getSession: vi.fn()
        }
    }
}))

describe('Presets API', () => {
    const mockUser = { id: 'user-123' }

    // reset mocks
    beforeEach(() => {
        vi.clearAllMocks();
        // Default authorized
        (auth.api.getSession as unknown as Mock).mockResolvedValue({ user: mockUser })
    })

    describe('GET /', () => {
        it('returns 401 if not authorized', async () => {
            (auth.api.getSession as unknown as Mock).mockResolvedValue(null)

            const res = await presetsRouter.request('/', {
                method: 'GET'
            })

            expect(res.status).toBe(401)
        })

        it('returns list of presets for user', async () => {
            const mockPresets = [
                { id: '1', name: 'Preset 1', categories: '["EMAIL"]', userId: mockUser.id }
            ]
                ; (db.select as Mock).mockReturnValue({
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(mockPresets)
                    })
                })

            const res = await presetsRouter.request('/', {
                method: 'GET'
            })

            expect(res.status).toBe(200)
            const data = await res.json()
            expect(data).toHaveLength(1)
            expect(data[0].categories).toEqual(['EMAIL'])
        })
    })

    describe('POST /', () => {
        it('creates a new preset', async () => {
            const payload = {
                name: 'My Preset',
                categories: ['EMAIL', 'PHONE']
            }

            const res = await presetsRouter.request('/', {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            })

            expect(res.status).toBe(201)
            const data = await res.json()
            expect(data.name).toBe(payload.name)
            expect(db.insert).toHaveBeenCalled()
        })

        it('validates request body', async () => {
            const res = await presetsRouter.request('/', {
                method: 'POST',
                body: JSON.stringify({ name: '' }), // Missing categories
                headers: { 'Content-Type': 'application/json' }
            })

            expect(res.status).toBe(400)
        })
    })

    describe('DELETE /:id', () => {
        it('deletes user preset', async () => {
            const res = await presetsRouter.request('/preset-123', {
                method: 'DELETE'
            })

            expect(res.status).toBe(200)
            expect(db.delete).toHaveBeenCalled()
        })
    })
})
