"use client";
import { usePdfStore, useUploadedStore } from "@/store/uploadStore";

export default function ChatScreenHeader() {
  const uploaded = useUploadedStore((state) => state.uploaded);
  const setUploadedStatus = useUploadedStore(
    (state) => state.setUploadedStatus
  );
  const pdf = usePdfStore((state) => state.pdf);

  return (
    <div
      className={`${
        uploaded ? "h-8 text-xl" : "h-28 text-3xl"
      }  flex justify-center items-center  `}
    >
      {uploaded ? `${pdf?.name}` : "chat with pdf"}
    </div>
  );
}
