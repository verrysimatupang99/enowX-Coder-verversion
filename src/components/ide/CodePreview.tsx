import Editor from '@monaco-editor/react';

interface CodePreviewProps {
  content: string;
  language?: string;
  readOnly?: boolean;
}

export function CodePreview({ content, language = 'typescript', readOnly = true }: CodePreviewProps) {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={content}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  );
}
