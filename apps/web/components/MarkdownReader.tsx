'use client';

declare module '*.css';

import React, { useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
// @ts-ignore: side-effect CSS import for syntax highlighting
import 'highlight.js/styles/atom-one-dark.css';

interface MarkdownReaderProps {
  content: string;
  onFlagSubmit?: (flag: string) => void;
}

interface CodeBlockProps {
  language: string;
  children: string;
}

interface FlashcardProps {
  question: string;
  answer: string;
}

interface CalloutProps {
  type: 'info' | 'warning' | 'tip' | 'danger';
  children: React.ReactNode;
}

// Custom Code Block with Copy Button
function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [children]);

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
          aria-label={copied ? 'Copiado' : 'Copiar código'}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-400">¡Copiado!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar
            </>
          )}
        </button>
      </div>
      
      {/* Code */}
      <pre className="bg-[#0d1117] p-4 overflow-x-auto">
        <code ref={codeRef} className={`language-${language} text-sm`}>
          {children}
        </code>
      </pre>
    </div>
  );
}

// Interactive Flashcard Component
function Flashcard({ question, answer }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="my-6 perspective-1000"
      role="button"
      tabIndex={0}
      onClick={() => setIsFlipped(!isFlipped)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsFlipped(!isFlipped);
        }
      }}
      aria-expanded={isFlipped}
      aria-label="Flashcard interactiva"
    >
      <div
        className={`relative w-full h-48 transition-transform duration-500 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-2 border-blue-600 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 transition-colors">
          <span className="text-xs uppercase tracking-wider text-blue-400 mb-2">Pregunta</span>
          <p className="text-lg font-medium text-white">{question}</p>
          <span className="mt-4 text-sm text-blue-300">Haz clic para ver la respuesta</span>
        </div>
        
        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-green-900/50 to-green-800/30 border-2 border-green-600 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-wider text-green-400 mb-2">Respuesta</span>
          <p className="text-lg font-medium text-white">{answer}</p>
        </div>
      </div>
    </div>
  );
}

// Callout/Alert Component
function Callout({ type, children }: CalloutProps) {
  const styles = {
    info: {
      bg: 'bg-blue-900/20',
      border: 'border-blue-600',
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Información',
    },
    warning: {
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-600',
      icon: (
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      title: 'Advertencia',
    },
    tip: {
      bg: 'bg-green-900/20',
      border: 'border-green-600',
      icon: (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'Consejo',
    },
    danger: {
      bg: 'bg-red-900/20',
      border: 'border-red-600',
      icon: (
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Peligro',
    },
  };

  const style = styles[type];

  return (
    <div className={`my-4 p-4 rounded-lg border-l-4 ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
        <div className="flex-1">
          <p className="font-semibold text-white mb-1">{style.title}</p>
          <div className="text-gray-300 text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Parse custom markdown syntax
function parseCustomSyntax(content: string): string {
  let processed = content;

  // Parse flashcards: :::flashcard{question="..." answer="..."}:::
  processed = processed.replace(
    /:::flashcard\{question="([^"]+)" answer="([^"]+)"\}:::/g,
    '<flashcard question="$1" answer="$2" />'
  );

  // Parse callouts: :::tip|warning|info|danger
  processed = processed.replace(
    /:::(tip|warning|info|danger)\n([\s\S]*?)\n:::/g,
    '<callout type="$1">$2</callout>'
  );

  return processed;
}

export function MarkdownReader({ content, onFlagSubmit }: MarkdownReaderProps) {
  const processedContent = parseCustomSyntax(content);

  // Custom components for react-markdown
  const components = {
    // Override code blocks
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const code = String(children).replace(/\n$/, '');

      if (!inline && language) {
        return <CodeBlock language={language}>{code}</CodeBlock>;
      }

      return (
        <code className="px-1.5 py-0.5 bg-gray-800 rounded text-sm font-mono text-pink-400" {...props}>
          {children}
        </code>
      );
    },

    // Custom flashcard component
    flashcard: ({ question, answer }: FlashcardProps) => (
      <Flashcard question={question} answer={answer} />
    ),

    // Custom callout component
    callout: ({ node, type, children }: any) => (
      <Callout type={type as 'info' | 'warning' | 'tip' | 'danger'}>
        {children}
      </Callout>
    ),

    // Enhanced headings with anchor links
    h1: ({ node, ...props }: any) => (
      <h1 className="text-3xl font-bold text-white mt-8 mb-4 pb-2 border-b border-gray-700" {...props} />
    ),
    h2: ({ node, ...props }: any) => (
      <h2 className="text-2xl font-bold text-white mt-6 mb-3" {...props} />
    ),
    h3: ({ node, ...props }: any) => (
      <h3 className="text-xl font-semibold text-white mt-4 mb-2" {...props} />
    ),

    // Styled paragraphs
    p: ({ node, ...props }: any) => (
      <p className="text-gray-300 leading-relaxed my-3" {...props} />
    ),

    // Lists
    ul: ({ node, ...props }: any) => (
      <ul className="list-disc list-inside space-y-1 my-3 text-gray-300" {...props} />
    ),
    ol: ({ node, ...props }: any) => (
      <ol className="list-decimal list-inside space-y-1 my-3 text-gray-300" {...props} />
    ),
    li: ({ node, ...props }: any) => (
      <li className="pl-1" {...props} />
    ),

    // Links
    a: ({ node, ...props }: any) => (
      <a
        className="text-blue-400 hover:text-blue-300 underline decoration-blue-500/50 hover:decoration-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),

    // Blockquotes
    blockquote: ({ node, ...props }: any) => (
      <blockquote
        className="border-l-4 border-gray-600 pl-4 py-2 my-4 text-gray-400 italic bg-gray-800/30 rounded-r"
        {...props}
      />
    ),

    // Tables
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse" {...props} />
      </div>
    ),
    th: ({ node, ...props }: any) => (
      <th className="px-4 py-2 bg-gray-800 border border-gray-700 text-left text-sm font-semibold text-white" {...props} />
    ),
    td: ({ node, ...props }: any) => (
      <td className="px-4 py-2 border border-gray-700 text-sm text-gray-300" {...props} />
    ),
  };

  return (
    <article className="prose prose-invert max-w-none px-6 py-8">
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={components as any}
      >
        {processedContent}
      </ReactMarkdown>
    </article>
  );
}
