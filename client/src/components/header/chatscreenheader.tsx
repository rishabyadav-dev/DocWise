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
        uploaded ? "h-8 text-xl" : "h-28 text-3xl mb-30"
      }  flex justify-center items-center  `}
    >
      {uploaded ? (
        `${pdf?.name}`
      ) : (
        <div className="shadow-2xl relative p-7 pt-16 flex-col bg-blue-50  rounded-b-lg flex ga items-center">
          <h1 className="flex items-center">
            📚 Welcome to{"  "}
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-5xl ml-2 origin-left font-semibold text-blue-600"
            >
              {" "}
              DocWise
            </motion.span>
          </h1>
          <h2 className="mx-auto  font-mono">
            Your intelligent document assistant
          </h2>
          <div className="absolute  bg-black/20 p-3 text-center  my-auto w-screen mx-auto font-mono text-2xl text-shadow-blue-700 text-black/80 -bottom-[580px] flex flex-col">
            <div className="text-center">
              <span className="underline-offset-4 underline">
                Upload any PDF
              </span>{" "}
              and{" "}
              <span className="underline-offset-4 underline">
                ask questions
              </span>{" "}
              to get instant, smart answers.
            </div>
            <div className="text-center underline underline-offset-4">
              Perfect for research, legal docs, manuals, and more.
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
