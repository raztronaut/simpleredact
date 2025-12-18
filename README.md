# RedactSimple

A simple, secure, and privacy-focused image redaction tool built with React, Vite, and Shadcn UI.

![RedactSimple Preview](./public/screenshot.jpeg)

## Features

-   **Client-Side Processing**: All image processing happens in your browser. No images are ever uploaded to a server.
-   **Pixel Perfect**: Beautiful pixelation effect for redacting sensitive information.
-   **Easy to Use**:
    -   Drag & drop images.
    -   Draw boxes to redact.
    -   Move and resize boxes easily.
    -   Download high-quality PNGs.
-   **Keyboard Accessibility**:
    -   `Arrow Keys`: Move selected box (1px).
    -   `Shift + Arrow Keys`: Move selected box (10px).
    -   `Cmd/Ctrl +`: Zoom In.
    -   `Cmd/Ctrl -`: Zoom Out.
    -   `Cmd/Ctrl 0`: Fit to Screen.
    -   `Cmd/Ctrl 1`: Zoom to 100%.

## Tech Stack

-   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start development server**:
    ```bash
    npm run dev
    ```

3.  **Run tests**:
    ```bash
    npm test
    # or
    npx vitest run
    ```

4.  **Build for production**:
    ```bash
    npm run build
    ```

## Project Structure

-   `src/components`: UI components (Editor, Upload, etc.)
-   `src/store`: Application state (Zustand)
-   `src/hooks`: Custom hooks (Editor logic)
-   `src/lib`: Constants and utilities
-   `src/utils`: Image processing logic

## License

MIT
