"use client";
import { useState } from "react";
import { Input } from "../ui/input";
export default function InputBox() {
  const [text, setText] = useState("");
  return (
    <div>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="rounded-full w-full h-16 bg-black/20  text-black font-sans !text-3xl"
      />
    </div>
  );
}
