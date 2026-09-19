"use client";

import { Button } from "../ui/button";
import { signIn } from "next-auth/react";

export default function LoginButton() {
  return (
    <Button onClick={() => signIn("google", {callbackUrl: "/"})} className="w-52 md:w-56 2xl:w-64 h-16 md:h-14 2xl:h-18 rounded-lg text-[1.15rem] md:text-[1.1rem] 2xl:text-[1.35rem] font-manrope font-normal bg-transparent text-black cursor-pointer transition-transform duration-300 ease-out hover:bg-transparent hover:scale-[1.04] group overflow-visible">
      login with{" "}
      <span className="font-semibold ml-1 relative inline-block after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[2px] after:bg-black after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left">
        Google
      </span>
    </Button>
  );
}
