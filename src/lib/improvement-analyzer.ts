/**
 * Improvement analyzer - suggests code improvements
 * Analyzes code for complexity, performance, and quality issues
 */

interface Improvement {
    category: 'complexity' | 'performance' | 'duplication' | 'security' | 'best-practice' | 'refactoring';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    file: string;
    line?: number;
    currentCode?: string;
    suggestedCode?: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
}

export function analyzeForImprovements(files: { path: string; content: string }[]): Improvement[] {
    const improvements: Improvement[] = [];
    const MAX_IMPROVEMENTS = 50; // Limit to prevent overwhelming

    files.forEach(file => {
        const lines = file.content.split('\n');
        const content = file.content;

        // 1. COMPLEXITY ANALYSIS

        // Check for long functions
        const functionMatches = content.matchAll(/(?:function|const)\s+(\w+)\s*[=\(]/g);
        for (const match of functionMatches) {
            const funcName = match[1];
            const funcStart = match.index || 0;
            const funcContent = content.substring(funcStart, funcStart + 2000);
            const funcLines = funcContent.split('\n').length;

            if (funcLines > 50) {
                improvements.push({
                    category: 'complexity',
                    priority: funcLines > 100 ? 'high' : 'medium',
                    title: `Long function: ${funcName}`,
                    description: `Function has ${funcLines} lines. Consider breaking it into smaller functions.`,
                    file: file.path,
                    impact: 'Improves readability and maintainability',
                    effort: 'medium'
                });
            }
        }

        // Check for deep nesting
        lines.forEach((line, index) => {
            const indentLevel = line.search(/\S/);
            if (indentLevel > 20) { // More than 5 levels of indentation (assuming 4 spaces)
                improvements.push({
                    category: 'complexity',
                    priority: 'medium',
                    title: 'Deep nesting detected',
                    description: 'Code has deep nesting levels. Consider extracting to separate functions.',
                    file: file.path,
                    line: index + 1,
                    impact: 'Reduces cognitive complexity',
                    effort: 'low'
                });
            }
        });

        // 2. PERFORMANCE ANALYSIS

        // Check for inefficient loops
        if (content.includes('.map(') && content.includes('.filter(') && content.includes('.map(')) {
            const chainedCalls = content.match(/\.(?:map|filter|reduce)\([^)]+\)\.(?:map|filter|reduce)/g);
            if (chainedCalls && chainedCalls.length > 0) {
                improvements.push({
                    category: 'performance',
                    priority: 'low',
                    title: 'Chained array operations',
                    description: 'Multiple chained array operations can be optimized into a single pass.',
                    file: file.path,
                    currentCode: 'array.filter(...).map(...).filter(...)',
                    suggestedCode: 'array.reduce((acc, item) => { /* combined logic */ }, [])',
                    impact: 'Reduces iterations and improves performance',
                    effort: 'medium'
                });
            }
        }

        // Check for missing React.memo or useMemo
        if (file.path.endsWith('.tsx') || file.path.endsWith('.jsx')) {
            if (content.includes('export default function') && !content.includes('React.memo') && !content.includes('memo(')) {
                improvements.push({
                    category: 'performance',
                    priority: 'low',
                    title: 'Consider memoization',
                    description: 'React component could benefit from memoization to prevent unnecessary re-renders.',
                    file: file.path,
                    suggestedCode: 'export default React.memo(ComponentName);',
                    impact: 'Prevents unnecessary re-renders',
                    effort: 'low'
                });
            }
        }

        // 3. CODE DUPLICATION

        // Simple duplication check - look for repeated blocks
        const codeBlocks = content.split('\n\n').filter(block => block.trim().length > 100);
        const blockCounts = new Map<string, number>();

        codeBlocks.forEach(block => {
            const normalized = block.trim();
            blockCounts.set(normalized, (blockCounts.get(normalized) || 0) + 1);
        });

        blockCounts.forEach((count, block) => {
            if (count > 1 && improvements.length < MAX_IMPROVEMENTS) {
                improvements.push({
                    category: 'duplication',
                    priority: 'medium',
                    title: 'Duplicate code detected',
                    description: `Code block appears ${count} times. Consider extracting to a reusable function.`,
                    file: file.path,
                    impact: 'Reduces code duplication and improves maintainability',
                    effort: 'medium'
                });
            }
        });

        // 4. BEST PRACTICES

        // Check for missing error boundaries in React
        if ((file.path.endsWith('.tsx') || file.path.endsWith('.jsx')) &&
            content.includes('export default') &&
            !content.includes('ErrorBoundary') &&
            !content.includes('componentDidCatch')) {
            improvements.push({
                category: 'best-practice',
                priority: 'medium',
                title: 'Add error boundary',
                description: 'React components should be wrapped in error boundaries to handle runtime errors gracefully.',
                file: file.path,
                impact: 'Improves error handling and user experience',
                effort: 'low'
            });
        }

        // Check for hardcoded values
        const hardcodedNumbers = content.match(/=\s*\d{3,}/g);
        if (hardcodedNumbers && hardcodedNumbers.length > 3) {
            improvements.push({
                category: 'best-practice',
                priority: 'low',
                title: 'Extract magic numbers to constants',
                description: 'Multiple hardcoded numbers found. Consider extracting to named constants.',
                file: file.path,
                currentCode: 'const timeout = 5000;',
                suggestedCode: 'const TIMEOUT_MS = 5000; const timeout = TIMEOUT_MS;',
                impact: 'Improves code readability and maintainability',
                effort: 'low'
            });
        }

        // Check for missing PropTypes or TypeScript interfaces
        if ((file.path.endsWith('.jsx') || file.path.endsWith('.tsx')) &&
            content.includes('function') &&
            content.includes('props') &&
            !content.includes('interface') &&
            !content.includes('PropTypes') &&
            !content.includes('type Props')) {
            improvements.push({
                category: 'best-practice',
                priority: 'medium',
                title: 'Add type definitions for props',
                description: 'Component props should have type definitions for better type safety.',
                file: file.path,
                suggestedCode: 'interface Props { /* define props */ }',
                impact: 'Improves type safety and developer experience',
                effort: 'low'
            });
        }

        // 5. SECURITY

        // Check for eval usage
        if (content.includes('eval(')) {
            improvements.push({
                category: 'security',
                priority: 'high',
                title: 'Avoid using eval()',
                description: 'eval() is dangerous and can lead to code injection vulnerabilities.',
                file: file.path,
                impact: 'Critical security improvement',
                effort: 'medium'
            });
        }

        // Check for innerHTML usage
        if (content.includes('innerHTML') || content.includes('dangerouslySetInnerHTML')) {
            improvements.push({
                category: 'security',
                priority: 'high',
                title: 'Potential XSS vulnerability',
                description: 'Using innerHTML or dangerouslySetInnerHTML can lead to XSS attacks. Sanitize user input.',
                file: file.path,
                suggestedCode: 'Use DOMPurify.sanitize() or avoid innerHTML',
                impact: 'Prevents XSS attacks',
                effort: 'low'
            });
        }

        // 6. REFACTORING OPPORTUNITIES

        // Check for long parameter lists
        const longParamFunctions = content.matchAll(/function\s+\w+\s*\(([^)]{50,})\)/g);
        for (const match of longParamFunctions) {
            improvements.push({
                category: 'refactoring',
                priority: 'low',
                title: 'Long parameter list',
                description: 'Function has many parameters. Consider using an options object.',
                file: file.path,
                currentCode: 'function foo(a, b, c, d, e, f)',
                suggestedCode: 'function foo({ a, b, c, d, e, f })',
                impact: 'Improves function signature clarity',
                effort: 'low'
            });
        }

        // Check for switch statements that could be objects
        const switchStatements = content.match(/switch\s*\([^)]+\)\s*{[^}]{200,}}/g);
        if (switchStatements && switchStatements.length > 0) {
            improvements.push({
                category: 'refactoring',
                priority: 'low',
                title: 'Replace switch with object lookup',
                description: 'Large switch statements can often be replaced with object lookups for better maintainability.',
                file: file.path,
                impact: 'Improves code organization',
                effort: 'medium'
            });
        }
    });

    // Sort by priority and limit
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return improvements
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        .slice(0, MAX_IMPROVEMENTS);
}
