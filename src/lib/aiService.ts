import { Florence2ForConditionalGeneration, AutoProcessor, AutoTokenizer, RawImage, env } from '@huggingface/transformers';

// Skip local checks for browser environment
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_ID = 'onnx-community/Florence-2-base-ft';

export type PIICategory = 'EMAIL' | 'PHONE' | 'CREDIT_CARD' | 'DATE' | 'LINK' | 'NAME' | 'ADDRESS' | 'PRICE' | 'DEFAULT';

export interface DetectedBox {
    label: string;
    box: [number, number, number, number]; // xmin, ymin, xmax, ymax
    score?: number;
    category?: PIICategory;
}

interface AIProcessor {
    (image: unknown, text: string): Promise<unknown>;
    post_process_generation?: (generatedText: string, task: string, imageSize: [number, number]) => unknown;
}

interface AITokenizer {
    batch_decode: (ids: unknown, options: { skip_special_tokens: boolean }) => string[];
}

interface PredictionResult {
    bboxes?: number[][];
    quad_boxes?: number[][];
    labels: string[];
}

class AIService {
    private model: Florence2ForConditionalGeneration | null = null;
    private processor: AIProcessor | null = null;
    private tokenizer: AITokenizer | null = null;
    private isLoading = false;

    // Singleton instance
    static instance = new AIService();

    async loadModel(onProgress?: (progress: number, text: string) => void) {
        if (this.model && this.processor) return;
        if (this.isLoading) return; // simple lock

        this.isLoading = true;

        // Define callback here so it's available in both try and catch blocks
        const progressCallback = (x: unknown) => {
            const info = x as { status: string, progress?: number, file: string };
            if (onProgress && info.status === 'progress') {
                // Approximate progress based on multiple file downloads
                onProgress(info.progress || 0, `Downloading ${info.file}...`);
            } else if (onProgress && info.status === 'initiate') {
                onProgress(0, `Starting download of ${info.file}...`);
            } else if (onProgress && info.status === 'done') {
                onProgress(100, `Loaded ${info.file}`);
            }
        };

        try {
            // Load processor and model in parallel
            if (onProgress) onProgress(10, 'Initializing AI models...');

            // transformers.js v3 auto-selects best backend usually.

            const [model, processor, tokenizer] = await Promise.all([
                Florence2ForConditionalGeneration.from_pretrained(MODEL_ID, {
                    dtype: 'fp32', // fp16 can be unstable on some WebGPU implementations (e.g. macOS), using fp32
                    device: 'webgpu',
                    progress_callback: progressCallback,
                }),
                AutoProcessor.from_pretrained(MODEL_ID, { progress_callback: progressCallback }),
                AutoTokenizer.from_pretrained(MODEL_ID, { progress_callback: progressCallback }),
            ]);

            this.model = model as unknown as Florence2ForConditionalGeneration;
            this.processor = processor as unknown as AIProcessor;
            this.tokenizer = tokenizer as unknown as AITokenizer;

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Failed to load AI model (WebGPU)", error);
            // Fallback to wasm if webgpu failed
            try {
                console.log("WebGPU failed, falling back to CPU/WASM...");
                if (onProgress) {
                    onProgress(0, `WebGPU error: ${errorMessage}. Falling back to CPU...`);
                }

                const [model, processor, tokenizer] = await Promise.all([
                    Florence2ForConditionalGeneration.from_pretrained(MODEL_ID, {
                        dtype: 'q8', // quantized for cpu
                        device: 'wasm',
                        progress_callback: progressCallback,
                    }),
                    AutoProcessor.from_pretrained(MODEL_ID, { progress_callback: progressCallback }),
                    AutoTokenizer.from_pretrained(MODEL_ID, { progress_callback: progressCallback }),
                ]);

                this.model = model as unknown as Florence2ForConditionalGeneration;
                this.processor = processor as unknown as AIProcessor;
                this.tokenizer = tokenizer as unknown as AITokenizer;
            } catch (fallbackError) {
                this.isLoading = false;
                throw fallbackError;
            }
        }

        this.isLoading = false;
    }

    async detectPII(imageSource: string | Blob): Promise<DetectedBox[]> {
        if (!this.model || !this.processor) {
            throw new Error("Model not loaded. Call loadModel() first.");
        }

        let image;
        if (typeof imageSource === 'string') {
            image = await RawImage.fromURL(imageSource);
        } else {
            image = await RawImage.fromBlob(imageSource);
        }

        // Florence-2 Task: <OCR_WITH_REGION>
        const task = '<OCR_WITH_REGION>';
        const text = task;

        // Prepare inputs
        // Use unified processor call to ensure correct prompt formatting and special tokens
        const inputs = await this.processor(image, text);

        // Generate
        const generatedIds = await (this.model as unknown as { generate: (options: object) => Promise<unknown[]> }).generate({
            ...(inputs as object),
            max_new_tokens: 1024,
            do_sample: false, // deterministic
        });

        // Decode
        if (!this.tokenizer) {
            throw new Error("Tokenizer not loaded");
        }
        const generatedText = this.tokenizer.batch_decode(generatedIds, { skip_special_tokens: false })[0];

        // Parse Output
        let results: Record<string, unknown>;
        if (this.processor?.post_process_generation) {
            // RawImage has .width and .height, not .size
            const imageSize: [number, number] = [image.width, image.height];

            try {
                results = this.processor.post_process_generation(generatedText, task, imageSize) as Record<string, unknown>;
            } catch (e) {
                console.error("Post Process Failed:", e);
                return [];
            }
        } else {
            console.warn("No post_process_generation found on processor. returning raw?");
            return [];
        }

        const prediction = results['<OCR_WITH_REGION>'] as PredictionResult;
        if (!prediction) return [];

        const boxes: DetectedBox[] = [];
        const { bboxes, quad_boxes, labels } = prediction;

        // OCR tasks often return quad_boxes (8 coords) instead of bboxes (4 coords)
        const boxesToProcess = bboxes || quad_boxes;

        if (!boxesToProcess || !Array.isArray(boxesToProcess)) {
            console.warn("No bboxes or quad_boxes found in prediction", prediction);
            return [];
        }

        for (let i = 0; i < boxesToProcess.length; i++) {
            let box = boxesToProcess[i];

            // If it's a quad box (8 coordinates), convert to aligned bbox [xmin, ymin, xmax, ymax]
            if (box.length === 8) {
                const xs = [box[0], box[2], box[4], box[6]];
                const ys = [box[1], box[3], box[5], box[7]];
                box = [
                    Math.min(...xs),
                    Math.min(...ys),
                    Math.max(...xs),
                    Math.max(...ys)
                ];
            }

            const label = labels[i] || '';
            const category = this.categorizeText(label);

            boxes.push({
                box: box as [number, number, number, number],
                label: label,
                category: category
            });
        }

        return this.applySpatialCategorization(boxes);
    }

