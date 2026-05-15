import { cn } from "@/lib/utils";
import { getInitials } from "@/utils";
import Image from "next/image";

interface ProfileImageProps {
  url?: string;
  name: string;
  className?: string;
  textClassName?: string;
  bgColor?: string;
}

export const ProfileImage = ({
  url,
  name,
  className,
  textClassName,
  bgColor,
}: ProfileImageProps) => {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        height={40}
        width={40}
        className={cn(
          "w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm",
        className
      )}
      style={{ backgroundColor: bgColor ?? "#0ea5e9" }}
    >
      <span
        className={cn(
          "text-sm font-semibold text-white uppercase",
          textClassName
        )}
      >
        {getInitials(name)}
      </span>
    </div>
  );
};
