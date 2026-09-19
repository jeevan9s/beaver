"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Button } from "../ui/button";

export default function UploadButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusText, setStatusText] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusText(`uploaded ${file.name}`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/parse-syllabus", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      <div className="flex flex-col items-center gap-2">
        <Button 
          onClick={() => fileInputRef.current?.click()} 
          className="w-52 md:w-56 2xl:w-64 h-16 md:h-14 2xl:h-18 rounded-lg text-[1.15rem] md:text-[1.1rem] 2xl:text-[1.35rem] font-manrope font-normal bg-transparent text-black cursor-pointer transition-transform duration-300 ease-out hover:bg-transparent hover:scale-[1.04] group overflow-visible"
        >
          upload{" "}
          <span className="font-semibold ml-1 relative inline-block after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[2px] after:bg-black after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left">
            Syllabus PDF
          </span>
        </Button>

        {statusText && (
          <p className="font-manrope text-sm text-neutral-600">{statusText}</p>
        )}
      </div>
    </>
  );
}