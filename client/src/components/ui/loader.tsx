import { LoaderIcon } from "lucide-react";

export default function Loader({ size }: { size: number }) {
  return <LoaderIcon className={`text-input size-${size} animate-spin`} />;
}
