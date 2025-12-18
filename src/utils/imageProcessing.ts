/**
 * Generates a pixelated version of the image source.
 * @param imageSrc The source URL of the image
 * @param pixelFactor The factor to downscale (0-1). Smaller = more pixelated.
 */
export const generatePixelatedVersion = (
    imageSrc: string,
    pixelFactor: number = 0.05
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = imageSrc

        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            if (!ctx) {
                reject(new Error('Could not get canvas context'))
                return
            }

            const w = img.width
            const h = img.height

            // 1. Downscale
            const smallW = Math.max(1, Math.floor(w * pixelFactor))
            const smallH = Math.max(1, Math.floor(h * pixelFactor))

            canvas.width = smallW
            canvas.height = smallH

            // Draw small
            ctx.drawImage(img, 0, 0, smallW, smallH)

            // 2. Upscale
            const finalCanvas = document.createElement('canvas')
            const finalCtx = finalCanvas.getContext('2d')

            if (!finalCtx) {
                reject(new Error('Could not get final canvas context'))
                return
            }

            finalCanvas.width = w
            finalCanvas.height = h

            // Important: Disable smoothing for that crisp pixel look
            finalCtx.imageSmoothingEnabled = false
            finalCtx.drawImage(canvas, 0, 0, smallW, smallH, 0, 0, w, h)

            resolve(finalCanvas.toDataURL())
        }

        img.onerror = (err) => reject(err)
    })
}
