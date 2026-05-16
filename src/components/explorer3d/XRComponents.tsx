"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface XRControllerProps {
    mode: "ar" | "vr";
}

export function XRController({ mode }: XRControllerProps) {
    const { camera, gl } = useThree();
    const velocityRef = useRef(new THREE.Vector3());
    
    // We'll use the WebXR session's input sources for movement if available
    useFrame((state, delta) => {
        const session = gl.xr.getSession();
        if (!session) return;

        // If in VR, we can use the thumbsticks of the controllers
        // For now, let's keep it simple with a forward-moving gaze or controller direction
        if (mode === 'vr') {
            const speed = 5;
            const inputSources = session.inputSources;
            
            inputSources.forEach((source) => {
                if (source.gamepad) {
                    const axes = source.gamepad.axes;
                    // Usually axes[2] and axes[3] are the right thumbstick or left thumbstick
                    if (Math.abs(axes[3]) > 0.1 || Math.abs(axes[2]) > 0.1) {
                        const dir = new THREE.Vector3(axes[2], 0, axes[3]);
                        dir.applyQuaternion(camera.quaternion);
                        dir.y = 0; // Keep movement on the horizontal plane
                        camera.position.add(dir.multiplyScalar(speed * delta));
                    }
                }
            });
        }
    });

    return null;
}

export function XRWorldFloor() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial 
                color="#020617" 
                transparent 
                opacity={0.5} 
                roughness={1}
                metalness={0}
            />
            <gridHelper args={[100, 50, "#1e1b4b", "#0f172a"]} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>
    );
}

export function XRInteractionRay() {
    const rayRef = useRef<THREE.Line>(null);
    const { camera, raycaster } = useThree();

    useFrame(() => {
        if (!rayRef.current) return;

        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const origin = camera.position.clone();
        const points = [origin, origin.clone().add(dir.multiplyScalar(50))];
        rayRef.current.geometry.setFromPoints(points);
    });

    return (
        <line ref={rayRef as any}>
            <bufferGeometry />
            <lineBasicMaterial color="#6366f1" transparent opacity={0.3} />
        </line>
    );
}

export function XRTeleportTarget({ position }: { position: [number, number, number] }) {
    return (
        <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 1, 32]} />
            <meshBasicMaterial color="#6366f1" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
    );
}

interface XRHandMenuProps {
    onAction: (action: string) => void;
}

export function XRHandMenu({ onAction }: XRHandMenuProps) {
    return (
        <group position={[-0.3, -0.2, -0.5]}>
            {[
                { label: "Select", action: "select", y: 0.15 },
                { label: "Trace", action: "trace", y: 0.05 },
                { label: "Reset", action: "reset", y: -0.05 },
            ].map(item => (
                <group key={item.action} position={[0, item.y, 0]}>
                    <mesh
                        onClick={() => onAction(item.action)}
                        onPointerOver={(e) => { e.stopPropagation(); }}
                    >
                        <planeGeometry args={[0.12, 0.04]} />
                        <meshBasicMaterial color="#1e1b4b" transparent opacity={0.8} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}
