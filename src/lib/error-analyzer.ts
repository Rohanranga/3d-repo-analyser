/**
 * Error and warning analyzer
 * Detects common issues in code
 */

export function analyzeCodeForErrors(files: { path: string; content: string }[]) {
    const errorMap = new Map<string, any>();
    const warningMap = new Map<string, any>();

    const addError = (error: any) => {
        const key = `${error.file}:${error.type}:${error.message}`;
        if (errorMap.has(key)) {
            errorMap.get(key).count++;
        } else {
            errorMap.set(key, { ...error, count: 1 });
        }
    };

    const addWarning = (warning: any) => {
        const key = `${warning.file}:${warning.type}:${warning.message}`;
        if (warningMap.has(key)) {
            warningMap.get(key).count++;
        } else {
            warningMap.set(key, { ...warning, count: 1 });
        }
    };

    files.forEach(file => {
        const lines = file.content.split('\n');
        const content = file.content;
        const ext = file.path.split('.').pop()?.toLowerCase() || '';
        const isTS = ext === 'ts' || ext === 'tsx';
        const isJS = ext === 'js' || ext === 'jsx' || isTS;
        const isPy = ext === 'py';

        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();

            // === CRITICAL / ERROR level ===

            // eval() usage - code injection risk
            if (isJS && /\beval\s*\(/.test(trimmed)) {
                addError({
                    file: file.path, line: lineNum, type: 'Security',
                    message: 'eval() usage — code injection risk',
                    severity: 'critical',
                    suggestion: 'Use JSON.parse(), Function constructor, or refactor logic',
                    fixCode: '// Replace eval() with a safe alternative'
                });
            }

            // innerHTML / dangerouslySetInnerHTML - XSS risk
            if (isJS && (/\.innerHTML\s*=/.test(trimmed) || /dangerouslySetInnerHTML/.test(trimmed))) {
                addError({
                    file: file.path, line: lineNum, type: 'Security',
                    message: 'Direct HTML injection — XSS vulnerability',
                    severity: 'critical',
                    suggestion: 'Sanitize HTML with DOMPurify or use textContent instead',
                    fixCode: 'element.textContent = userInput; // or use DOMPurify.sanitize()'
                });
            }

            // Hardcoded secrets
            if (/(?:api[_-]?key|secret|password|token|auth)\s*[:=]\s*['"][^'"]{8,}['"]/i.test(trimmed) &&
                !trimmed.includes('process.env') && !trimmed.includes('import.meta.env') &&
                !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
                addError({
                    file: file.path, line: lineNum, type: 'Security',
                    message: 'Potential hardcoded secret or API key',
                    severity: 'critical',
                    suggestion: 'Move to environment variables',
                    fixCode: 'const apiKey = process.env.API_KEY;'
                });
            }

            // debugger statement
            if (isJS && /\bdebugger\b/.test(trimmed) && !trimmed.startsWith('//')) {
                addError({
                    file: file.path, line: lineNum, type: 'Debug Code',
                    message: 'debugger statement left in code',
                    severity: 'error',
                    suggestion: 'Remove before committing',
                    fixCode: '// Remove debugger;'
                });
            }

            // document.write — blocks rendering, security risk
            if (isJS && /document\.write\s*\(/.test(trimmed)) {
                addError({
                    file: file.path, line: lineNum, type: 'Security',
                    message: 'document.write() — blocks rendering and XSS risk',
                    severity: 'error',
                    suggestion: 'Use DOM manipulation methods instead',
                    fixCode: 'document.getElementById("target").textContent = value;'
                });
            }

            // Unhandled .then() without .catch()
            if (isJS && /\.then\s*\(/.test(trimmed) && !content.slice(index * 80, (index + 5) * 80).includes('.catch')) {
                addWarning({
                    file: file.path, line: lineNum, type: 'Error Handling',
                    message: 'Promise .then() without .catch() — unhandled rejection',
                    severity: 'warning',
                    suggestion: 'Add .catch() or use try/catch with await',
                    fixCode: '.then(result => {...}).catch(error => console.error(error));'
                });
            }

            // === WARNING level ===

            // console.log/error/warn in production
            if (isJS && /\bconsole\.(log|error|warn|debug|info)\s*\(/.test(trimmed) && !trimmed.startsWith('//')) {
                addWarning({
                    file: file.path, line: lineNum, type: 'Code Quality',
                    message: 'Console statement found in code',
                    severity: 'warning',
                    suggestion: 'Remove or use a proper logging library',
                    fixCode: '// Remove console statement or use logger'
                });
            }

            // var usage
            if (isJS && /\bvar\s+\w/.test(trimmed) && !trimmed.startsWith('//')) {
                addWarning({
                    file: file.path, line: lineNum, type: 'Modern JS',
                    message: 'Using "var" instead of "let" or "const"',
                    severity: 'warning',
                    suggestion: 'Use const for immutable values, let for mutable',
                    fixCode: trimmed.replace(/\bvar\b/, 'const')
                });
            }

            // Loose equality
            if (isJS && /[^!=]==[^=]/.test(trimmed) && !/===/.test(trimmed)) {
                addWarning({
                    file: file.path, line: lineNum, type: 'Type Safety',
                    message: 'Loose equality (==) — use strict equality (===)',
                    severity: 'warning',
                    suggestion: 'Use === for strict equality checks',
                    fixCode: trimmed.replace(/==/g, '===')
                });
            }

            // TODO/FIXME
            if (/\b(TODO|FIXME|HACK|XXX)\b/.test(trimmed)) {
                addWarning({
                    file: file.path, line: lineNum, type: 'Incomplete Code',
                    message: 'TODO/FIXME comment — incomplete implementation',
                    severity: 'info',
                    suggestion: 'Complete the implementation or create an issue'
                });
            }

            // Empty catch blocks
            if (isJS && /catch\s*\([^)]*\)\s*\{\s*\}/.test(trimmed)) {
                addWarning({
                    file: file.path, line: lineNum, type: 'Error Handling',
                    message: 'Empty catch block — errors silently swallowed',
                    severity: 'warning',
                    suggestion: 'Log the error or handle it properly',
                    fixCode: 'catch (error) { console.error("Error:", error); }'
                });
            }

            // : any usage in TypeScript
            if (isTS && (/:\s*any\b/.test(trimmed) || /as\s+any\b/.test(trimmed))) {
                addWarning({
                    file: file.path, line: lineNum, type: 'Type Safety',
                    message: 'Usage of "any" type bypasses TypeScript safety',
                    severity: 'warning',
                    suggestion: 'Use a specific type or "unknown" instead'
                });
            }

            // Nested ternary
            if (isJS && (trimmed.match(/\?/g) || []).length > 1 && (trimmed.match(/:/g) || []).length > 1) {
                addWarning({
                    file: file.path, line: lineNum, type: 'Complexity',
                    message: 'Nested ternary operators — hard to read',
                    severity: 'warning',
                    suggestion: 'Use if-else or extract to a function'
                });
            }

            // setTimeout/setInterval without cleanup in React
            if (isJS && /\b(setTimeout|setInterval)\s*\(/.test(trimmed) &&
                (file.path.includes('.tsx') || file.path.includes('.jsx')) &&
                !content.includes('clearTimeout') && !content.includes('clearInterval')) {
                addWarning({
                    file: file.path, line: lineNum, type: 'Memory Leak',
                    message: 'Timer without cleanup — potential memory leak in React',
                    severity: 'warning',
                    suggestion: 'Clear timer in useEffect cleanup function',
                    fixCode: 'useEffect(() => { const id = setInterval(...); return () => clearInterval(id); }, []);'
                });
            }

            // addEventListener without removeEventListener in React
            if (isJS && /addEventListener\s*\(/.test(trimmed) &&
                (file.path.includes('.tsx') || file.path.includes('.jsx')) &&
                !content.includes('removeEventListener')) {
                addWarning({
                    file: file.path, line: lineNum, type: 'Memory Leak',
                    message: 'Event listener without cleanup — memory leak risk',
                    severity: 'warning',
                    suggestion: 'Remove listener in useEffect cleanup',
                    fixCode: 'useEffect(() => { window.addEventListener(...); return () => window.removeEventListener(...); }, []);'
                });
            }

            // Async function without try-catch
            if (isJS && /\bawait\s+/.test(trimmed) && !content.includes('try') && !content.includes('.catch')) {
                addWarning({
                    file: file.path, line: lineNum, type: 'Error Handling',
                    message: 'Async operation without error handling',
                    severity: 'warning',
                    suggestion: 'Wrap in try-catch or add .catch()',
                    fixCode: `try {\n  ${trimmed}\n} catch (error) {\n  console.error(error);\n}`
                });
            }

            // Python specific
            if (isPy) {
                if (/\bexcept\s*:/.test(trimmed) || /\bexcept\s+Exception\s*:/.test(trimmed)) {
                    addWarning({
                        file: file.path, line: lineNum, type: 'Error Handling',
                        message: 'Bare except clause — catches all exceptions including SystemExit',
                        severity: 'warning',
                        suggestion: 'Catch specific exceptions'
                    });
                }
                if (/\bexec\s*\(/.test(trimmed) || /\bos\.system\s*\(/.test(trimmed)) {
                    addError({
                        file: file.path, line: lineNum, type: 'Security',
                        message: 'Command execution — injection risk',
                        severity: 'critical',
                        suggestion: 'Use subprocess.run() with argument list instead'
                    });
                }
            }
        });

        // File-level checks
        const lineCount = lines.length;
        if (lineCount > 300) {
            addWarning({
                file: file.path, line: 0, type: 'File Size',
                message: `Large file (${lineCount} lines) — consider splitting`,
                severity: 'warning',
                suggestion: 'Break into smaller, focused modules'
            });
        }

        if (lineCount > 500) {
            addWarning({
                file: file.path, line: 0, type: 'File Size',
                message: `Very large file (${lineCount} lines) — maintenance risk`,
                severity: 'warning',
                suggestion: 'This file is difficult to maintain; split into sub-modules'
            });
        }

        // Missing TypeScript function return types
        if (isTS) {
            const funcMatches = content.match(/(?:export\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*\{/g) || [];
            funcMatches.forEach(match => {
                if (!match.includes(':') || match.endsWith(') {')) {
                    addWarning({
                        file: file.path, line: 0, type: 'TypeScript',
                        message: `Function without return type annotation`,
                        severity: 'info',
                        suggestion: 'Add explicit return type for better type safety'
                    });
                }
            });
        }
    });

    const finalizeIssues = (map: Map<string, any>) => {
        return Array.from(map.values()).map(item => ({
            ...item,
            message: item.count > 1 ? `${item.message} (${item.count} occurrences)` : item.message
        }));
    };

    return {
        errors: finalizeIssues(errorMap).slice(0, 50),
        warnings: finalizeIssues(warningMap).slice(0, 100)
    };
}
