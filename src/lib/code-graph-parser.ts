export type NodeType = 'class' | 'function' | 'variable' | 'module' | 'interface' | 'enum';
export type EdgeType = 'dependency' | 'call' | 'inheritance' | 'composition' | 'data-flow';
export type NodeStatus = 'healthy' | 'warning' | 'error' | 'unused';

export interface GraphNode {
    id: string;
    label: string;
    type: NodeType;
    filePath: string;
    lineStart: number;
    lineEnd: number;
    code: string;
    description: string;
    status: NodeStatus;
    complexity: number;
    children: string[];
    position?: [number, number, number];
}

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    type: EdgeType;
    label: string;
    weight: number;
}

export interface CodeGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    metadata: {
        totalFiles: number;
        totalNodes: number;
        totalEdges: number;
        maxDepth: number;
        languages: string[];
    };
}

interface FileInfo {
    path: string;
    content: string;
}

const CLASS_REGEX = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*\{/g;
const FUNCTION_REGEX = /(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])\s*=>)/g;
const INTERFACE_REGEX = /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+([\w,\s]+))?\s*\{/g;
const ENUM_REGEX = /(?:export\s+)?enum\s+(\w+)\s*\{/g;
const IMPORT_REGEX = /import\s+(?:(?:\{([^}]+)\}|(\w+))\s+from\s+)?['"]([^'"]+)['"]/g;
const VARIABLE_REGEX = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*(?::\s*[\w<>\[\]|&,\s]+)?\s*=/g;

function getLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
        ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript',
        py: 'Python', java: 'Java', go: 'Go', rs: 'Rust', rb: 'Ruby',
        cs: 'C#', cpp: 'C++', c: 'C', php: 'PHP', swift: 'Swift', kt: 'Kotlin',
    };
    return map[ext] || ext;
}