    private applySpatialCategorization(boxes: DetectedBox[]): DetectedBox[] {
        // Define key-value triggers
        // KEY: Regex to match the label
        // VAL: Category to assign to the neighbor
        const triggers: { pattern: RegExp, category: PIICategory }[] = [
            { pattern: /^(name|customer|cardholder|sold to|bill to|ship to)$/i, category: 'NAME' },
            { pattern: /^(address|residence|location)$/i, category: 'ADDRESS' },
            { pattern: /^(total|amount|due|balance|pay)$/i, category: 'PRICE' },
        ];

        // Clone boxes to avoid mutation issues during iteration (though we modify in place)
        // We iterate all boxes to see if they are "keys"
        for (const keyBox of boxes) {
            const label = keyBox.label.trim();

            // Find matching trigger
            const trigger = triggers.find(t => t.pattern.test(label));
            if (!trigger) continue;

            // Find closest neighbor
            // We look for boxes that are:
            // 1. To the right (same line)
            // 2. Below (next line)

            let bestCandidate: DetectedBox | null = null;
            let minDistance = Infinity;

            const [kx1, ky1, kx2, ky2] = keyBox.box;
            const keyCenterY = (ky1 + ky2) / 2;
            const keyHeight = ky2 - ky1;

            for (const candidate of boxes) {
                if (candidate === keyBox) continue;
                if (candidate.category !== 'DEFAULT') continue; // Already typed, skip (unless we want to override?)

                const [cx1, cy1, , cy2] = candidate.box;
                const candCenterY = (cy1 + cy2) / 2;

                // Check "Right" neighbor
                // Ideally roughly same Y (within half height) and to the right
                const isSameLine = Math.abs(keyCenterY - candCenterY) < (keyHeight * 0.8);
                const isToRight = cx1 > kx1; // strictly starts after key starts

                if (isSameLine && isToRight) {
                    const dist = cx1 - kx2; // distance from key end to cand start
                    if (dist < minDistance && dist > -50) { // allow slight overlap, but prioritize close
                        minDistance = dist;
                        bestCandidate = candidate;
                    }
                }
            }

            // If no candidate on right, check below
            if (!bestCandidate) {
                for (const candidate of boxes) {
                    if (candidate === keyBox) continue;
                    if (candidate.category !== 'DEFAULT') continue;

                    const [cx1, cy1, cx2] = candidate.box;

                    // Check "Below" neighbor
                    // Ideally roughly same X alignment (overlap in X range)
                    // and Y is greater
                    const isBelow = cy1 > ky1;
                    const xOverlap = Math.max(0, Math.min(kx2, cx2) - Math.max(kx1, cx1));
                    const isAligned = xOverlap > 0;

                    if (isBelow && isAligned) {
                        const dist = cy1 - ky2; // distance from key bottom to cand top
                        // We reset minDistance for 'below' search or keep it global?
                        // Let's assume 'below' is significantly larger gap usually, but valid.
                        // For now, let's just find closest below.
                        if (dist < minDistance && dist < (keyHeight * 4)) { // within 4 lines
                            minDistance = dist;
                            bestCandidate = candidate;
                        }
                    }
                }
            }

            if (bestCandidate) {
                bestCandidate.category = trigger.category;
            }
        }

        return boxes;
    }

    private categorizeText(text: string): PIICategory {
        const lower = text.toLowerCase().trim();

        // Email
        if (/\b[\w.-]+@[\w.-]+\.\w{2,4}\b/.test(text)) return 'EMAIL';

        // Phone
        if (/(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?/.test(text)) return 'PHONE';

        // Date
        if (/\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/.test(text)) return 'DATE';

        // Link/URL
        if (/https?:\/\/[^\s]+|www\.[^\s]+/.test(lower)) return 'LINK';

        // Credit Card
        if (/\b(?:\d[ -]*?){13,16}\b/.test(text)) return 'CREDIT_CARD';

        // Price
        if (/[$€£] ?\d+/.test(text) || /\d+ ?(?:USD|EUR|GBP)/.test(text)) return 'PRICE';

        // Address (heuristics)
        if (/\d+\s+[a-z\s]+(?:st|rd|ave|dr|ln|blvd|way|plaza|lane|road|avenue|street|drive)\b/i.test(text)) return 'ADDRESS';

        return 'DEFAULT';
    }
}

export const aiService = AIService.instance;
