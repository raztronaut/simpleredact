import { useState, useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform, useAnimationFrame } from "framer-motion"

function RedactionDemo() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-3 p-4 select-none">
            <div className="relative inline-block">
                <span className="font-serif text-2xl text-foreground opacity-20 italic">
                    Confidential
                </span>
                <motion.div
                    className="absolute h-[1.1em] top-1/2 -translate-y-1/2 left-0 right-0 bg-foreground rounded-sm shadow-lg will-change-transform"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{
                        scaleX: [0, 1, 1, 0],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        times: [0, 0.3, 0.7, 1],
                        ease: "easeInOut"
                    }}
                />
            </div>
            <div className="relative inline-block">
                <span className="font-serif text-lg text-foreground opacity-20">
                    Personal Data
                </span>
                <motion.div
                    className="absolute h-[1.1em] top-1/2 -translate-y-1/2 left-0 right-0 bg-foreground rounded-sm shadow-lg will-change-transform"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{
                        scaleX: [0, 0, 1, 1, 0],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        times: [0, 0.4, 0.6, 0.8, 1],
                        ease: "easeInOut"
                    }}
                />
            </div>
        </div>
    )
}

function DetectionDemo() {
    return (
        <div className="h-full w-full p-4 flex items-center justify-center relative overflow-hidden group">
            <div className="grid grid-cols-2 gap-2 w-full max-w-[100px] relative">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-foreground/5 rounded-md border border-foreground/10 relative overflow-hidden">
                        <motion.div
                            className="absolute inset-0 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-md will-change-transform"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                                scale: [0.8, 1.05, 1],
                                opacity: [0, 1, 0.3],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.4,
                                repeatType: "reverse",
                                ease: "easeInOut"
                            }}
                        />
                    </div>
                ))}
            </div>
            {/* Scanning Line */}
            <motion.div
                className="absolute left-6 right-6 h-[2px] bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)] will-change-[top]"
                animate={{ top: ["20%", "80%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
        </div>
    )
}

function PerformanceDemo() {
    const [count, setCount] = useState(0)
    const lastUpdate = useRef(0)

    useAnimationFrame((time) => {
        // Update roughly every 30ms but synced to frames
        if (time - lastUpdate.current > 30) {
            setCount((prev) => (prev + 1) % 101)
            lastUpdate.current = time
        }
    })

    return (
        <div className="flex flex-col items-center justify-center h-full gap-3 relative">
            <div className="relative">
                <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                        cx="40"
                        cy="40"
                        r="35"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="transparent"
                        className="text-foreground/10"
                    />
                    <motion.circle
                        cx="40"
                        cy="40"
                        r="35"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="transparent"
                        strokeDasharray="219.91"
                        initial={{ strokeDashoffset: 219.91 }}
                        animate={{ strokeDashoffset: 219.91 - (219.91 * count) / 100 }}
                        transition={{ type: "tween", duration: 0.1 }}
                        className="text-emerald-500 will-change-[stroke-dashoffset]"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-mono font-bold">{count}ms</span>
                    <span className="text-[7px] uppercase tracking-tighter text-muted-foreground font-semibold">LATENCY</span>
                </div>
            </div>
        </div>
    )
}

function FeatureCard({ children, title, description, delay = 0 }: {
    children: React.ReactNode,
    title: string,
    description: string,
    delay?: number
}) {
    const cardRef = useRef<HTMLDivElement>(null)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const springX = useSpring(mouseX, { stiffness: 500, damping: 50 })
    const springY = useSpring(mouseY, { stiffness: 500, damping: 50 })

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        mouseX.set(e.clientX - rect.left)
        mouseY.set(e.clientY - rect.top)
    }

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className="group relative bg-stone-900/50 border border-stone-800 rounded-2xl p-5 min-h-[240px] flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{
                duration: 0.6,
                delay,
                ease: [0.23, 1, 0.32, 1]
            }}
            whileHover={{ y: -5 }}
        >
            {/* Spotlight Background */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: useTransform(
                        [springX, springY],
                        ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, rgba(255,255,255,0.04), transparent 40%)`
                    )
                }}
            />

            <div className="flex-1 relative z-10 flex items-center justify-center">
                {children}
            </div>
            <div className="mt-4 relative z-10">
                <h3 className="font-serif text-lg text-foreground tracking-tight">{title}</h3>
                <p className="text-stone-400 text-xs mt-1 leading-relaxed">{description}</p>
            </div>
        </motion.div>
    )
}

export function FeaturesSection() {
    return (
        <section className="px-6 py-24 w-full relative">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    className="flex flex-col items-center mb-16 space-y-4"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <span className="text-emerald-500 text-xs font-bold uppercase tracking-[0.2em]">Technology</span>
                    <h2 className="text-4xl md:text-5xl font-serif text-center">Built for Privacy</h2>
                    <p className="text-stone-400 text-lg md:text-xl font-medium tracking-tight text-center max-w-2xl px-4">
                        The simplest way to redact sensitive information from your images.
                        100% client-side. 100% private.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        title="Client-Side Privacy"
                        description="Your data never leaves your device. All processing happens locally in your browser."
                        delay={0.1}
                    >
                        <RedactionDemo />
                    </FeatureCard>

                    <FeatureCard
                        title="Smart Detection"
                        description="Advanced AI that understands document structure to find sensitive information instantly."
                        delay={0.2}
                    >
                        <DetectionDemo />
                    </FeatureCard>

                    <FeatureCard
                        title="Zero Latency"
                        description="Local processing means instant results without wait times or server roundtrips."
                        delay={0.3}
                    >
                        <PerformanceDemo />
                    </FeatureCard>
                </div>
            </div>
        </section>
    )
}
