"use client";

import { Suspense, useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { CodeGraph } from "@/lib/code-graph-parser";
import { usePuzzleInteraction } from "./usePuzzleInteraction";
import { HUDOverlay, type MoveDir } from "./HUDOverlay";
import { NodeInfoPanel } from "./HUDOverlay";
import { ErrorsPanel } from "./HUDOverlay";
import { AIAssistantOverlay } from "./AIAssistantOverlay";
import { CodeNode } from "./CodeNode";
import { DependencyEdge } from "./DependencyEdge";
import { SceneEnvironment, FloatingParticles } from "./SceneEnvironment";
import { ArrowLeft, X as XIcon } from "lucide-react";

// ── Fly camera controller ──────────────────────────────────────────────────
function FlyController({ moveDirsRef }: { moveDirsRef: React.MutableRefObject<Set<MoveDir>> }) {
    const { camera } = useThree();
    useFrame((_, delta) => {
        const speed = 20 * delta;
        const dirs = moveDirsRef.current;
        if (dirs.size === 0) return;
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        if (dirs.has("forward"))  camera.position.addScaledVector(fwd, speed);
        if (dirs.has("backward")) camera.position.addScaledVector(fwd, -speed);
        if (dirs.has("left"))     camera.position.addScaledVector(right, -speed);
        if (dirs.has("right"))    camera.position.addScaledVector(right, speed);
        if (dirs.has("up"))       camera.position.y += speed;
        if (dirs.has("down"))     camera.position.y -= speed;
    });
    return null;
}

// ── Camera focus helper ────────────────────────────────────────────────────
function CameraFocus({ targetPos, trigger }: { targetPos: THREE.Vector3 | null; trigger: number }) {
    const { camera } = useThree();
    const animating = useRef(false);
    const startPos = useRef(new THREE.Vector3());
    const endPos = useRef(new THREE.Vector3());
    const progress = useRef(0);

    useEffect(() => {
        if (!targetPos) return;
        startPos.current.copy(camera.position);
        const offset = targetPos.clone().add(new THREE.Vector3(8, 8, 8));
        endPos.current.copy(offset);
        progress.current = 0;
        animating.current = true;
    }, [trigger]);

    useFrame((_, delta) => {
        if (!animating.current) return;
        progress.current = Math.min(1, progress.current + delta * 2.5);
        const t = 1 - Math.pow(1 - progress.current, 3);
        camera.position.lerpVectors(startPos.current, endPos.current, t);
        if (targetPos) camera.lookAt(targetPos);
        if (progress.current >= 1) animating.current = false;
    });
    return null;
}

// ── Nodes + edges — inside Suspense for font loading ─────────────────────
function NodesAndEdges({ graph, puzzle }: {
    graph: CodeGraph;
    puzzle: ReturnType<typeof usePuzzleInteraction> & { isolateEdge: (id: string) => void };
}) {
    return (
        <>
            {puzzle.visibleEdges.map(edge => {
                const src = graph.nodes.find(n => n.id === edge.source);
                const tgt = graph.nodes.find(n => n.id === edge.target);
                if (!src || !tgt) return null;
                return (
                    <DependencyEdge
                        key={edge.id}
                        edge={edge}
                        sourceNode={src}
                        targetNode={tgt}
                        isHighlighted={puzzle.state.highlightedEdges.has(edge.id)}
                        isTracing={puzzle.state.traceEdges.includes(edge.id)}
                        onIsolateEdge={puzzle.isolateEdge}
                    />
                );
            })}
            {puzzle.visibleNodes.map(node => (
                <CodeNode
                    key={node.id}
                    node={node}
                    isSelected={puzzle.state.selectedNodeId === node.id}
                    isHighlighted={puzzle.state.highlightedNodes.has(node.id)}
                    onSelect={puzzle.isolateNode}
                    onHover={puzzle.hoverNode}
                />
            ))}
        </>
    );
}

// ── Main export ─────────────────────────────────────────────────────────────
export default function CodeExplorer3D({ graph, onGoBack }: { graph: CodeGraph; onGoBack: () => void }) {
    const puzzle = usePuzzleInteraction(graph);
    const [viewMode, setViewMode] = useState<"orbit" | "fly">("orbit");
    const [isMobile, setIsMobile] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const [focusTrigger, setFocusTrigger] = useState(0);
    const [focusPos, setFocusPos] = useState<THREE.Vector3 | null>(null);
    const moveDirsRef = useRef(new Set<MoveDir>());
    const orbitRef = useRef<any>(null);

    useEffect(() => {
        setIsMobile(("ontouchstart" in window || navigator.maxTouchPoints > 0) && window.innerWidth < 768);
    }, []);

    const handleSelectNode = useCallback((nodeId: string | null) => {
        if (!nodeId) return;
        // Isolate: hide everything except this node + its direct connections
        puzzle.isolateNode(nodeId);
        setShowAI(true);
        const node = graph.nodes.find(n => n.id === nodeId);
        if (node?.position) {
            setFocusPos(new THREE.Vector3(...node.position));
            setFocusTrigger(t => t + 1);
        }
    }, [puzzle, graph]);

    const handleFocusNode = useCallback((nodeId: string) => {
        puzzle.isolateNode(nodeId);
        const node = graph.nodes.find(n => n.id === nodeId);
        if (node?.position) {
            setFocusPos(new THREE.Vector3(...node.position));
            setFocusTrigger(t => t + 1);
        }
    }, [puzzle, graph]);

    const handleIsolateEdge = useCallback((edgeId: string) => {
        puzzle.isolateEdge(edgeId);
        setShowAI(false);
        // Focus camera between the two nodes
        const edge = graph.edges.find(e => e.id === edgeId);
        if (edge) {
            const src = graph.nodes.find(n => n.id === edge.source);
            const tgt = graph.nodes.find(n => n.id === edge.target);
            if (src?.position && tgt?.position) {
                const mid = new THREE.Vector3(
                    (src.position[0] + tgt.position[0]) / 2,
                    (src.position[1] + tgt.position[1]) / 2,
                    (src.position[2] + tgt.position[2]) / 2,
                );
                setFocusPos(mid);
                setFocusTrigger(t => t + 1);
            }
        }
    }, [puzzle, graph]);

    const handleMoveStart = useCallback((dir: MoveDir) => moveDirsRef.current.add(dir), []);
    const handleMoveEnd   = useCallback((dir: MoveDir) => moveDirsRef.current.delete(dir), []);

    const handleExitIsolation = useCallback(() => {
        puzzle.exitIsolation();
        setShowAI(false);
    }, [puzzle]);

    // Bundle overrides to pass into NodesAndEdges
    const puzzleWithAI = {
        ...puzzle,
        selectNode: handleSelectNode,
        isolateNode: handleSelectNode,
        isolateEdge: handleIsolateEdge,
    };

    return (
        <div className="relative w-full h-full bg-[#050510]">
            {/* ── Canvas ── */}
            <div className="absolute inset-0 z-0">
                <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
                    <PerspectiveCamera makeDefault position={[30, 25, 30]} fov={60} />
                    {viewMode === "orbit" ? (
                        <OrbitControls ref={orbitRef} makeDefault enableDamping dampingFactor={0.05} maxDistance={200} minDistance={3} />
                    ) : (
                        <FlyController moveDirsRef={moveDirsRef} />
                    )}
                    <CameraFocus targetPos={focusPos} trigger={focusTrigger} />

                    {/* Invisible background plane — clicking it exits isolation */}
                    <mesh
                        position={[0, -0.49, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        onClick={e => { if ((e.target as unknown) === e.eventObject) handleExitIsolation(); }}
                    >
                        <planeGeometry args={[500, 500]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>

                    {/* Environment always renders immediately — no font deps */}
                    <SceneEnvironment />
                    <FloatingParticles />
                    <Stars radius={120} depth={60} count={3000} factor={4} saturation={0} fade speed={0.5} />

                    {/* Nodes + edges inside Suspense for async font loading */}
                    <Suspense fallback={null}>
                        <NodesAndEdges graph={graph} puzzle={puzzleWithAI} />
                    </Suspense>
                </Canvas>
            </div>

            {/* ── Back Button (outside HUD, own stacking context) ── */}
            <button
                onClick={onGoBack}
                className="fixed top-5 left-5 z-[300] flex items-center gap-2 px-5 py-3 rounded-xl
                           bg-gradient-to-r from-indigo-600 to-purple-600 backdrop-blur-xl border border-indigo-400/40 text-white text-sm font-semibold
                           hover:from-indigo-500 hover:to-purple-500 hover:border-indigo-300/60 hover:shadow-indigo-500/40
                           transition-all duration-200 shadow-lg shadow-indigo-500/30 group cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
                <span>Return to Dashboard</span>
            </button>

            {/* ── Exit Node/Isolation Button (below back button, always visible when a node is active) ── */}
            {(puzzle.isIsolated || puzzle.selectedNode) && (
                <button
                    onClick={handleExitIsolation}
                    className="fixed top-[4.5rem] left-5 z-[300] flex items-center gap-2 px-5 py-3 rounded-xl
                               bg-gradient-to-r from-red-600 to-orange-600 backdrop-blur-xl border border-red-400/40 text-white text-sm font-semibold
                               hover:from-red-500 hover:to-orange-500 hover:border-red-300/60 hover:shadow-red-500/40
                               transition-all duration-200 shadow-lg shadow-red-500/30 group cursor-pointer"
                >
                    <XIcon className="w-4 h-4 text-white group-hover:rotate-90 transition-transform" />
                    <span>Exit Node View</span>
                </button>
            )}

            {/* ── HUD Layer ── */}
            <div className="absolute inset-0 z-10 pointer-events-none">

                {/* ── Node Info Panel ── */}
                {puzzle.selectedNode && (
                    <NodeInfoPanel
                        node={puzzle.selectedNode}
                        graph={graph}
                        onClose={handleExitIsolation}
                        onTraceFrom={puzzle.traceExecutionFrom}
                        onFocusNode={handleFocusNode}
                        onIsolateNode={handleSelectNode}
                    />
                )}

                {/* ── AI Overlay ── */}
                {showAI && puzzle.selectedNode && (
                    <AIAssistantOverlay
                        node={puzzle.selectedNode}
                        onClose={() => setShowAI(false)}
                    />
                )}

                {/* ── Errors Panel ── */}
                <ErrorsPanel graph={graph} onFocusNode={handleFocusNode} />

                {/* ── HUD: bottom toolbar + move pad ── */}
                <HUDOverlay
                    graph={graph}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    filterType={puzzle.state.filterType}
                    onFilterChange={puzzle.setFilterType}
                    isTracing={puzzle.state.isTracing}
                    onToggleTrace={puzzle.toggleTrace}
                    showLabels={puzzle.state.showLabels}
                    onToggleLabels={puzzle.toggleLabels}
                    onZoomIn={() => {
                        if (orbitRef.current) { orbitRef.current.dollyIn(1.4); orbitRef.current.update(); }
                    }}
                    onZoomOut={() => {
                        if (orbitRef.current) { orbitRef.current.dollyOut(1.4); orbitRef.current.update(); }
                    }}
                    onResetView={() => {
                        if (orbitRef.current) orbitRef.current.reset();
                    }}
                    gyroEnabled={false}
                    onToggleGyro={() => {}}
                    isMobile={isMobile}
                    onMoveStart={handleMoveStart}
                    onMoveEnd={handleMoveEnd}
                    discoveryProgress={puzzle.discoveryProgress}
                    isIsolated={puzzle.isIsolated}
                    onExitIsolation={handleExitIsolation}
                />
            </div>
        </div>
    );
}
