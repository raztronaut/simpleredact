# SummarizeWith Widget Dev Feedback

This document contains architectural and developer experience (DX) feedback for the `summarizewith` (aka `summarize-with-ai`) widget, compiled after a real-world integration into the RedactSimple project.

## 1. Developer Experience (DX)

### Native React/Vue Wrappers
Managing `useEffect` and container refs manually adds friction. A first-class React component would make integration a one-liner.
- **Current Pattern**:
  ```tsx
  useEffect(() => { SummarizeWidget.init({ target: '#id', ... }) }, [])
  ```
- **Recommended Pattern**:
  ```tsx
  import { SummarizeWidget } from 'summarize-with-ai/react'
  <SummarizeWidget theme="minimal" compact className="fixed bottom-4 right-4" />
  ```

### Naming Consistency
The repository name (`summarizewith`) doesn't perfectly match the npm package name (`summarize-with-ai`). Aligning these or making the npm install command prominent at the top of the README would reduce search time.

## 2. Agentic Support (AI-Ready Documentation)

### Adding `llms.txt`
As AI coding assistants become more common, providing a machine-readable specification is crucial.
- **Goal**: Create an `llms.txt` in the root.
- **Content**: A concise summary of the package name, `init` options schema, and "Common Patterns" (e.g., "Minimal corner widget code").
- **Benefit**: Allows AI agents to instantly understand the API without parsing a long, stylistic README.

## 3. Customization & Theming

### CSS Variable Support
While the "minimal" theme is excellent, allowing users to override colors and radius via CSS variables would improve visual parity with host sites.
- **Example**: support `--sw-primary-color`, `--sw-border-radius`, etc.

### Interactive Snippet Generator
Provide a tool on the documentation site or README where users can toggle options (`theme`, `compact`, `position`) to see a live preview and generate the exact code snippet for their framework.

## 4. Documentation Patterns

### "Pre-composed" Designs
Instead of just listing options, provide clear, copy-pasteable patterns for common use cases:
- **"The Floating Pearl"**: Compact, minimal theme for corner placement.
- **"The Sticky Toolbar"**: Horizontal, dark theme for article headers.

---
*Created during RedactSimple integration - 2025-12-18*
