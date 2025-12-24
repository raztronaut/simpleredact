import { useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { AuthModal } from "./auth-modal";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Loader2 } from "lucide-react";

export function UserMenu() {
    const { data: session, isPending } = useSession();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
        } finally {
            setIsSigningOut(false);
        }
    };

    // Loading state
    if (isPending) {
        return (
            <div className="h-9 w-9 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
            </div>
        );
    }

    // Not logged in
    if (!session?.user) {
        return (
            <>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAuthModal(true)}
                    className="border-stone-700 hover:bg-stone-800 text-stone-200 hover:text-white"
                >
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                </Button>
                {showAuthModal && (
                    <AuthModal
                        onSuccess={() => setShowAuthModal(false)}
                        onClose={() => setShowAuthModal(false)}
                    />
                )}
            </>
        );
    }

    // Logged in
    const initials = session.user.name
        ? session.user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : session.user.email?.charAt(0).toUpperCase() || "U";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-9 w-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm p-0"
                >
                    {session.user.image ? (
                        <img
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            className="h-9 w-9 rounded-full object-cover"
                        />
                    ) : (
                        initials
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-56 bg-stone-900 border-stone-800"
            >
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium text-white">
                            {session.user.name || "User"}
                        </p>
                        <p className="text-xs text-stone-400 truncate">
                            {session.user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-stone-800" />
                <DropdownMenuItem
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="text-stone-300 focus:text-white focus:bg-stone-800 cursor-pointer"
                >
                    {isSigningOut ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <LogOut className="h-4 w-4 mr-2" />
                    )}
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
