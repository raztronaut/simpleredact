import { useState } from "react";
import { SignIn } from "./sign-in";
import { SignUp } from "./sign-up";

interface AuthModalProps {
    onSuccess?: () => void;
    onClose?: () => void;
}

export function AuthModal({ onSuccess, onClose }: AuthModalProps) {
    const [mode, setMode] = useState<"signin" | "signup">("signin");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute -top-12 right-0 text-stone-400 hover:text-white transition-colors"
                    >
                        Close
                    </button>
                )}
                {mode === "signin" ? (
                    <SignIn
                        onSuccess={onSuccess}
                        onSwitchToSignUp={() => setMode("signup")}
                    />
                ) : (
                    <SignUp
                        onSuccess={onSuccess}
                        onSwitchToSignIn={() => setMode("signin")}
                    />
                )}
            </div>
        </div>
    );
}
