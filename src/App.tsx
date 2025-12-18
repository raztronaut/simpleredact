import { useStore } from '@/store/useStore'
import { UploadScreen } from '@/components/upload/UploadScreen'
import { EditorScreen } from '@/components/editor/EditorScreen' // We will build this next

function App() {
  const image = useStore((state) => state.image)

  return (
    <div className="dark min-h-screen bg-stone-950 text-white font-sans antialiased selection:bg-emerald-500/30">
      {!image ? <UploadScreen /> : <EditorScreen />}
    </div>
  )
}

export default App
