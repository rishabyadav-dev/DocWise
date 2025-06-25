"use client";
import { usePdfStore, useUploadedStore } from "@/store/uploadStore";
import axios from "axios";
import { Plus, UploadIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useCallback } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "../ui/button";

const MyDropzone = () => {
  const setPdf = usePdfStore((state) => state.setPdf);
  const pdf = usePdfStore((state) => state.pdf);
  const isSendingRef = React.useRef(false);
  const uploaded = useUploadedStore((state) => state.uploaded);
  const setUploaded = useUploadedStore((state) => state.setUploadedStatus);
  async function HandleSendFiles() {
    if (isSendingRef.current || !pdf) return;
    isSendingRef.current = true;

    try {
      const formData = new FormData();
      formData.append("file", pdf);

      const response = await axios.post(
        "http://localhost:8000/upload_pdf/",
        formData
      );
      const data = response.data;
      console.log("response after file upaldoe:", data);
      setUploaded(true);

      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Error: Failed to upload file`);
    } finally {
      isSendingRef.current = false;
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
        <div className="fle x justify-center  h-fit items-center">
          <motion.div
            transition={{ duration: 0.2 }}
            className={`${
              pdf ? "bg-gray-200 border-2" : ""
            } lg:max-h-[900px] max-w-[90vw] w-full lg:max-w-[500px] lg:min-w-[200px] overflow-hidden rounded-2xl`}
          >
            {!pdf && (
              <motion.div
                key={`upload-view-area`}
                transition={{ duration: 0.2 }}
                {...getRootProps({})}
                className={`flex flex-col items-center p-10 rounded-2xl bg-slate-50 border-1   hover:bg-slate-200 hover:border-1 border-slate-400 hover:border-dashed shadow-2xl duration-500 text-gray-800 min-h-70 outline-none transition-colors cursor-pointer 
              ${dropzoneBorderColor} ${
                  isDragActive
                    ? "bg-gray-900/30 border-2 w-[800px] border-dashed"
                    : ""
                }`}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p className="text-white">Drop the file here ...</p>
                ) : (
                  <div className="flex flex-col ">
                    <div>Drag file here, or click to select file</div>
                    <div className="text-red-700 text-2xl justify-center items-center flex">
                      .pdf & .txt Only
                    </div>
                  </div>
                )}
                {isDragAccept && (
                  <p className="text-green-500 mt-2">
                    Only .pdf & .txt will be accepted!
                  </p>
                )}
                {isDragReject && (
                  <p className="text-red-500 mt-2">
                    Only .pdf & .txt will be accepted!
                  </p>
                )}
              </motion.div>
            )}

            {pdf && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                key={pdf.name}
                className="border border-gray-200 rounded-2xl p-1 flex h-fit justify-center lg:max-w-full max-w-[85px] flex-col items-center text-center bg-slate-100"
              >
                <div className="relative">
                  <Button
                    className="absolute hover:scale-105 hover:bg-black right-1 top-1 rounded-full flex justify-center items-center cursor-pointer w-7 h-7 bg-black/70 backdrop-blur-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPdf(null);
                    }}
                  >
                    <Plus className={`rotate-45 text-white `} />
                  </Button>
                  <div>
                    <div className="lg:w- w-fit text-xs">
                      <div className="text-3xl">📝</div>
                      <div className="text-2xl font-sans text-black">
                        {pdf.name}
                      </div>{" "}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {pdf && (
              <motion.div className="flex justify-center items-center mt-2">
                <Button
                  key={"sendbutton"}
                  className={`hover:bg-black/80 hover:text-slate-100 border-1 border-slate-500 font-sans font-bold bg-slate-100 text-black/65 duration-500 w-14 lg:w-full lg:h-12 h-12 rounded-2xl cursor-pointer`}
                  disabled={isSendingRef.current}
                  onClick={() => {
                    HandleSendFiles();
                  }}
                >
                  {isSendingRef.current ? (
                    <div className="animate-spin">⏳</div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="text-2xl">Upload</div>
                      <UploadIcon className="size-7" />
                    </div>
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </AnimatePresence>
    )
  );
};

export default MyDropzone;
