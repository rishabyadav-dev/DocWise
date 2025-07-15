"use client";
import { useIsStreamingStore } from "@/store/uploadStore";
import {
  ChartNoAxesGantt,
  FileSearch2Icon,
  Search,
  Sparkle,
} from "lucide-react";
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
      className="flex   h-14 shadow-input w-full gap-1 rounded-lg overflow-hidden p-0.5  "
    >
      <Button
        onClick={() => setAnswer("")}
        disabled={isStreaming}
        title="See suggestions"
        className="bg-accent rounded-lg text-foreground/70 hover:text-white hover:bg-foreground/20 cursor-pointer  w-fit m-auto h-12 "
      >
        <Sparkle className="size-7 " />
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
        className=" rounded-full  w-full px-3 h-full  !bg-accent font-sans hover:bg-foreground hover:shadow-inner   border-input placeholder:text-foreground/40   !text-2xl"
      />
      <Button
        disabled={isStreaming}
        className=" rounded-full text-center dark:bg-green-200 bg-foreground/70 text-black dark:hover:text-white duration-500 cursor-pointer lg:h-12 h-12 my-auto   w-13 lg:w-fit"
        onClick={handleSendquestion}
      >
        {isStreaming ? (
          <Loader size={15}></Loader>
        ) : (
          <Search className="hover:text-foreground text-input lg:size-7 size-5" />
        )}
      </Button>
    </motion.div>
  );
}
