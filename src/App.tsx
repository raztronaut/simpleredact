import { useStore } from '@/store/useStore'
import { UploadScreen } from '@/components/upload/UploadScreen'
import { EditorScreen } from '@/components/editor/EditorScreen'
import { AIWidget } from '@/components/ui/AIWidget'

function App() {
  const image = useStore((state) => state.image)

  return (
    <div className="dark min-h-screen bg-stone-950 text-white font-sans antialiased selection:bg-emerald-500/30">
      {!image ? <UploadScreen /> : <EditorScreen />}
      <AIWidget />
    </div>
  )
}

export default App
