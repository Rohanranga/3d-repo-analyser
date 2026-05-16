"use client";

import { useMemo, useRef } from "react";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";
import type { GraphEdge, GraphNode, EdgeType } from "@/lib/code-graph-parser";

extend({ Line_: THREE.Line });

const EDGE_COLORS: Record<EdgeType, string> = {
    dependency: "#6366f1",
    call: "#10b981",
    inheritance: "#f59e0b",
    composition: "#8b5cf6",
    "data-flow": "#06b6d4",
};

interface DependencyEdgeProps {
    edge: GraphEdge;
    sourceNode: GraphNode;
    targetNode: GraphNode;
    isHighlighted: boolean;
    isTracing: boolean;
    onIsolateEdge?: (edgeId: string) => void;
}

export function DependencyEdge({ edge, sourceNode, targetNode, isHighlighted, isTracing, onIsolateEdge }: DependencyEdgeProps) {
    const particleRef = useRef<THREE.Mesh>(null);
    const flowRef = useRef<THREE.Mesh>(null);
    const tubeRef = useRef<THREE.Mesh>(null);
    const progressRef = useRef(0);
    const flowOffset = useRef(0);
    const hoveredRef = useRef(false);

    const source = useMemo(() => new THREE.Vector3(...(sourceNode.position || [0, 0, 0])), [sourceNode.position]);
    const target = useMemo(() => new THREE.Vector3(...(targetNode.position || [0, 0, 0])), [targetNode.position]);

    const curve = useMemo(() => {
        const dist = source.distanceTo(target);
        const mid = new THREE.Vector3().lerpVectors(source, target, 0.5);
        mid.y += dist * 0.25; // Subtle arch
        return new THREE.QuadraticBezierCurve3(source, mid, target);
    }, [source, target]);

    const color = EDGE_COLORS[edge.type] || "#666666";

    useFrame((_, delta) => {
        flowOffset.current = (flowOffset.current + delta * 0.8) % 1;
        if (isTracing && particleRef.current) {
            progressRef.current = (progressRef.current + delta * 1.2) % 1;
            particleRef.current.position.copy(curve.getPoint(progressRef.current));
        }
        if (flowRef.current) {
            const mat = flowRef.current.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
        }
        // Hover glow on tube
        if (tubeRef.current) {
            const mat = tubeRef.current.material as THREE.MeshStandardMaterial;
            mat.opacity = hoveredRef.current ? 0.85 : isHighlighted ? 0.9 : 0.4;
            mat.emissiveIntensity = hoveredRef.current ? 2.5 : isHighlighted ? 2 : 0.4;
        }
    });

    return (
        <group>
            {/* The Main Pipe — clickable */}
            <mesh
                ref={tubeRef as any}
                onClick={e => { e.stopPropagation(); onIsolateEdge?.(edge.id); }}
                onPointerOver={e => { e.stopPropagation(); hoveredRef.current = true; document.body.style.cursor = "pointer"; }}
                onPointerOut={() => { hoveredRef.current = false; document.body.style.cursor = "default"; }}
            >
                <tubeGeometry args={[curve, 20, hoveredRef.current ? 0.07 : 0.04, 8, false]} />
                <meshStandardMaterial
                    color={isHighlighted ? "#ffffff" : color}
                    emissive={color}
                    emissiveIntensity={isHighlighted ? 2 : 0.4}
                    transparent
                    opacity={isHighlighted ? 0.9 : 0.4}
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>

            {/* Glowing Pulse effect along the line */}
            {isHighlighted && (
                <mesh ref={flowRef as any}>
                    <tubeGeometry args={[curve, 32, 0.07, 8, false]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={2}
                        transparent
                        opacity={0.3}
                        depthWrite={false}
                    />
                </mesh>
            )}

            {/* Tracing Particle (Data Packet) */}
            {isTracing && (
                <group ref={particleRef as any}>
                    <mesh>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <pointLight color={color} intensity={5} distance={2} />
                    <mesh scale={2}>
                        <sphereGeometry args={[0.15, 8, 8]} />
                        <meshBasicMaterial color={color} transparent opacity={0.3} />
                    </mesh>
                </group>
            )}

            {/* Arrowhead at target */}
            {(isHighlighted || isTracing) && (
                <mesh position={target.toArray() as [number, number, number]} lookAt={source}>
                    <coneGeometry args={[0.15, 0.4, 8]} />
                    <meshStandardMaterial 
                        color={color} 
                        emissive={color}
                        emissiveIntensity={2}
                    />
                </mesh>
            )}
        </group>
    );
}
