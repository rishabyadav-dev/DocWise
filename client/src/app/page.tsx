// client/src/app/page.tsx
import AnswerViewArea from "@/components/chat/answerViewArea";
import MyDropzone from "@/components/pdf/uploadBox";

export default function Home() {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="text-4xl text-black font-sans text-center">
        chat with pdf app
      </div>
      <div className="flex justify-center items-center mt-24 w-full">
        <MyDropzone />
      </div>
      <div className="flex-1 relative flex flex-col min-h-0">
        <AnswerViewArea />
      </div>
    </div>
  );
}
