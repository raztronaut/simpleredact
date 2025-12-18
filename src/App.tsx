import { Suspense, lazy } from 'react'
import { useStore } from '@/store/useStore'
import { UploadScreen } from '@/components/upload/UploadScreen'
import { AIWidget } from '@/components/ui/AIWidget'
import { Loader2 } from 'lucide-react'

// Lazy load the editor since it's heavy (canvas, transformers, etc)
const EditorScreen = lazy(() => import('@/components/editor/EditorScreen').then(module => ({ default: module.EditorScreen })))

function App() {
  const image = useStore((state) => state.image)

  return (
    <div className="min-h-screen text-white font-sans selection:bg-emerald-500/30">
      {!image ? (
        <UploadScreen />
      ) : (
        <Suspense fallback={
          <div className="h-screen w-full flex items-center justify-center bg-stone-950">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        }>
          <EditorScreen />
        </Suspense>
      )}
      <AIWidget />
    </div>
  )
}

export default App
