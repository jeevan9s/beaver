import { auth } from "./auth";
import {
  TooltipContent,
  TooltipTrigger,
  Tooltip,
  TooltipProvider,
} from "./components/ui/tooltip";
import * as motion from "framer-motion/client"; 
import LoginButton from "./components/custom/LoginButton";
import LogoutButton from "./components/custom/LogoutButton";
import UploadButton from "./components/custom/UploadButton";
import { Upload } from "lucide-react";

export default async function Home() {
  const session = await auth();

  return (
    <TooltipProvider>
      <div className="flex flex-col bg-[#F9F6EE] min-h-screen relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 left-0 p-6 md:p-0 md:m-24 2xl:m-36 inline-block z-10"
        >
          <Tooltip>
            <TooltipTrigger>
              <motion.span
                whileHover={{
                  scale: 1.06,
                  y: -4,
                  transition: { type: "spring", stiffness: 400, damping: 15 },
                }}
                className="font-manrope text-black text-[2.25rem] md:text-[3.5rem] 2xl:text-[5rem] cursor-pointer select-none inline-block leading-none origin-left hover:text-neutral-700 transition-colors duration-200"
              >
                beaver
              </motion.span>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              align="center"
              sideOffset={25}
              className="font-manrope text-black bg-transparent border-none max-w-md mr-10 shadow-none p-0 md:m-0 text-transparent select-none pointer-events-none"
            >
              <p className="text-[0.9rem] 2xl:text-[1.1rem] leading-relaxed tracking-tight text-black whitespace-nowrap">
                inspired by natures builders
              </p>
            </TooltipContent>
          </Tooltip>
          <p className="font-manrope text-black text-[0.95rem] 2xl:text-[1.2rem] leading-relaxed tracking-tight mt-3 max-w-xs 2xl:max-w-md opacity-90">
            Beaver turns syllabi into events and adds them to your calendar.
          </p>
        </motion.div>

        {session && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0 right-0 p-6 md:p-0 md:m-24 2xl:m-36 flex items-center gap-3 z-10"
          >
            <div className="flex flex-col text-right">
              <span className="font-manrope text-black text-[0.95rem] 2xl:text-[1.1rem] font-medium tracking-tight">
                {session.user?.name}
              </span>
              <span className="font-manrope text-neutral-500 text-[0.8rem] 2xl:text-[0.9rem] tracking-tight">
                {session.user?.email}
              </span>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-10 h-10 rounded-full overflow-hidden bg-neutral-200 border border-neutral-300 flex items-center justify-center text-black font-manrope text-sm font-semibold shadow-sm select-none"
            >
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user?.name || "User avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                session.user?.name?.[0]?.toUpperCase() || "U"
              )}
            </motion.div>
          </motion.div>
        )}

        {!session ? (
          <div className="flex flex-1 justify-center items-center text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <LoginButton />
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-1 justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <UploadButton />
            </motion.div>
            <div className="absolute bottom-10 right-20 flex font-manrope">
              <LogoutButton />
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}