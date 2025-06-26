"use client";
import { usePdfStore, useUploadedStore } from "@/store/uploadStore";
import { motion } from "motion/react";
export default function ChatScreenHeader() {
  const uploaded = useUploadedStore((state) => state.uploaded);
  const setUploadedStatus = useUploadedStore(
    (state) => state.setUploadedStatus
  );
  const pdf = usePdfStore((state) => state.pdf);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className={`${
        uploaded ? "h-8 text-xl" : "h-28 text-3xl"
      }  flex justify-center items-center  `}
    >
      {uploaded ? `${pdf?.name}` : "chat with pdf"}
    </motion.div>
  );
}
