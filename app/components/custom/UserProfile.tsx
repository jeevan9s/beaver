import * as motion from "framer-motion/client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface UserProfileProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function UserProfile({ user }: UserProfileProps) {
  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U";

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-0 right-0 p-6 md:p-0 md:m-24 2xl:m-36 flex items-center gap-3 z-10"
    >
      <div className="flex flex-col text-right">
        <span className="font-manrope text-black text-[0.95rem] 2xl:text-[1.1rem] font-medium tracking-tight">
          {user.name}
        </span>
        <span className="font-manrope text-neutral-500 text-[0.8rem] 2xl:text-[0.9rem] tracking-tight">
          {user.email}
        </span>
      </div>

      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="w-10 h-10 rounded-full overflow-hidden bg-neutral-200 border border-neutral-300 flex items-center justify-center text-black font-manrope text-sm font-semibold shadow-sm select-none"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User avatar"}
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </motion.div>
    </motion.div>
  );
}