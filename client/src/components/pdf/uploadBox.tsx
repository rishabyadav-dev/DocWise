"use client";
import {
  usePdfStore,
  useSuggestionsStore,
  useUploadedStore,
} from "@/store/uploadStore";
import axios from "axios";
import { Loader2, Plus, PlusSquare, UploadIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "../ui/button";
const loadPdfjs = async () => {
  const pdfjsLib = await import("pdfjs-dist");

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  return pdfjsLib;
};
const MyDropzone = () => {
  const setPdf = usePdfStore((state) => state.setPdf);
  const pdf = usePdfStore((state) => state.pdf);
  const [isSending, setIsSending] = useState(false);
  const setSuggestions = useSuggestionsStore((state) => state.setSuggestions);
  const uploaded = useUploadedStore((state) => state.uploaded);
  const setUploaded = useUploadedStore((state) => state.setUploadedStatus);
  async function HandleSendFiles() {
    if (isSending || !pdf) return;
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append("file", pdf);

      localStorage.removeItem("backendToken");
      let token: string | null = localStorage.getItem("backendToken");
      if (!token) {
        const response = await axios.get(`/api/backendJWT`);
        token = response.data as string;
        localStorage.setItem("backendToken", token);
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload_pdf/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payload = {
        summary: response.data.summary,
        suggested_questions: response.data.suggested_questions,
        num_chunks: response.data.num_chunks,
      };
      setSuggestions(payload);
      console.log(payload);
      setUploaded(true);

      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Error: Failed to upload file`);
    } finally {
      setIsSending(false);
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (file && file.type === "application/pdf") {
          try {
            const pdfjsLib = await loadPdfjs();

            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer })
              .promise;
            const pageCount = pdfDoc.numPages;
            if (pageCount <= 0 || pageCount > 200) {
              toast.error(
                `PDF has ${pageCount} pages. Maximum 20 pages allowed.`,
              );
              return;
            }

            pdfDoc.destroy();
          } catch (error) {
            console.error("Failed to read PDF:", error);
            toast.error(
              "Failed to read PDF file. Please ensure it's a valid PDF.",
            );
            return;
          }
        }
        setPdf(file);
        console.log("Uploaded file:", file.name);
        toast.success(`File selected: ${file.name}`);
      }

      if (fileRejections.length > 0) {
        console.warn("Rejected files:", fileRejections);
        toast.error("Max file size allowed: 10MB");
      }
    },
    [],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 1024 * 1024 * 5,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
    },
  });

  const dropzoneBorderColor = isDragAccept
    ? "border-green-500"
    : isDragReject
      ? "border-red-500"
      : "border-gray-300";

  return (
    !uploaded && (
      <AnimatePresence>
        <motion.div className="flex justify-center items-center min-h-[400px] p-4">
          <motion.div
            layout
            className={`
        ${pdf ? "bg-white border-gray-200  border-2 shadow-xl" : ""}
        max-h-[600px]  max-w-[90vw] w-full
        overflow-hidden rounded-lg
      `}
          >
            {!pdf && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                key="upload-view-area"
                {...getRootProps({})}
                className={`
                  flex flex-col items-center justify-center
                  p-12 rounded-lg hover:border-2 border-1 border-dashed hover:border-dashed
                  bg-gradient-to-br from-blue-100/80 to-blue-300/80
                  dark:from-blue-900/50 dark:to-blue-800/60
                  hover:from-blue-200/90 hover:to-blue-400/90
                  dark:hover:from-blue-800/60 dark:hover:to-blue-700/70
                  shadow-xl hover:shadow-2xl
                  dark:shadow-blue-900/40 dark:hover:shadow-blue-800/50
                  transition-all duration-300 ease-in-out
                  cursor-pointer outline-none
                  min-h-[300px]
                  text-gray-900 dark:text-gray-50 font-medium
                  ${dropzoneBorderColor}
                  ${
                    isDragActive
                      ? "border-blue-600 dark:border-blue-300 bg-gradient-to-br from-blue-200/90 to-blue-400/90 dark:from-blue-800/70 dark:to-blue-700/80 scale-105"
                      : "border-gray-400 dark:border-gray-500 hover:border-blue-500 dark:hover:border-blue-400"
                  }
                `}
              >
                <input {...getInputProps()} />

                <motion.div
                  animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="text-6xl mb-4 text-gray-700 dark:text-gray-300">
                    📁
                  </div>

                  {isDragActive ? (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xl font-medium text-blue-700 dark:text-blue-300"
                    >
                      Drop your file here...
                    </motion.p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        Drag & drop your file here
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        or click to browse
                      </p>
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/80 text-red-700 dark:text-red-300 text-sm font-medium">
                        📄 PDF & TXT files only
                      </div>
                    </div>
                  )}
                </motion.div>

                {isDragAccept && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 text-center"
                  >
                    <div className="text-green-600 mb-2">
                      <PlusSquare className="animate-pulse w-8 h-8 mx-auto" />
                    </div>
                  </motion.div>
                )}

                {isDragReject && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <p className="text-red-500 font-medium">
                      ❌ Only PDF & TXT files are supported
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {pdf && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 relative shadow-md dark:shadow-gray-900/50"
              >
                {!isSending && (
                  <Button
                    disabled={isSending}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 w-8 h-8 flex justify-center items-center cursor-pointer rounded-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white shadow-lg z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPdf(null);
                    }}
                  >
                    <Plus className="size-6 rotate-45" />
                  </Button>
                )}

                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="text-6xl text-gray-600 dark:text-gray-400"
                  >
                    📄
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 truncate max-w-xs">
                      {pdf.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(pdf.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6"
                >
                  <Button
                    className={`
                      cursor-pointer
                      w-full h-12 rounded-lg font-semibold text-base
                      transition-all duration-200
                      ${
                        isSending
                          ? "bg-blue-900 dark:bg-blue-950 text-white cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-500 to-blue-800 dark:from-blue-600 dark:to-blue-900 hover:from-blue-600 hover:to-blue-900 dark:hover:from-blue-700 dark:hover:to-blue-950 hover:ring-1 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.01]"
                      }
                    `}
                    disabled={isSending}
                    onClick={HandleSendFiles}
                  >
                    {isSending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-white">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Upload File</span>
                        <UploadIcon className="w-5 h-5" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  );
};

export default MyDropzone;
