"use client";
import { usePdfStore, useUploadedStore } from "@/store/uploadStore";
import { MenuIcon } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { useSidebar } from "../ui/sidebar";
export default function ChatScreenHeader() {
  const uploaded = useUploadedStore((state) => state.uploaded);
  const setUploadedStatus = useUploadedStore(
    (state) => state.setUploadedStatus
  );
  const { isMobile, setOpenMobile } = useSidebar();
  const pdf = usePdfStore((state) => state.pdf);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className={`${
        uploaded ? "h-12 lg:h-8 lg:text-xl" : "h-28 text-3xl mb-30"
      }  flex justify-center items-center  `}
    >
      {uploaded ? (
        <div className="flex w-full  items-center ">
          {isMobile && (
            <div className=" ml-2 mr-auto">
              <Button
                onClick={() => setOpenMobile(true)}
                className="bg-gray-500 size-11"
              >
                <MenuIcon className="size-8" />
              </Button>
            </div>
          )}
          <div className="lg:mx-auto mr-32">{pdf?.name}</div>
        </div>
      ) : (
        <div className="shadow-2xl relative p-7 pt-16 flex-col bg-blue-50  rounded-b-lg flex ga items-center">
          <h1 className="flex items-center">
            📚 Welcome to{"  "}
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6 }}
              className="lg:text-5xl ml-2 origin-left font-semibold text-blue-600"
            >
              {" "}
              DocWise
            </motion.span>
          </h1>
          <h2 className="mx-auto  font-mono">
            Your intelligent document assistant
          </h2>
          <div className="absolute  bg-black/20 p-3 text-center  my-auto w-screen mx-auto font-mono text-lg lg:text-2xl text-shadow-blue-700 text-black/80 lg:-bottom-[580px] -bottom-[600px] flex flex-col">
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
