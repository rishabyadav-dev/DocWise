import { create } from "zustand";

type UploadStore = {
  uploaded: boolean;
  setUploadedStatus: (value: boolean) => void;
};
type PdfStore = {
  pdf: File | null;
  setPdf: (value: File | null) => void;
};

export const useUploadedStore = create<UploadStore>((set) => ({
  uploaded: false,
  setUploadedStatus: (value) => set({ uploaded: value }),
}));
export const usePdfStore = create<PdfStore>((set) => ({
  pdf: null,
  setPdf: (value) => set({ pdf: value }),
}));
