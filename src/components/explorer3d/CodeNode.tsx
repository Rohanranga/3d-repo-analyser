"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { GraphNode } from "@/lib/code-graph-parser";

const TYPE_CONFIG: Record<string, { color: string; emissive: string }> = {
    module:    { color: "#e2e8f0", emissive: "#6366f1" },
    class:     { color: "#f59e0b", emissive: "#f59e0b" },
    function:  { color: "#10b981", emissive: "#10b981" },
    variable:  { color: "#f97316", emissive: "#fb923c" },   // vivid orange
    interface: { color: "#8b5cf6", emissive: "#8b5cf6" },
    enum:      { color: "#ec4899", emissive: "#ec4899" },
};

const STATUS_EMISSIVE: Record<string, string> = {
    healthy: "#000000",
    warning: "#f59e0b",
    error:   "#ef4444",
    unused:  "#374151",
};

interface CodeNodeProps {
    node: GraphNode;
    isSelected: boolean;
    isHighlighted: boolean;
    onSelect: (id: string) => void;
    onHover: (id: string | null) => void;
}

const _v3 = new THREE.Vector3();

export function CodeNode({ node, isSelected, isHighlighted, onSelect, onHover }: CodeNodeProps) {
    const meshRef  = useRef<THREE.Mesh>(null);
    const glowRef  = useRef<THREE.Mesh>(null);
    const hoveredRef = useRef(false);

    const cfg    = TYPE_CONFIG[node.type] || TYPE_CONFIG.variable;
    const emissiveColor = isHighlighted || isSelected
        ? cfg.emissive
        : (STATUS_EMISSIVE[node.status] || "#000000");

    const pos = node.position || [0, 0, 0];
    const isError = node.status === "error";
    const isUnused = node.status === "unused";

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        const target = isSelected ? 1.25 : hoveredRef.current ? 1.1 : 1;
        _v3.set(target, target, target);
        meshRef.current.scale.lerp(_v3, delta * 8);

        if (glowRef.current) {
            const mat = glowRef.current.material as THREE.MeshBasicMaterial;
            if (isError) {
                mat.opacity = 0.25 + Math.sin(Date.now() * 0.005) * 0.15;
            } else {
                mat.opacity = isSelected ? 0.35 : hoveredRef.current ? 0.15 : 0;
            }
        }
    });

    const labelY = node.type === "module" ? 1.4
        : node.type === "class" ? 2.6
        : 1.4;

    return (
        <group position={pos as [number, number, number]}>
            {/* Selection glow sphere */}
            <mesh ref={glowRef} scale={node.type === "module" ? 5 : node.type === "class" ? 4 : 2.5}>
                <sphereGeometry args={[1, 12, 8]} />
                <meshBasicMaterial color={cfg.emissive} transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Main mesh */}
            <group ref={meshRef as any}>
                {node.type === "module" ? (
                    // White rectangular block (like buildings/files in reference)
                    <RoundedBox args={[2.8, 0.6, 1.8]} radius={0.08} smoothness={3}>
                        <meshStandardMaterial
                            color={isUnused ? "#1e2030" : isHighlighted ? "#ffffff" : "#c8d6e8"}
                            emissive={emissiveColor}
                            emissiveIntensity={isSelected ? 1.5 : isHighlighted ? 0.8 : 0.1}
                            metalness={0.3}
                            roughness={0.6}
                            transparent
                            opacity={isUnused ? 0.5 : 0.95}
                        />
                    </RoundedBox>
                ) : node.type === "class" ? (
                    // Tall building block
                    <RoundedBox args={[1.4, 2.8, 1.4]} radius={0.08} smoothness={3}>
                        <meshStandardMaterial
                            color={isUnused ? "#1e2030" : isHighlighted ? "#fde68a" : cfg.color}
                            emissive={emissiveColor}
                            emissiveIntensity={isSelected ? 2 : isHighlighted ? 1 : 0.4}
                            metalness={0.6}
                            roughness={0.3}
                            transparent
                            opacity={isUnused ? 0.5 : 0.9}
                        />
                    </RoundedBox>
                ) : node.type === "function" ? (
                    // Green sphere (like reference image)
                    <mesh>
                        <sphereGeometry args={[0.65, 32, 24]} />
                        <meshStandardMaterial
                            color={isUnused ? "#1e2030" : isHighlighted ? "#6ee7b7" : cfg.color}
                            emissive={emissiveColor}
                            emissiveIntensity={isSelected ? 2.5 : isHighlighted ? 1.5 : 0.6}
                            metalness={0.1}
                            roughness={0.4}
                            transparent
                            opacity={isUnused ? 0.4 : 0.92}
                        />
                    </mesh>
                ) : node.type === "interface" ? (
                    // Diamond / octahedron
                    <mesh>
                        <octahedronGeometry args={[0.55, 0]} />
                        <meshStandardMaterial
                            color={isHighlighted ? "#c4b5fd" : cfg.color}
                            emissive={emissiveColor}
                            emissiveIntensity={isSelected ? 2 : 0.5}
                            metalness={0.8}
                            roughness={0.1}
                        />
                    </mesh>
                ) : node.type === "enum" ? (
                    // Smaller cube
                    <mesh>
                        <boxGeometry args={[0.5, 0.5, 0.5]} />
                        <meshStandardMaterial
                            color={isHighlighted ? "#f9a8d4" : cfg.color}
                            emissive={emissiveColor}
                            emissiveIntensity={isSelected ? 2 : 0.5}
                            metalness={0.7}
                            roughness={0.2}
                        />
                    </mesh>
                ) : (
                    // Variable — small tetrahedron
                    <mesh>
                        <tetrahedronGeometry args={[0.4, 0]} />
                        <meshStandardMaterial
                            color={isHighlighted ? "#67e8f9" : cfg.color}
                            emissive={emissiveColor}
                            emissiveIntensity={isSelected ? 2 : 0.5}
                            metalness={0.9}
                            roughness={0.0}
                        />
                    </mesh>
                )}

                {/* Error spike */}
                {isError && (
                    <group position={[0, node.type === "class" ? 2.2 : 1.2, 0]}>
                        <mesh>
                            <octahedronGeometry args={[0.25, 0]} />
                            <meshBasicMaterial color="#ef4444" />
                        </mesh>
                        <pointLight color="#ef4444" intensity={3} distance={4} />
                    </group>
                )}

                {/* ── Universal Complexity Ring ────────────────────────────── */}
                {(() => {
                    const c = node.complexity;
                    if (c < 1) return null;
                    // Color scale: green → yellow → orange → red
                    const ringColor = c >= 14 ? "#ef4444"
                        : c >= 9  ? "#f97316"
                        : c >= 5  ? "#f59e0b"
                        : "#22c55e";
                    // Ring radius grows slightly with complexity
                    const baseRadius = node.type === "module" ? 2.2
                        : node.type === "class"    ? 1.4
                        : node.type === "function" ? 1.0
                        : 0.75;
                    const radius = baseRadius + Math.min(c * 0.08, 0.8);
                    // Tube thickness: thin for simple, thick for complex
                    const tube = 0.03 + Math.min(c * 0.012, 0.12);
                    return (
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <torusGeometry args={[radius, tube, 12, 64]} />
                            <meshStandardMaterial
                                color={ringColor}
                                emissive={ringColor}
                                emissiveIntensity={1.5 + Math.sin(Date.now() * (0.002 + c * 0.0003)) * 0.8}
                                transparent
                                opacity={0.55 + Math.min(c * 0.025, 0.4)}
                                metalness={0.3}
                                roughness={0.1}
                            />
                        </mesh>
                    );
                })()}
            </group>

            {/* Invisible click-target — larger than mesh for easy selection */}
            <mesh
                visible={false}
                scale={node.type === "module" ? [3, 2, 2.5] : [2, 2, 2]}
                onClick={e => { e.stopPropagation(); onSelect(node.id); }}
                onPointerOver={e => { e.stopPropagation(); hoveredRef.current = true; onHover(node.id); document.body.style.cursor = "pointer"; }}
                onPointerOut={() => { hoveredRef.current = false; onHover(null); document.body.style.cursor = "default"; }}
            >
                <sphereGeometry args={[1, 8, 8]} />
            </mesh>

            {/* Label */}
            <Billboard position={[0, labelY, 0]}>
                <Text
                    fontSize={node.type === "module" ? 0.42 : 0.32}
                    color={isUnused ? "#4b5563" : "#ffffff"}
                    anchorX="center"
                    anchorY="bottom"
                    outlineWidth={0.04}
                    outlineColor="#000000"
                    maxWidth={6}
                >
                    {node.label}
                </Text>
                <Text fontSize={0.18} color={cfg.emissive} anchorX="center" anchorY="top" position={[0, -0.05, 0]}>
                    {node.type.toUpperCase()}
                </Text>
            </Billboard>
        </group>
    );
}
