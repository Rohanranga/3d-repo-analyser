"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function SceneEnvironment() {
    return (
        <>
            {/* Ambient base light */}
            <ambientLight intensity={0.35} color="#1a1040" />

            {/* Key directional */}
            <directionalLight position={[20, 40, 10]} intensity={0.9} color="#ffffff" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-far={100} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} />

            {/* Colored fill lights */}
            <pointLight position={[-15, 20, -15]} intensity={0.6} color="#6366f1" distance={60} />
            <pointLight position={[15, 20, 15]}  intensity={0.4} color="#10b981" distance={60} />
            <pointLight position={[0, 5, 0]}     intensity={0.2} color="#8b5cf6" distance={40} />

            {/* Glowing indigo grid floor — matches reference image */}
            <gridHelper args={[200, 100, "#2d2060", "#1a1040"]} position={[0, -0.49, 0]} />
            <gridHelper args={[200, 20,  "#4338ca", "#312e81"]} position={[0, -0.48, 0]} />

            {/* Dark floor plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial color="#030310" transparent opacity={0.95} roughness={1} metalness={0} />
            </mesh>

            {/* Subtle horizon fog glow */}
            <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[400, 400]} />
                <meshBasicMaterial color="#0d0b2e" transparent opacity={0.5} depthWrite={false} />
            </mesh>
        </>
    );
}

export function FloatingParticles() {
    const particlesRef = useRef<THREE.Points>(null);
    const count = 120;

    const positions = useMemo(() => {
        const p = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 3) {
            p[i]     = (Math.random() - 0.5) * 80;
            p[i + 1] = Math.random() * 30 + 2;
            p[i + 2] = (Math.random() - 0.5) * 80;
        }
        return p;
    }, []);

    useFrame(state => {
        if (!particlesRef.current) return;
        particlesRef.current.rotation.y = state.clock.elapsedTime * 0.006;
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.07} color="#818cf8" transparent opacity={0.4} sizeAttenuation />
        </points>
    );
}
