import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SignUp } from "./sign-up";

// Mock the auth client
vi.mock("@/lib/auth-client", () => ({
    signUp: {
        email: vi.fn(),
    },
}));

import { signUp } from "@/lib/auth-client";

describe("SignUp", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows error when passwords do not match", async () => {
        render(<SignUp />);

        const nameInput = screen.getByLabelText(/name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole("button", { name: /create account/i });

        fireEvent.change(nameInput, { target: { value: "Test User" } });
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.change(confirmInput, { target: { value: "differentpassword" } });
        fireEvent.click(submitButton);

        // Should show password mismatch error
        expect(await screen.findByText(/passwords do not match/i)).toBeTruthy();
        // Should NOT call the API
        expect(signUp.email).not.toHaveBeenCalled();
    });

    it("shows error when password is too short", async () => {
        render(<SignUp />);

        const nameInput = screen.getByLabelText(/name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole("button", { name: /create account/i });

        fireEvent.change(nameInput, { target: { value: "Test User" } });
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "short" } });
        fireEvent.change(confirmInput, { target: { value: "short" } });
        fireEvent.click(submitButton);

        // Should show password length error
        expect(await screen.findByText(/at least 8 characters/i)).toBeTruthy();
        // Should NOT call the API
        expect(signUp.email).not.toHaveBeenCalled();
    });

    it("calls signUp.email when form is valid", async () => {
        vi.mocked(signUp.email).mockResolvedValue({ data: { user: {} }, error: null } as never);

        render(<SignUp />);

        const nameInput = screen.getByLabelText(/name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole("button", { name: /create account/i });

        fireEvent.change(nameInput, { target: { value: "Test User" } });
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "validpassword123" } });
        fireEvent.change(confirmInput, { target: { value: "validpassword123" } });
        fireEvent.click(submitButton);

        // Should call the API with correct data
        expect(signUp.email).toHaveBeenCalledWith({
            email: "test@example.com",
            password: "validpassword123",
            name: "Test User",
        });
    });
});
