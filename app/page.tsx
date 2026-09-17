"use client";
import { useState } from "react";
import { Button } from "./components/ui/button";
import {
  TooltipContent,
  TooltipTrigger,
  Tooltip,
  TooltipProvider,
} from "./components/ui/tooltip";
import { motion } from "framer-motion";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex flex-col bg-[#161616] min-h-screen">
        <div className="absolute top-0 left-0 p-6 md:p-0 md:m-24 inline-block">
          <Tooltip>
            <TooltipTrigger>
              <motion.span
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="font-manrope text-white md:text-[3rem] text-[2rem] cursor-pointer select-none inline-block leading-none"
              >
                beaver
              </motion.span>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              align="center"
              sideOffset={16}
              className="font-manrope text-zinc-400 bg-transparent border-none max-w-xs shadow-none p-0 md:m-0"
            >
              <p className="text-[0.9rem] leading-relaxed tracking-tight">
                Nature's builders. Automating course scheduling via AI syllabus extraction.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {!loggedIn && (
          <div className="flex flex-1 justify-center items-center text-white">
            <Button className="md:w-48 w-52 md:h-12 h-16 rounded-lg md:text-[1.05rem] text-[1.25rem] font-manrope font-normal border border-neutral-800 bg-transparent text-neutral-200 cursor-pointer transition-transform duration-300 ease-out hover:scale-[1.05]">
              login with <span className="font-semibold ml-1">Google</span>
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
