import ReactMarkdown from 'react-markdown'; import remarkGfm from 'remark-gfm';
export default function MarkdownEditor({ content, onChange }) {
  return <div className="h-full grid grid-cols-2 gap-4"><textarea className="p-4 border rounded resize-none" value={content} onChange={(e) => onChange(e.target.value)} /><div className="prose p-4 border rounded overflow-auto"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div></div>;
}