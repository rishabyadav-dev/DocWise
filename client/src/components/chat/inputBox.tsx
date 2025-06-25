"use client";
import { FileSearch2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
export default function InputBox({
  askQuestion,
}: {
  askQuestion: (arg: string) => void;
}) {
  const [text, setText] = useState("");
  const handleSendquestion = () => {
    toast.info("in handle send function");

    if (text.trim().length === 0) {
      console.log("input filed empty!!");

      toast.error("question field is empty");
      return;
    }
    askQuestion(text);
  };
  return (
    <div className="flex shadow-xl  shadow-black/30 w-full gap-1.5 rounded-lg overflow-hidden p-1.5  backdrop-blur-lg">
      <Input
        placeholder="Ask questions from your pdf"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSendquestion();
          }
        }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className=" rounded-lg w-full px-6 h-14 bg-black/20 placeholder:text-black/45 text-black font-sans !text-3xl"
      />
      <Button
        className=" rounded-lg text-center hover:bg-black/70 hover:scale-97 duration-500 cursor-pointer h-14 w-16 bg-black/80"
        onClick={() => {
          handleSendquestion();
        }}
      >
        <FileSearch2Icon className="size-9" />
      </Button>
    </div>
  );
}
