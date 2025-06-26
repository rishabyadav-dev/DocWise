import { LoaderIcon } from "lucide-react";

export default function Loader({ size }: { size: number }) {
  return <LoaderIcon className={`size-${size} animate-spin`} />;
}
