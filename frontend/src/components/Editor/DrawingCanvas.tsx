'use client'; import dynamic from 'next/dynamic';
const Excalidraw = dynamic(async () => (await import('@excalidraw/excalidraw')).Excalidraw, { ssr: false });
export default function DrawingCanvas({ initialData, onChange }) {
  return <div className="h-[600px] border rounded"><Excalidraw initialData={{ elements: initialData?.elements || [] }} onChange={(els, state) => onChange(els, state)} /></div>;
}