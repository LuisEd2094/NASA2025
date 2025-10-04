// src/app/classification/ClassifierClient.tsx
"use client"

import { useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Stars } from "@react-three/drei"

type ClassificationResult = {
  id: number
  classification: string
}

// 🔹 Planet component (mini scene)
function PlanetModel({ modelPath, scale }: { modelPath: string; scale: number }) {
  const { scene } = useGLTF(modelPath)
  return <primitive object={scene} scale={scale} />
}

function downloadResults(results: ClassificationResult[], format: "csv" | "json") {
  let blob: Blob
  let filename: string

  if (format === "json") {
    blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    filename = "classification_results.json"
  } else {
    // CSV
    const headers = Object.keys(results[0]).join(",")
    const rows = results.map(r => Object.values(r).join(",")).join("\n")
    const csv = `${headers}\n${rows}`
    blob = new Blob([csv], { type: "text/csv" })
    filename = "classification_results.csv"
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}


// 🔹 Mapping classification → model paths
const planetModels: Record<string, { path: string; scale: number }> = {
  Earth: { path: "/models/earth.glb", scale: 0.3 },
  Mars: { path: "/models/mars.glb", scale: 0.4 },
  Jupiter: { path: "/models/jupiter.glb", scale: 0.125 },
}

const pageBackgroundStyle = {
  backgroundImage: "url('/images/space-bg.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
}

export default function ClassifierClient() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ClassificationResult[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert("Please select a file first.")
      return
    }

    setLoading(true)
    setResults(null)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const fakeResponse: ClassificationResult[] = [
      { id: 1, classification: "Earth" },
      { id: 2, classification: "Mars" },
      { id: 3, classification: "Jupiter" },
    ]

    setResults(fakeResponse)
    setLoading(false)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white"
      style={pageBackgroundStyle} >
      <h1 className="text-3xl font-bold mb-6">AI Classifier</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-white/10 p-6 rounded-lg shadow-lg"
      >
        { /*".csv,.json" */}
        <input
          type="file"
          accept="*"
          disabled={loading}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Processing..." : "Upload & Classify"}
        </button>
      </form>

      {results && (
        <div className="mt-8 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Results:</h2>
          <table className="w-full border border-gray-600">
            <thead>
              <tr className="bg-gray-800">
                <th className="border border-gray-600 px-4 py-2">ID</th>
                <th className="border border-gray-600 px-4 py-2">Classification</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res) => (
                <tr key={res.id}>
                  <td className="border border-gray-600 px-4 py-2 text-center">
                    {res.id}
                  </td>
                  <td
                    className="border border-gray-600 px-4 py-2 text-center cursor-pointer hover:bg-gray-700"
                    onClick={() => setSelected(res.classification)}
                  >
                    {res.classification}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Download buttons */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => downloadResults(results, "csv")}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded"
            >
              Download CSV
            </button>
            <button
              onClick={() => downloadResults(results, "json")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
            >
              Download JSON
            </button>
          </div>
        </div>
      )}

      {/* 🔹 Modal for mini 3D planet preview */}
      {selected && planetModels[selected] && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center"
          onMouseDown={() => setSelected(null)}>
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
            {/* Captures the onMouseDown event and stops propagation to its parent div */}
            <div className="relative bg-gray-900 p-4 rounded-lg w-[400px] h-[400px] shadow-lg"
              onMouseDown={(event) => event.stopPropagation()}>
              <button
                onMouseDown={() => setSelected(null)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded z-50"
              >
                ✕
              </button>

              {/* Canvas fills the container */}
              <Canvas camera={{ position: [0, 0, 4], fov: 50 }} className="w-full h-full">
                <ambientLight intensity={0.9} />
                <pointLight position={[5, 5, 5]} intensity={2} />
                <Stars radius={50} depth={20} count={2000} factor={3} fade />
                <PlanetModel
                  modelPath={planetModels[selected].path}
                  scale={planetModels[selected].scale}
                />
                <OrbitControls enableZoom={true} />
              </Canvas>
            </div>
          </div>
        </div>
      )}


    </main>
  )
}
