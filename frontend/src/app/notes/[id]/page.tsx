import MixedEditor from '@/components/Editor/MixedEditor';

export default function NotePage({ params }: { params: { id: string } }) {
  return <MixedEditor noteId={params.id} />;
}