import InputBox from "@/components/chat/inputBox";
import MyDropzone from "@/components/pdf/uploadBox";

export default function Home() {
  return (
    <div className=" relative text-2xl flex flex-col text-white w-full">
      <div className="text-4xl text-black font-sans text-center">
        chat with pdf app
      </div>
      <div className="justify-center items-center mt-24 w-full">
        <MyDropzone />
      </div>
      <div className="w-3xl absolute  -bottom-90 backdrop-blur-lg  inset-x-0 mx-auto">
        <InputBox />
      </div>
    </div>
  );
}
