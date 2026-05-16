export interface AnalysisResult {
    summary: string;
    techStack: {
        languages: string[];
        frameworks: string[];
        tools: string[];
        packageManager: string;
    };
    complexity: {
        score: number;
        analysis: string;
        metrics: {
            totalFiles: number;
            totalLines: number;
            avgLinesPerFile: number;
        };
    };
    architecture: string;
    errors: Array<{
        file: string;
        line: number;
        type: string;
        message: string;
        severity: string;
        suggestion?: string;
        fixCode?: string;  // Code example showing how to fix
    }>;
    warnings: Array<{
        file: string;
        line: number;
        type: string;
        message: string;
        severity: string;
        suggestion?: string;
        fixCode?: string;  // Code example showing how to fix
    }>;
    packages: {
        all: Array<{
            name: string;
            current: string;
            latest: string;
            status: "up-to-date" | "outdated" | "unknown";
        }>;
        total: number;
        outdated: Array<{
            name: string;
            current: string;
            latest: string;
            status: "outdated";
        }>;
        dependencies: Record<string, string>;
        devDependencies: Record<string, string>;
    };
    fileAnalysis: Array<{
        path: string;
        language: string;
        lines: number;
        size: number;
        purpose: string;
        keyFeatures: string[];
        preview: string;
        content: string;      // Full content
        explanation: string;  // Detailed explanation
    }>;
    qualityAnalysis: Array<{
        category: string;
        issue: string;
        recommendation: string;
        priority: string;
    }>;
    improvements: Array<{
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
    }>;
    isFallback?: boolean;
}
