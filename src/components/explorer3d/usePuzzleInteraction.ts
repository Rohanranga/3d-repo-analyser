"use client";

import { useState, useCallback, useMemo } from "react";
import type { CodeGraph, GraphNode, GraphEdge } from "@/lib/code-graph-parser";

export interface PuzzleState {
    selectedNodeId: string | null;
    hoveredNodeId: string | null;
    tracingFrom: string | null;
    tracePath: string[];
    traceEdges: string[];
    discoveredNodes: Set<string>;
    solvedConnections: Set<string>;
    highlightedNodes: Set<string>;
    highlightedEdges: Set<string>;
    filterType: string | null;
    showLabels: boolean;
    isTracing: boolean;
    isolatedNodeId: string | null;
    isolatedNodeIds: Set<string>;
    isolatedEdgeIds: Set<string>;
}

export function usePuzzleInteraction(graph: CodeGraph) {
    const [state, setState] = useState<PuzzleState>({
        selectedNodeId: null,
        hoveredNodeId: null,
        tracingFrom: null,
        tracePath: [],
        traceEdges: [],
        discoveredNodes: new Set(graph.nodes.filter(n => n.type === 'module').map(n => n.id)),
        solvedConnections: new Set(),
        highlightedNodes: new Set(),
        highlightedEdges: new Set(),
        filterType: null,
        showLabels: true,
        isTracing: false,
        isolatedNodeId: null,
        isolatedNodeIds: new Set(),
        isolatedEdgeIds: new Set(),
    });

    const adjacency = useMemo(() => {
        const adj = new Map<string, { outgoing: GraphEdge[]; incoming: GraphEdge[] }>();
        graph.nodes.forEach(n => adj.set(n.id, { outgoing: [], incoming: [] }));
        graph.edges.forEach(e => {
            adj.get(e.source)?.outgoing.push(e);
            adj.get(e.target)?.incoming.push(e);
        });
        return adj;
    }, [graph]);

    const selectNode = useCallback((nodeId: string | null) => {
        setState(prev => {
            if (!nodeId) {
                return {
                    ...prev,
                    selectedNodeId: null,
                    highlightedNodes: new Set(),
                    highlightedEdges: new Set(),
                };
            }

            const newDiscovered = new Set(prev.discoveredNodes);
            const connectedNodeIds = new Set<string>();
            const connectedEdgeIds = new Set<string>();

            newDiscovered.add(nodeId);
            connectedNodeIds.add(nodeId);

            const nodeAdj = adjacency.get(nodeId);
            if (nodeAdj) {
                nodeAdj.outgoing.forEach(e => {
                    connectedNodeIds.add(e.target);
                    connectedEdgeIds.add(e.id);
                    newDiscovered.add(e.target);
                });
                nodeAdj.incoming.forEach(e => {
                    connectedNodeIds.add(e.source);
                    connectedEdgeIds.add(e.id);
                    newDiscovered.add(e.source);
                });
            }

            return {
                ...prev,
                selectedNodeId: nodeId,
                discoveredNodes: newDiscovered,
                highlightedNodes: connectedNodeIds,
                highlightedEdges: connectedEdgeIds,
            };
        });
    }, [adjacency]);

    const isolateNode = useCallback((nodeId: string) => {
        setState(prev => {
            const connectedNodeIds = new Set<string>();
            const connectedEdgeIds = new Set<string>();

            connectedNodeIds.add(nodeId);

            const nodeAdj = adjacency.get(nodeId);
            if (nodeAdj) {
                nodeAdj.outgoing.forEach(e => {
                    connectedNodeIds.add(e.target);
                    connectedEdgeIds.add(e.id);
                });
                nodeAdj.incoming.forEach(e => {
                    connectedNodeIds.add(e.source);
                    connectedEdgeIds.add(e.id);
                });
            }

            return {
                ...prev,
                selectedNodeId: nodeId,
                highlightedNodes: connectedNodeIds,
                highlightedEdges: connectedEdgeIds,
                isolatedNodeId: nodeId,
                isolatedNodeIds: connectedNodeIds,
                isolatedEdgeIds: connectedEdgeIds,
            };
        });
    }, [adjacency]);

    const exitIsolation = useCallback(() => {
        setState(prev => ({
            ...prev,
            selectedNodeId: null,
            isolatedNodeId: null,
            isolatedNodeIds: new Set(),
            isolatedEdgeIds: new Set(),
            highlightedNodes: new Set(),
            highlightedEdges: new Set(),
            isTracing: false,
            tracingFrom: null,
            tracePath: [],
            traceEdges: [],
        }));
    }, []);

    // Clicking an edge shows ONLY the two connected nodes + that edge
    const isolateEdge = useCallback((edgeId: string) => {
        const edge = graph.edges.find(e => e.id === edgeId);
        if (!edge) return;
        const connectedNodeIds = new Set<string>([edge.source, edge.target]);
        const connectedEdgeIds = new Set<string>([edgeId]);
        setState(prev => {
            const newDiscovered = new Set(prev.discoveredNodes);
            connectedNodeIds.forEach(id => newDiscovered.add(id));
            return {
                ...prev,
                selectedNodeId: null,
                highlightedNodes: connectedNodeIds,
                highlightedEdges: connectedEdgeIds,
                isolatedNodeId: edge.source,
                isolatedNodeIds: connectedNodeIds,
                isolatedEdgeIds: connectedEdgeIds,
                discoveredNodes: newDiscovered,
            };
        });
    }, [graph.edges]);

    const hoverNode = useCallback((nodeId: string | null) => {
        setState(prev => ({ ...prev, hoveredNodeId: nodeId }));
    }, []);

    const traceExecutionFrom = useCallback((startNodeId: string) => {
        const path: string[] = [startNodeId];
        const edgePath: string[] = [];
        const visited = new Set<string>([startNodeId]);

        let current = startNodeId;
        for (let i = 0; i < 20; i++) {
            const nodeAdj = adjacency.get(current);
            if (!nodeAdj) break;

            const callEdges = nodeAdj.outgoing.filter(e =>
                (e.type === 'call' || e.type === 'data-flow') && !visited.has(e.target)
            );

            if (callEdges.length === 0) break;

            const next = callEdges[0];
            visited.add(next.target);
            path.push(next.target);
            edgePath.push(next.id);
            current = next.target;
        }

        setState(prev => {
            const newDiscovered = new Set(prev.discoveredNodes);
            path.forEach(id => newDiscovered.add(id));

            const newSolved = new Set(prev.solvedConnections);
            edgePath.forEach(id => newSolved.add(id));

            return {
                ...prev,
                tracingFrom: startNodeId,
                tracePath: path,
                traceEdges: edgePath,
                isTracing: true,
                discoveredNodes: newDiscovered,
                solvedConnections: newSolved,
                highlightedNodes: new Set(path),
                highlightedEdges: new Set(edgePath),
                isolatedNodeId: startNodeId,
                isolatedNodeIds: new Set(path),
                isolatedEdgeIds: new Set(edgePath),
            };
        });
    }, [adjacency]);

    const stopTracing = useCallback(() => {
        setState(prev => ({
            ...prev,
            tracingFrom: null,
            tracePath: [],
            traceEdges: [],
            isTracing: false,
            isolatedNodeId: null,
            isolatedNodeIds: new Set(),
            isolatedEdgeIds: new Set(),
            highlightedNodes: new Set(),
            highlightedEdges: new Set(),
        }));
    }, []);

    const toggleTrace = useCallback(() => {
        setState(prev => {
            if (prev.isTracing) {
                return { ...prev, isTracing: false, tracingFrom: null, tracePath: [], traceEdges: [] };
            }
            if (prev.selectedNodeId) {
                traceExecutionFrom(prev.selectedNodeId);
            }
            return prev;
        });
    }, [traceExecutionFrom]);

    const setFilterType = useCallback((type: string | null) => {
        setState(prev => ({ ...prev, filterType: type }));
    }, []);

    const toggleLabels = useCallback(() => {
        setState(prev => ({ ...prev, showLabels: !prev.showLabels }));
    }, []);

    const clearSelection = useCallback(() => {
        setState(prev => ({
            ...prev,
            selectedNodeId: null,
            highlightedNodes: new Set(),
            highlightedEdges: new Set(),
            isTracing: false,
            tracingFrom: null,
            tracePath: [],
            traceEdges: [],
        }));
    }, []);

    const isIsolated = state.isolatedNodeId !== null;

    const visibleNodes = useMemo(() => {
        let nodes = graph.nodes;

        if (isIsolated) {
            nodes = nodes.filter(n => state.isolatedNodeIds.has(n.id));
        }

        if (state.filterType) {
            nodes = nodes.filter(n => n.type === state.filterType);
        }

        return nodes;
    }, [graph.nodes, state.filterType, isIsolated, state.isolatedNodeIds]);

    const visibleEdges = useMemo(() => {
        if (isIsolated) {
            return graph.edges.filter(e => state.isolatedEdgeIds.has(e.id));
        }

        const visibleIds = new Set(visibleNodes.map(n => n.id));
        return graph.edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
    }, [graph.edges, visibleNodes, isIsolated, state.isolatedEdgeIds]);

    const selectedNode = useMemo(() =>
        state.selectedNodeId ? graph.nodes.find(n => n.id === state.selectedNodeId) || null : null,
        [graph.nodes, state.selectedNodeId]
    );

    const discoveryProgress = useMemo(() => {
        if (!graph.nodes.length) return 0;
        return Math.round((state.discoveredNodes.size / graph.nodes.length) * 100);
    }, [state.discoveredNodes.size, graph.nodes.length]);

    return {
        state,
        selectedNode,
        visibleNodes,
        visibleEdges,
        discoveryProgress,
        isIsolated,
        selectNode,
        isolateNode,
        isolateEdge,
        exitIsolation,
        hoverNode,
        traceExecutionFrom,
        stopTracing,
        toggleTrace,
        setFilterType,
        toggleLabels,
        clearSelection,
    };
}
