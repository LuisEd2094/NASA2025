// src/app/Scene.tsx
"use client"

import { Canvas, useThree } from "@react-three/fiber"
import { Stars, OrbitControls, useGLTF } from "@react-three/drei"
import { useRef, useEffect, useState } from "react"
import { useFrame } from "@react-three/fiber"
import gsap from "gsap"
import * as THREE from "three"
import { Html } from "@react-three/drei"
import { useI18n } from "../../i18n"



type Hotspot = {
    position: [number, number, number]
    title: string
    description: string
}

type Hotspot2D = {
    screenPosition: [number, number]
    title: string
    description: string
}

const hotspots2D: Hotspot2D[] = [
    { screenPosition: [-100, 50], title: "1", description: "scene.hotspot1.desc" },
    { screenPosition: [120, 80], title: "2", description: "scene.hotspot2.desc" },
]

function FixedHotspots({ hotspots }: { hotspots: Hotspot2D[] }) {
    const { t } = useI18n()
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    return (
        <>
            {hotspots.map((hotspot, i) => (
                <Html
                    key={i}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: `translate(${hotspot.screenPosition[0]}px, ${hotspot.screenPosition[1]}px)`,
                        pointerEvents: "auto",
                        zIndex: 10,
                    }}
                >
                    <div
                        className="relative pointer-events-auto"
                        onClick={() => setActiveIndex(i === activeIndex ? null : i)}
                    >
                        {/* Numbered marker */}
                        <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg hover:bg-blue-500 transition animate-pulse">
                            {hotspot.title}
                        </div>

                        {/* Tooltip */}
                        {activeIndex === i && (
                            <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-black/90 text-white p-3 rounded shadow-lg max-w-xs z-50 pointer-events-auto">
                                <h3 className="font-bold mb-1">{hotspot.title}</h3>
                                <p className="text-sm">{t(hotspot.description)}</p>
                            </div>
                        )}
                    </div>
                </Html>
            ))}
        </>
    )
}


// Planet
function Planet({ modelPath, scale }: { modelPath: string; scale: number }) {
    const planetRef = useRef<THREE.Object3D>(null!)
    const { scene } = useGLTF(modelPath)

    useFrame(() => {
        if (planetRef.current) {
            planetRef.current.rotation.y += 0.0002
        }
    })

    return (
        <group ref={planetRef} scale={scale}>
            <primitive object={scene} />
        </group>
    )
}

// Sun
function Sun({ modelPath, scale }: { modelPath: string; scale: number }) {
    const sunRef = useRef<THREE.Object3D>(null!)
    const { scene } = useGLTF(modelPath)

    useFrame(() => {
        if (sunRef.current) {
            sunRef.current.rotation.y += 0.001
        }
    })

    return (
        <group position={[10, 0, 50]} scale={scale}>
            <primitive ref={sunRef} object={scene} />
            <pointLight intensity={5000} color="white" />
        </group>
    )
}

// Camera zoom animation
function CameraZoom() {
    const { camera } = useThree()
    useEffect(() => {
        camera.position.set(0, 0, 20)
        gsap.to(camera.position, { z: 5, duration: 5, ease: "power2.inOut" })
    }, [camera])
    return null
}

export default function Scene({
    planetModel,
    sunModel,
}: {
    planetModel: { path: string; scale: number }
    sunModel: { path: string; scale: number }
}) {
    return (
        <Canvas camera={{ position: [0, 0, 20], fov: 60 }}>
            {/* Background stars */}
            <Stars radius={100} depth={50} count={5000} factor={4} fade />

            {/* Lighting */}
            <ambientLight intensity={0.7} />

            {/* Sun + Planet */}
            <Sun modelPath={sunModel.path} scale={sunModel.scale} />
            <Planet modelPath={planetModel.path} scale={planetModel.scale} />

            {/* Zoom animation after selection */}
            <CameraZoom />

            <FixedHotspots hotspots={hotspots2D} />

            {/* Controls */}
            <OrbitControls
                enableZoom
                minDistance={2}
                maxDistance={50}
                enablePan={false}
            />
        </Canvas>
    )
}
