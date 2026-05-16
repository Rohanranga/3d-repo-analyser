"use client";

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ClassNameValue, twMerge } from 'tailwind-merge';

interface CodeBlockProps {
    children: React.ReactNode;
    className?: string;
    inline?: boolean;
}

export function CodeBlock({ children, className, inline }: CodeBlockProps) {
    const [isCopied, setIsCopied] = useState(false);

    // Extract text content safely from children
    const getTextContent = (node: React.ReactNode): string => {
        if (typeof node === 'string') return node;
        if (Array.isArray(node)) return node.map(getTextContent).join('');
        if (React.isValidElement(node) && node.props) return getTextContent((node as any).props.children);
        return '';
    };

    const codeText = getTextContent(children);

    const copyToClipboard = async () => {
        if (!codeText) return;

        try {
            await navigator.clipboard.writeText(codeText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy!', err);
        }
    };

    if (inline) {
        return (
            <code className={twMerge("bg-black/30 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-sm", className)}>
                {children}
            </code>
        );
    }

    return (
        <div className="relative group my-4 rounded-lg overflow-hidden border border-white/10 bg-[#0d0d0d]">
            <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={copyToClipboard}
                    className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
                    title="Copy code"
                >
                    {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
            <pre className={twMerge("p-4 overflow-x-auto text-sm font-mono leading-relaxed text-gray-300", className)}>
                <code>{children}</code>
            </pre>
        </div>
    );
}
