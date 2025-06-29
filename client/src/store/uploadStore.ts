import { create } from "zustand";

type UploadStore = {
  uploaded: boolean;
  setUploadedStatus: (value: boolean) => void;
};
type IsStreamingStore = {
  isStreaming: boolean;
  setIsStreaming: (value: boolean) => void;
};
type PdfStore = {
  pdf: File | null;
  setPdf: (value: File | null) => void;
};
type SuggestionsStore = {
  suggestions: Array<string> | null;
  setSuggestions: (value: Array<string> | null) => void;
};

export const useUploadedStore = create<UploadStore>((set) => ({
  uploaded: false,
  setUploadedStatus: (value) => set({ uploaded: value }),
}));
export const usePdfStore = create<PdfStore>((set) => ({
  pdf: null,
  setPdf: (value) => set({ pdf: value }),
}));
export const useIsStreamingStore = create<IsStreamingStore>((set) => ({
  isStreaming: false,
  setIsStreaming: (value) => set({ isStreaming: value }),
}));
export const useSuggestionsStore = create<SuggestionsStore>((set) => ({
  suggestions: null,
  setSuggestions: (value) => set({ suggestions: value }),
}));
