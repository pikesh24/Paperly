'use client'; import axios from 'axios'; import { useRouter } from 'next/navigation';
export default function Home() {
  const router = useRouter();
  const create = async () => { try { const res = await axios.post('http://localhost:5000/api/notes', {}); router.push(`/notes/${res.data.id}`); } catch(e) { alert('Is backend running?'); } };
  return <div className="h-screen flex items-center justify-center"><button onClick={create} className="px-6 py-3 bg-blue-600 text-white rounded text-xl">+ Create Note</button></div>;
}