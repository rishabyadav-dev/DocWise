"use client";
import { useIsStreamingStore } from "@/store/uploadStore";
import { ChartNoAxesGantt, FileSearch2Icon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Loader from "../ui/loader";
export default function InputBox({
  setAnswer,
  askQuestion,
}: {
  askQuestion: (arg: string) => void;
  setAnswer: any;
}) {
  const isStreaming = useIsStreamingStore((state) => state.isStreaming);

  const [text, setText] = useState("");
  const handleSendquestion = () => {
    if (isStreaming) {
      toast.info("let current answer finish before asking other");
      return;
    }

    if (text.trim().length === 0) {
      console.log("input filed empty!!");

      toast.error("question field is empty");
      return;
    }
    try {
      askQuestion(text);
    } catch (error) {
      toast.error("Error:try again later");
    }
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="flex   border-1 border-slate-300 h-14 shadow-sm w-full gap-1 rounded-lg overflow-hidden p-1.5  "
    >
      {isStreaming && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="h-full flex text-black justify-center items-center"
        >
          <Loader size={15}></Loader>
        </motion.div>
      )}
      <Button
        onClick={() => setAnswer("")}
        disabled={isStreaming}
        title="See suggestions"
        className="bg-blue-200 text-black hover:text-white cursor-pointer  w-fit m-auto h-full "
      >
        <ChartNoAxesGantt className="size-7 " />
      </Button>
      <Input
        disabled={isStreaming}
        placeholder="Ask questions "
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSendquestion();
          }
        }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className=" rounded-full  w-full px-3 h-full  bg-blue-100 font-sans hover:bg-blue-200 hover:shadow-inner   border-slate-300 placeholder:text-black/45   !text-2xl"
      />
      <Button
        disabled={isStreaming}
        className=" rounded-full text-center bg-green-200 text-black hover:text-white hover:bg-black hover:border-0 border-slate-300   border-2 hover:scale-[1.05] duration-500 cursor-pointer h-full w-12"
        onClick={handleSendquestion}
      >
        <FileSearch2Icon className=" hover:text-white  size-7" />
      </Button>
    </motion.div>
  );
}
