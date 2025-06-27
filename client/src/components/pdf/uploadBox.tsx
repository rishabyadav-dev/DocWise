"use client";
import { usePdfStore, useUploadedStore } from "@/store/uploadStore";
import axios from "axios";
import { Loader2, Plus, PlusSquare, UploadIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "../ui/button";

const MyDropzone = () => {
  const setPdf = usePdfStore((state) => state.setPdf);
  const pdf = usePdfStore((state) => state.pdf);
  const [isSending, setIsSending] = useState(false);

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
        "http://localhost:8000/upload_pdf/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data;
      console.log("response after file upaldoe:", data);
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
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setPdf(file);
        console.log("Uploaded file:", file.name);
        toast.success(`File selected: ${file.name}`);
      }

      if (fileRejections.length > 0) {
        console.warn("Rejected files:", fileRejections);
        toast.error("Max file size allowed: 10MB");
      }
    },
    []
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
    maxSize: 1024 * 1024 * 10,
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
        ${pdf ? "bg-white border-gray-200 border-2 shadow-xl" : ""}
        max-h-[600px] max-w-[90vw] w-full 
        overflow-hidden rounded-lg
      `}
          >
            {!pdf && (
              <motion.div
                key="upload-view-area"
                {...getRootProps({})}
                className={`
            flex flex-col items-center justify-center
            p-12 rounded-lg hover:border-2 border-1 border-dashed hover:border-dashed
            bg-gradient-to-br from-blue-50 to-blue-200
            hover:from-blue-100 hover:to-blue-300
            shadow-lg hover:shadow-xl
            transition-all duration-300 ease-in-out
            cursor-pointer outline-none
            min-h-[300px]
            ${dropzoneBorderColor}
            ${
              isDragActive
                ? "border-blue-500 bg-gradient-to-br from-blue-100 to-blue-300 scale-105"
                : "border-gray-300 hover:border-blue-400"
            }
          `}
              >
                <input {...getInputProps()} />

                <motion.div
                  animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="text-6xl mb-4">📁</div>

                  {isDragActive ? (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xl font-medium text-blue-700"
                    >
                      Drop your file here...
                    </motion.p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-lg font-medium text-gray-700">
                        Drag & drop your file here
                      </p>
                      <p className="text-sm text-gray-500">
                        or click to browse
                      </p>
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
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
                className="bg-white rounded-lg p-6 relative"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 w-8 h-8 flex justify-center items-center cursor-pointer rounded-full bg-red-600 hover:bg-red-600 text-white shadow-lg z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPdf(null);
                  }}
                >
                  <Plus className="size-6 rotate-45" />
                </Button>

                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="text-6xl"
                  >
                    📄
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-gray-800 truncate max-w-xs">
                      {pdf.name}
                    </h3>
                    <p className="text-sm text-gray-500">
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
                    className={` cursor-pointer
                w-full h-12 rounded-lg font-semibold text-base
                transition-all duration-200
                ${
                  isSending
                    ? "bg-blue-900 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-800  hover:from-blue-950 hover:ring-1 hover:to-blue-900 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.01]"
                }
              `}
                    disabled={isSending}
                    onClick={HandleSendFiles}
                  >
                    {isSending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5  animate-spin" />
                        <span className="text-white ">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center  gap-2">
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
