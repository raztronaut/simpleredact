import { TextHoverEffect } from '@/components/ui/text-hover-effect'

export const Hero = () => {
    return (
        <div className="w-full flex flex-col items-center justify-center py-0">
            <div className="w-full h-[150px] md:h-[250px] lg:h-[350px] flex items-center justify-center overflow-hidden">
                <TextHoverEffect text="SIMPLE REDACT" fontSize={120} />
            </div>
        </div>
    )
}
