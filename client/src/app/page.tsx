import AnswerViewArea from "@/components/chat/answerViewArea";
import ChatScreenHeader from "@/components/header/chatscreenheader";
import MyDropzone from "@/components/pdf/uploadBox";

export default async function Home() {
  return (
    <div className="flex flex-col h-full rounded-lg  bg-slate-50 my-2 ring-1 overflow-hidden ring-slate-200  w-full">
      <ChatScreenHeader />
      <div className="flex justify-center min-w-0 min-h-0 items-center  w-full">
        <MyDropzone />
      </div>
      <div className="  relative flex flex-col ">
        <AnswerViewArea />
      </div>
    </div>
  );
}
