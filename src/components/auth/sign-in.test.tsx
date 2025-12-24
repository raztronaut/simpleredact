import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SignIn } from './sign-in'

const { mockSignIn } = vi.hoisted(() => {
    return {
        mockSignIn: {
            email: vi.fn(),
            social: vi.fn()
        }
    }
})

// Mock auth client
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        signIn: mockSignIn
    },
    signIn: mockSignIn
}))

describe('SignIn', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders sign in form', () => {
        render(<SignIn />)
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    })

    it('shows validation error for empty fields', async () => {
        render(<SignIn />)

        const submitButton = screen.getByRole('button', { name: /sign in/i })
        fireEvent.click(submitButton)

        await waitFor(() => {
            // HTML5 validation might trigger browser tooltip, but checking if function was called
            expect(mockSignIn.email).not.toHaveBeenCalled()
        })
    })

    it('calls signIn.email with correct data', async () => {
        // Setup mock to return success to avoid component crash
        mockSignIn.email.mockResolvedValue({ data: {}, error: null })

        render(<SignIn />)

        const emailInput = screen.getByLabelText(/email/i)
        const passwordInput = screen.getByLabelText(/password/i)

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })

        const form = emailInput.closest('form')
        if (form) fireEvent.submit(form)

        await waitFor(() => {
            expect(mockSignIn.email).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            })
        })
    })

    it('handles error response', async () => {
        mockSignIn.email.mockResolvedValueOnce({
            error: { message: 'Invalid credentials' }
        })

        render(<SignIn />)

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'test@example.com' }
        })
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'wrongpass' }
        })

        fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
        })
    })
})
