import { create } from 'zustand'; import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:5000/api' });
export const useNoteStore = create((set) => ({
  activeNote: null,
  fetchNote: async (id) => { const res = await api.get(`/notes/${id}`); set({ activeNote: res.data }); },
  saveNote: async (id, data) => { const res = await api.put(`/notes/${id}`, data); set({ activeNote: res.data }); },
}));