function findBlockEnd(content: string, startIdx: number): number {
    let depth = 0;
    let inString = false;
    let stringChar = '';
    for (let i = startIdx; i < content.length; i++) {
        const ch = content[i];
        if (inString) {
            if (ch === stringChar && content[i - 1] !== '\\') inString = false;
            continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') {
            inString = true;
            stringChar = ch;
        } else if (ch === '{') {
            depth++;
        } else if (ch === '}') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return Math.min(startIdx + 500, content.length);
}

function lineAt(content: string, charIdx: number): number {
    return content.substring(0, charIdx).split('\n').length;
}

function estimateComplexity(code: string): number {
    let score = 1;
    const patterns = [/\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g, /\bswitch\b/g,
        /\bcatch\b/g, /\?\?/g, /\?\./g, /&&/g, /\|\|/g, /\?\s*.*\s*:/g];
    for (const p of patterns) {
        const matches = code.match(p);
        if (matches) score += matches.length;
    }
    return Math.min(score, 20);
}

function moduleId(filePath: string): string {
    return filePath.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
}

export function parseCodeToGraph(
    files: FileInfo[],
    errors?: Array<{ file: string; line: number; severity: string }>,
    warnings?: Array<{ file: string; line: number; severity: string }>,
    fileAnalysis?: Array<{ path: string; explanation: string; purpose: string; keyFeatures?: string[] }>
): CodeGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeMap = new Map<string, GraphNode>();
    const languages = new Set<string>();
    let edgeCounter = 0;

    const errorMap = new Map<string, Set<number>>();
    const warningMap = new Map<string, Set<number>>();
    (errors || []).forEach(e => {
        if (!errorMap.has(e.file)) errorMap.set(e.file, new Set());
        errorMap.get(e.file)!.add(e.line);
    });
    (warnings || []).forEach(w => {
        if (!warningMap.has(w.file)) warningMap.set(w.file, new Set());
        warningMap.get(w.file)!.add(w.line);
    });

    function getStatus(filePath: string, lineStart: number, lineEnd: number): NodeStatus {
        const eLines = errorMap.get(filePath);
        if (eLines) {
            for (let l = lineStart; l <= lineEnd; l++) {
                if (eLines.has(l)) return 'error';
            }
        }
        const wLines = warningMap.get(filePath);
        if (wLines) {
            for (let l = lineStart; l <= lineEnd; l++) {
                if (wLines.has(l)) return 'warning';
            }
        }
        return 'healthy';
    }

    function addNode(node: GraphNode) {
        if (!nodeMap.has(node.id)) {
            nodeMap.set(node.id, node);
            nodes.push(node);
        }
    }

    function addEdge(source: string, target: string, type: EdgeType, label: string) {
        if (nodeMap.has(source) && nodeMap.has(target) && source !== target) {
            edges.push({
                id: `edge_${edgeCounter++}`,
                source, target, type, label, weight: 1,
            });
        }
    }

    const filteredFiles = files.filter(f =>
        !f.path.includes('node_modules') &&
        !f.path.includes('.lock') &&
        !f.path.endsWith('.min.js') &&
        !f.path.endsWith('.map') &&
        !f.path.endsWith('.json') &&
        !f.path.endsWith('.css') &&
        !f.path.endsWith('.md')
    );

    for (const file of filteredFiles) {
        const lang = getLanguage(file.path);
        languages.add(lang);
        const modId = moduleId(file.path);
        const fileName = file.path.split('/').pop() || file.path;
        const totalLines = file.content.split('\n').length;

        const aiData = fileAnalysis?.find(f => f.path === file.path);
        const description = aiData
            ? `${aiData.purpose}: ${aiData.explanation}`
            : `Module: ${fileName} (${totalLines} lines, ${lang})`;

        addNode({
            id: modId,
            label: fileName,
            type: 'module',
            filePath: file.path,
            lineStart: 1,
            lineEnd: totalLines,
            code: file.content.slice(0, 200),
            description,
            status: getStatus(file.path, 1, totalLines),
            complexity: estimateComplexity(file.content),
            children: [],
        });

        let match: RegExpExecArray | null;

        CLASS_REGEX.lastIndex = 0;
        while ((match = CLASS_REGEX.exec(file.content)) !== null) {
            const className = match[1];
            const parentClass = match[2];
            const blockStart = match.index;
            const blockEnd = findBlockEnd(file.content, blockStart);
            const ls = lineAt(file.content, blockStart);
            const le = lineAt(file.content, blockEnd);
            const classCode = file.content.substring(blockStart, blockEnd + 1);
            const classId = `${modId}__class_${className}`;

            addNode({
                id: classId,
                label: className,
                type: 'class',
                filePath: file.path,
                lineStart: ls,
                lineEnd: le,
                code: classCode.slice(0, 300),
                description: `Class ${className}${parentClass ? ` extends ${parentClass}` : ''}`,
                status: getStatus(file.path, ls, le),
                complexity: estimateComplexity(classCode),
                children: [],
            });

            const modNode = nodeMap.get(modId);
            if (modNode) modNode.children.push(classId);
            addEdge(modId, classId, 'composition', 'contains');

            if (parentClass) {
                const parentId = findNodeByName(parentClass);
                if (parentId) addEdge(classId, parentId, 'inheritance', 'extends');
            }

            const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[\w<>\[\]|&,\s]+)?\s*\{/g;
            methodRegex.lastIndex = 0;
            let methodMatch;
            while ((methodMatch = methodRegex.exec(classCode)) !== null) {
                const methodName = methodMatch[1];
                if (['if', 'for', 'while', 'switch', 'catch', 'constructor'].includes(methodName)) continue;
                const mStart = blockStart + methodMatch.index;
                const mEnd = findBlockEnd(file.content, mStart);
                const mls = lineAt(file.content, mStart);
                const mle = lineAt(file.content, mEnd);
                const methodId = `${classId}__method_${methodName}`;
                const methodCode = file.content.substring(mStart, mEnd + 1);

                addNode({
                    id: methodId,
                    label: `${className}.${methodName}()`,
                    type: 'function',
                    filePath: file.path,
                    lineStart: mls,
                    lineEnd: mle,
                    code: methodCode.slice(0, 200),
                    description: `Method ${methodName} of class ${className}`,
                    status: getStatus(file.path, mls, mle),
                    complexity: estimateComplexity(methodCode),
                    children: [],
                });

                const classNode = nodeMap.get(classId);
                if (classNode) classNode.children.push(methodId);
                addEdge(classId, methodId, 'composition', 'has method');
            }
        }

        FUNCTION_REGEX.lastIndex = 0;
        while ((match = FUNCTION_REGEX.exec(file.content)) !== null) {
            const funcName = match[1] || match[2];
            if (!funcName || funcName.length < 2) continue;
            if (['if', 'for', 'while', 'switch', 'catch', 'return', 'const', 'let', 'var'].includes(funcName)) continue;

            const blockStart = match.index;
            const blockEnd = findBlockEnd(file.content, blockStart);
            const ls = lineAt(file.content, blockStart);
            const le = lineAt(file.content, blockEnd);
            const funcCode = file.content.substring(blockStart, blockEnd + 1);
            const funcId = `${modId}__func_${funcName}`;

            if (nodeMap.has(funcId)) continue;

            addNode({
                id: funcId,
                label: `${funcName}()`,
                type: 'function',
                filePath: file.path,
                lineStart: ls,
                lineEnd: le,
                code: funcCode.slice(0, 200),
                description: `Function ${funcName} in ${fileName}`,
                status: getStatus(file.path, ls, le),
                complexity: estimateComplexity(funcCode),
                children: [],
            });

            const modNode = nodeMap.get(modId);
            if (modNode) modNode.children.push(funcId);
            addEdge(modId, funcId, 'composition', 'contains');
        }

        INTERFACE_REGEX.lastIndex = 0;
        while ((match = INTERFACE_REGEX.exec(file.content)) !== null) {
            const ifaceName = match[1];
            const blockStart = match.index;
            const blockEnd = findBlockEnd(file.content, blockStart);
            const ls = lineAt(file.content, blockStart);
            const le = lineAt(file.content, blockEnd);
            const ifaceId = `${modId}__iface_${ifaceName}`;

            addNode({
                id: ifaceId,
                label: ifaceName,
                type: 'interface',
                filePath: file.path,
                lineStart: ls,
                lineEnd: le,
                code: file.content.substring(blockStart, blockEnd + 1).slice(0, 200),
                description: `Interface ${ifaceName}`,
                status: 'healthy',
                complexity: 1,
                children: [],
            });

            const modNode = nodeMap.get(modId);
            if (modNode) modNode.children.push(ifaceId);
            addEdge(modId, ifaceId, 'composition', 'defines');
        }

        ENUM_REGEX.lastIndex = 0;
        while ((match = ENUM_REGEX.exec(file.content)) !== null) {
            const enumName = match[1];
            const blockStart = match.index;
            const blockEnd = findBlockEnd(file.content, blockStart);
            const ls = lineAt(file.content, blockStart);
            const le = lineAt(file.content, blockEnd);
            const enumId = `${modId}__enum_${enumName}`;

            addNode({
                id: enumId,
                label: enumName,
                type: 'enum',
                filePath: file.path,
                lineStart: ls,
                lineEnd: le,
                code: file.content.substring(blockStart, blockEnd + 1).slice(0, 200),
                description: `Enum ${enumName}`,
                status: 'healthy',
                complexity: 1,
                children: [],
            });

            const modNode = nodeMap.get(modId);
            if (modNode) modNode.children.push(enumId);
            addEdge(modId, enumId, 'composition', 'defines');
        }

        IMPORT_REGEX.lastIndex = 0;
        while ((match = IMPORT_REGEX.exec(file.content)) !== null) {
            const importPath = match[3];
            if (importPath.startsWith('.')) {
                const resolvedMod = resolveImportPath(file.path, importPath);
                const targetModId = findModuleNode(resolvedMod);
                if (targetModId) {
                    addEdge(modId, targetModId, 'dependency', 'imports');
                }
            }
        }

        const topLevelVars: RegExpExecArray[] = [];
        VARIABLE_REGEX.lastIndex = 0;
        while ((match = VARIABLE_REGEX.exec(file.content)) !== null) {
            const varName = match[1];
            if (varName.length < 3) continue;
            if (['import', 'export', 'require', 'module'].includes(varName)) continue;
            const ls = lineAt(file.content, match.index);
            if (ls <= 5 || file.content.substring(match.index, match.index + 200).includes('=>')) continue;
            topLevelVars.push(match);
        }

        for (const v of topLevelVars.slice(0, 5)) {
            const varName = v[1];
            const ls = lineAt(file.content, v.index);
            const varId = `${modId}__var_${varName}`;

            addNode({
                id: varId,
                label: varName,
                type: 'variable',
                filePath: file.path,
                lineStart: ls,
                lineEnd: ls,
                code: file.content.split('\n')[ls - 1]?.trim() || '',
                description: `Variable ${varName} in ${fileName}`,
                status: 'healthy',
                complexity: 1,
                children: [],
            });

            const modNode = nodeMap.get(modId);
            if (modNode) modNode.children.push(varId);
            addEdge(modId, varId, 'composition', 'contains');
        }
    }

    for (const file of filteredFiles) {
        const modId = moduleId(file.path);
        const funcNodes = nodes.filter(n => n.filePath === file.path && n.type === 'function');
        for (const fn of funcNodes) {
            for (const other of nodes) {
                if (other.id === fn.id) continue;
                if (other.type === 'function' || other.type === 'class') {
                    const callName = other.label.replace(/[()]/g, '').split('.').pop() || '';
                    if (callName.length > 2 && fn.code.includes(callName + '(')) {
                        addEdge(fn.id, other.id, 'call', 'calls');
                    }
                }
            }
        }
    }

    const referenced = new Set<string>();
    edges.forEach(e => { referenced.add(e.source); referenced.add(e.target); });
    nodes.forEach(n => {
        if (n.type !== 'module' && !referenced.has(n.id) && n.status === 'healthy') {
            n.status = 'unused';
        }
    });

    applyForceLayout(nodes, edges);

    return {
        nodes,
        edges,
        metadata: {
            totalFiles: filteredFiles.length,
            totalNodes: nodes.length,
            totalEdges: edges.length,
            maxDepth: computeMaxDepth(nodes, edges),
            languages: Array.from(languages),
        },
    };

    function findNodeByName(name: string): string | undefined {
        for (const [id, n] of nodeMap) {
            if (n.label === name || n.label === `${name}()`) return id;
        }
        return undefined;
    }

    function findModuleNode(resolvedPath: string): string | undefined {
        const candidates = [resolvedPath, resolvedPath + '.ts', resolvedPath + '.tsx',
            resolvedPath + '.js', resolvedPath + '.jsx', resolvedPath + '/index.ts',
            resolvedPath + '/index.tsx', resolvedPath + '/index.js'];
        for (const c of candidates) {
            const mid = moduleId(c);
            if (nodeMap.has(mid)) return mid;
        }
        return undefined;
    }
}

