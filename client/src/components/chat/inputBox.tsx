"use client";
import { FileSearch2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
export default function InputBox({ askQuestion }) {
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
    <div className="flex w-full rounded-full overflow-hidden p-1.5  backdrop-blur-lg">
      <Input
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSendquestion();
          }
        }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className=" rounded-full w-full  h-16 bg-black/20  text-black font-sans !text-3xl"
      />
      <Button
        className=" rounded-full text-center hover:scale-97 duration-500 cursor-pointer h-16 w-20 bg-black/80"
        onClick={() => {
          handleSendquestion();
        }}
      >
        <FileSearch2Icon className="size-9" />
      </Button>
    </div>
  );
}
