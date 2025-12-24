import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserMenu } from "./user-menu";

// Mock the auth client
vi.mock("@/lib/auth-client", () => ({
    useSession: vi.fn(),
    signOut: vi.fn(),
}));

import { useSession } from "@/lib/auth-client";

describe("UserMenu", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows loading spinner when session is pending", () => {
        vi.mocked(useSession).mockReturnValue({
            data: null,
            isPending: true,
            error: null,
        } as ReturnType<typeof useSession>);

        render(<UserMenu />);

        // Should show spinner (Loader2 has animate-spin class)
        const spinner = document.querySelector(".animate-spin");
        expect(spinner).toBeTruthy();
    });

    it("shows Sign In button when not logged in", () => {
        vi.mocked(useSession).mockReturnValue({
            data: null,
            isPending: false,
            error: null,
        } as ReturnType<typeof useSession>);

        render(<UserMenu />);

        expect(screen.getByRole("button", { name: /sign in/i })).toBeTruthy();
    });

    it("shows user initials when logged in", () => {
        vi.mocked(useSession).mockReturnValue({
            data: {
                user: {
                    id: "1",
                    name: "John Doe",
                    email: "john@example.com",
                    emailVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                session: {
                    id: "s1",
                    userId: "1",
                    token: "token",
                    expiresAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            },
            isPending: false,
            error: null,
        } as ReturnType<typeof useSession>);

        render(<UserMenu />);

        // Should show initials "JD" for "John Doe"
        expect(screen.getByText("JD")).toBeTruthy();
    });

    it("shows email initial when name is not available", () => {
        vi.mocked(useSession).mockReturnValue({
            data: {
                user: {
                    id: "1",
                    name: "",
                    email: "test@example.com",
                    emailVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                session: {
                    id: "s1",
                    userId: "1",
                    token: "token",
                    expiresAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            },
            isPending: false,
            error: null,
        } as ReturnType<typeof useSession>);

        render(<UserMenu />);

        // Should show "T" for "test@example.com"
        expect(screen.getByText("T")).toBeTruthy();
    });
});