function resolveImportPath(fromFile: string, importPath: string): string {
    const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
    const parts = importPath.split('/');
    let resolved = fromDir;
    for (const part of parts) {
        if (part === '.') continue;
        if (part === '..') {
            resolved = resolved.substring(0, resolved.lastIndexOf('/'));
        } else {
            resolved = resolved + '/' + part;
        }
    }
    return resolved;
}

function computeMaxDepth(nodes: GraphNode[], edges: GraphEdge[]): number {
    const adj = new Map<string, string[]>();
    edges.forEach(e => {
        if (!adj.has(e.source)) adj.set(e.source, []);
        adj.get(e.source)!.push(e.target);
    });

    let maxD = 0;
    function dfs(nodeId: string, depth: number, visited: Set<string>) {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        maxD = Math.max(maxD, depth);
        for (const child of adj.get(nodeId) || []) {
            dfs(child, depth + 1, visited);
        }
    }

    const roots = nodes.filter(n => n.type === 'module');
    for (const r of roots) {
        dfs(r.id, 0, new Set());
    }
    return maxD;
}

function applyForceLayout(nodes: GraphNode[], edges: GraphEdge[]) {
    const typeLayerMap: Record<NodeType, number> = {
        module: 0, class: 1, interface: 1, enum: 1, function: 2, variable: 3,
    };

    const moduleNodes = nodes.filter(n => n.type === 'module');
    const moduleCount = moduleNodes.length;
    const gridCols = Math.ceil(Math.sqrt(moduleCount));
    const spacing = 12;

    const modulePositions = new Map<string, [number, number]>();
    moduleNodes.forEach((mod, i) => {
        const col = i % gridCols;
        const row = Math.floor(i / gridCols);
        const x = (col - gridCols / 2) * spacing;
        const z = (row - Math.floor(moduleCount / gridCols) / 2) * spacing;
        modulePositions.set(mod.id, [x, z]);
        mod.position = [x, 0, z];
    });

    for (const node of nodes) {
        if (node.type === 'module') continue;

        const parentModule = nodes.find(n =>
            n.type === 'module' && n.filePath === node.filePath
        );

        if (parentModule && parentModule.position) {
            const [bx, , bz] = parentModule.position;
            const layer = typeLayerMap[node.type];
            const siblings = nodes.filter(n =>
                n.filePath === node.filePath && n.type === node.type
            );
            const idx = siblings.indexOf(node);
            const total = siblings.length;
            const angle = (idx / Math.max(total, 1)) * Math.PI * 2;
            const radius = 3 + layer * 1.5;

            node.position = [
                bx + Math.cos(angle) * radius,
                layer * 3,
                bz + Math.sin(angle) * radius,
            ];
        } else {
            node.position = [
                (Math.random() - 0.5) * 20,
                typeLayerMap[node.type] * 3,
                (Math.random() - 0.5) * 20,
            ];
        }
    }
}
