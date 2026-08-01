"use client";

import React from "react";

interface TechAiLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function TechAiLogo({ className = "", size = "md" }: TechAiLogoProps) {
  const sizeClasses = {
    sm: "h-6 text-lg",
    md: "h-8 text-2xl",
    lg: "h-12 text-4xl",
    xl: "h-16 text-5xl",
  };

  return (
    <div className={`inline-flex items-center select-none font-bold tracking-tight ${sizeClasses[size]} ${className}`}>
      <span className="text-[#0D5C75] font-extrabold tracking-wider flex items-center">
        TEC
        <span className="relative inline-block mx-[1px]">
          H
          <span className="absolute inset-y-0 left-0 right-0 flex items-center justify-center opacity-80 pointer-events-none">
            <span className="w-full h-[60%] bg-white/10 flex justify-between px-[1px]">
              <span className="w-[1px] bg-[#0D5C75]"></span>
              <span className="w-[2px] bg-[#0D5C75]"></span>
              <span className="w-[1px] bg-[#0D5C75]"></span>
              <span className="w-[3px] bg-[#0D5C75]"></span>
              <span className="w-[1px] bg-[#0D5C75]"></span>
            </span>
          </span>
        </span>
      </span>

      <span className="w-3"></span>

      <span className="text-[#0D5C75] font-extrabold flex items-center">
        A
        <span className="relative inline-block">
          <span className="text-[#0D5C75]">i</span>
          <span className="absolute -top-[0.2em] right-[0.05em] w-[0.28em] h-[0.28em] bg-[#E52E2E] rounded-[1px] shadow-sm"></span>
        </span>
      </span>
    </div>
  );
}
