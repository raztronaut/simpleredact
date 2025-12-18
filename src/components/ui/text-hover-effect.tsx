import { useRef, useState, useEffect } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { aiService } from '@/lib/aiService'

export const TextHoverEffect = ({
    text,
    duration,
    fontSize = 56,
}: {
    text: string
    duration?: number
    fontSize?: number
}) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const maskGradientRef = useRef<SVGRadialGradientElement>(null)
    const animatedTextRef = useRef(null)
    const [hovered, setHovered] = useState(false)
    const breathingTimeline = useRef<gsap.core.Timeline | null>(null)

    // 1. Initial Drawing Animation
    useGSAP(
        () => {
            gsap.fromTo(
                animatedTextRef.current,
                { strokeDashoffset: 1000, strokeDasharray: 1000 },
                {
                    strokeDashoffset: 0,
                    strokeDasharray: 1000,
                    duration: 4,
                    ease: "power2.inOut",
                    force3D: true,
                }
            );
        },
        { scope: svgRef }
    );

    // 2. Persistent Breathing Timeline
    useGSAP(
        () => {
            if (!maskGradientRef.current) return;

            // Create a timeline that breathes subtly
            const tl = gsap.timeline({ repeat: -1, yoyo: true });
            tl.to(maskGradientRef.current, {
                attr: { cx: "30%", cy: "30%" },
                duration: 5,
                ease: "sine.inOut"
            }).to(maskGradientRef.current, {
                attr: { cx: "70%", cy: "70%" },
                duration: 5,
                ease: "sine.inOut"
            });

            breathingTimeline.current = tl;

            // If we start hovered, pause immediately
            if (hovered) tl.pause();

            return () => tl.kill();
        },
        { scope: svgRef }
    );

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!svgRef.current || !maskGradientRef.current) return;

            const rect = svgRef.current.getBoundingClientRect()
            const isInside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom

            // Update React state for styling (like opacity/gradient stops)
            if (isInside !== hovered) {
                setHovered(isInside);
            }

            if (isInside) {
                // Pause breathing and follow mouse
                if (breathingTimeline.current && !breathingTimeline.current.paused()) {
                    breathingTimeline.current.pause();
                }

                const cxPercentage = ((e.clientX - rect.left) / rect.width) * 100
                const cyPercentage = ((e.clientY - rect.top) / rect.height) * 100

                gsap.to(maskGradientRef.current, {
                    attr: { cx: `${cxPercentage}%`, cy: `${cyPercentage}%` },
                    duration: duration ?? 0.3,
                    ease: "power2.out",
                    overwrite: "auto"
                });
            } else {
                // Resume breathing when mouse leaves
                // But first, smoothly transition back to whatever the current breathing position IS
                if (breathingTimeline.current && breathingTimeline.current.paused()) {
                    // We don't just resume, we let the timeline take over after a brief snap-back
                    gsap.to(maskGradientRef.current, {
                        attr: {
                            cx: gsap.getProperty(maskGradientRef.current, "cx"),
                            cy: gsap.getProperty(maskGradientRef.current, "cy")
                        },
                        duration: 0.5,
                        onComplete: () => {
                            breathingTimeline.current?.resume();
                        }
                    });
                }
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [hovered, duration])

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            setHovered(true);
            if (breathingTimeline.current) breathingTimeline.current.pause();
        };
        const handleTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            setHovered(false);
            if (breathingTimeline.current) breathingTimeline.current.resume();
        };

        svg.addEventListener('touchstart', handleTouchStart, { passive: false });
        svg.addEventListener('touchend', handleTouchEnd, { passive: false });
        svg.addEventListener('touchcancel', handleTouchEnd, { passive: false });

        return () => {
            svg.removeEventListener('touchstart', handleTouchStart);
            svg.removeEventListener('touchend', handleTouchEnd);
            svg.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, []);

    return (
        <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox="0 0 1000 100"
            xmlns="http://www.w3.org/2000/svg"
            className="select-none"
        >
            <defs>
                <linearGradient
                    id="textGradient"
                    gradientUnits="userSpaceOnUse"
                    cx="50%"
                    cy="50%"
                    r="20%"
                >
                    {hovered && (
                        <>
                            <stop offset="0%" stopColor="#eab308" />
                            <stop offset="25%" stopColor="#ef4444" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="75%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </>
                    )}
                </linearGradient>
                <radialGradient
                    id="revealMask"
                    ref={maskGradientRef}
                    gradientUnits="userSpaceOnUse"
                    r="25%"
                    cx="50%"
                    cy="50%"
                >
                    <stop offset="0%" stopColor="white" />
                    <stop offset="100%" stopColor="black" />
                </radialGradient>
                <mask id="textMask">
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="url(#revealMask)"
                    />
                </mask>
            </defs>

            {[0, 1, 2].map((_, idx) => (
                <text
                    key={idx}
                    ref={idx === 1 ? animatedTextRef : undefined}
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`fill-transparent font-[helvetica] font-bold pointer-events-none ${idx === 0
                        ? "stroke-neutral-200 dark:stroke-neutral-800"
                        : idx === 1
                            ? "stroke-neutral-200 dark:stroke-neutral-800"
                            : ""
                        }`}
                    stroke={idx === 2 ? "url(#textGradient)" : undefined}
                    mask={idx === 2 ? "url(#textMask)" : undefined}
                    style={{
                        fontSize,
                        opacity: idx === 0 && !hovered ? (aiService.isMobile() ? 1.0 : 0) : idx === 0 ? 0.7 : 1,
                        strokeWidth: aiService.isMobile() ? 2.5 : 0.3
                    }}
                >
                    {text}
                </text>
            ))}
        </svg>
    )
}
