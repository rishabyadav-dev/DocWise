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
type PDFAnalysisResponse = {
  num_chunks: number;
  summary: string;
  suggested_questions: string[];
};

type SuggestionsStore = {
  suggestions: PDFAnalysisResponse | null;
  setSuggestions: (value: PDFAnalysisResponse | null) => void;
};
export const useSuggestionsStore = create<SuggestionsStore>((set) => ({
  suggestions: null,
  setSuggestions: (value) => set({ suggestions: value }),
}));
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
