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
import DashboardContainer from "./components/custom/DashboardContainer";

const ease = [0.16, 1, 0.3, 1] as const;

export default async function Home() {
  const session = await auth();

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh flex-col overflow-x-hidden bg-[#F9F6EE]">
        <div
          className="
            mx-auto flex w-full max-w-[110rem] flex-1 flex-col
            px-5 pt-[max(1.25rem,env(safe-area-inset-top))]
            pb-[max(1.25rem,env(safe-area-inset-bottom))]
            sm:px-8 sm:pt-8 sm:pb-8
            lg:px-12 lg:pt-12 lg:pb-10
            2xl:px-16 2xl:pt-16 2xl:pb-12
          "
        >
          <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease }}
              className="order-2 lg:order-1"
            >
              <Tooltip>
                <TooltipTrigger>
                  <motion.span
                    whileHover={{
                      scale: 1.03,
                      y: -4,
                      color: "#404040",
                      transition: {
                        type: "spring",
                        stiffness: 400, 
                        damping: 20, 
                      },
                    }}
                    className="inline-block origin-center cursor-pointer select-none font-manrope leading-none text-black text-[2rem] sm:text-[2.5rem] lg:text-[3rem] 2xl:text-[3.5rem]"
                  >
                    beaver
                  </motion.span>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="center"
                  sideOffset={20}
                  className="pointer-events-none max-w-md select-none border-none bg-transparent p-0 font-manrope text-transparent shadow-none"
                >
                  <p className="whitespace-nowrap text-sm leading-relaxed tracking-tight text-black 2xl:text-base">
                    inspired by natures builders
                  </p>
                </TooltipContent>
              </Tooltip>

              <p className="mt-2 whitespace-nowrap font-manrope text-[clamp(0.6rem,2.3vw,0.95rem)] leading-relaxed tracking-tight text-black opacity-90 sm:mt-3 2xl:text-base">
                Beaver turns course syllabi into events and adds them to your
                calendar.
              </p>
            </motion.div>

            {session && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease }}
                className="order-1 flex min-w-0 items-center gap-3 lg:order-2 lg:max-w-[40%] 2xl:gap-4"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="
                    flex size-10 shrink-0 select-none items-center justify-center
                    overflow-hidden rounded-full border border-neutral-300 bg-neutral-200
                    font-manrope text-sm font-semibold text-black shadow-sm
                    2xl:size-12 2xl:text-base
                  "
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user?.name || "User avatar"}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    session.user?.name?.[0]?.toUpperCase() || "U"
                  )}
                </motion.div>

                <div className="flex min-w-0 flex-col text-left">
                  <span className="truncate font-manrope text-sm font-medium leading-tight tracking-tight text-black 2xl:text-base">
                    {session.user?.name}
                  </span>
                  <span className="truncate font-manrope text-xs leading-tight tracking-tight text-neutral-500 2xl:text-sm">
                    {session.user?.email}
                  </span>
                </div>
              </motion.div>
            )}
          </header>

          <main className="flex min-w-0 flex-1 items-center justify-center py-8 sm:py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease }}
              className="flex w-full min-w-0 max-w-full justify-center"
            >
              {session ? <DashboardContainer /> : <LoginButton />}
            </motion.div>
          </main>

          {session && (
            <footer className="flex justify-center font-manrope sm:justify-end">
              <LogoutButton />
            </footer>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
