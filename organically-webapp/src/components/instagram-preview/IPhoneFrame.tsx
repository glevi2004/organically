"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// iPhone 15 Pro dimensions (CSS pixels)
// Viewport: 393 x 852
// We scale it down for display purposes

interface IPhoneFrameProps {
  children: ReactNode;
  /** Scale factor for the phone (1 = full size 393x852, 0.5 = half size) */
  scale?: number;
  /** Show the status bar */
  showStatusBar?: boolean;
  /** Show the home indicator */
  showHomeIndicator?: boolean;
  /** Additional className for the outer container */
  className?: string;
  /** Background color for the screen area */
  screenBackground?: string;
}

// Status bar component
function StatusBar() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const time = `${hours}:${minutes}`;

  return (
    <div className="flex items-center justify-between px-6 py-3 text-sm font-semibold text-black dark:text-white">
      <span className="w-14">{time}</span>
      
      {/* Dynamic Island spacer */}
      <div className="w-[126px]" />
      
      {/* Right side icons */}
      <div className="flex items-center gap-1 w-14 justify-end">
        {/* Cellular */}
        <svg className="w-[17px] h-[11px]" viewBox="0 0 17 11" fill="currentColor">
          <path d="M1 6.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3Zm4-2a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-5Zm4-2a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-7Zm4-2a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-9Z" />
        </svg>
        {/* WiFi */}
        <svg className="w-[15px] h-[11px]" viewBox="0 0 15 11" fill="currentColor">
          <path d="M7.5 2.5c2.7 0 5.2 1.1 7 2.9l-1.4 1.4c-1.5-1.5-3.5-2.3-5.6-2.3s-4.1.8-5.6 2.3L.5 5.4c1.8-1.8 4.3-2.9 7-2.9Zm0 3c1.7 0 3.2.7 4.2 1.8l-1.4 1.4c-.7-.7-1.7-1.2-2.8-1.2-1.1 0-2.1.4-2.8 1.2L3.3 7.3c1-.9 2.5-1.8 4.2-1.8Zm0 3c.8 0 1.6.3 2.1.9l-2.1 2.1-2.1-2.1c.5-.6 1.3-.9 2.1-.9Z" />
        </svg>
        {/* Battery */}
        <svg className="w-[25px] h-[11px]" viewBox="0 0 25 11" fill="currentColor">
          <rect x="0.5" y="0.5" width="21" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.35" fill="none" />
          <rect x="2" y="2" width="18" height="7" rx="1.5" />
          <path d="M23 4v3a1.5 1.5 0 0 0 0-3Z" fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

// Home indicator component
function HomeIndicator() {
  return (
    <div className="flex justify-center pb-2 pt-1">
      <div className="w-[134px] h-[5px] bg-black dark:bg-white rounded-full opacity-80" />
    </div>
  );
}

export function IPhoneFrame({
  children,
  scale = 0.55,
  showStatusBar = true,
  showHomeIndicator = true,
  className,
  screenBackground,
}: IPhoneFrameProps) {
  // iPhone 15 Pro dimensions
  const deviceWidth = 393;
  const deviceHeight = 852;
  const frameThickness = 12;
  const borderRadius = 55;
  const screenBorderRadius = 47;
  
  // Dynamic Island dimensions
  const dynamicIslandWidth = 126;
  const dynamicIslandHeight = 37;

  return (
    <div
      className={cn("iphone-frame-container", className)}
      style={{
        width: (deviceWidth + frameThickness * 2) * scale,
        height: (deviceHeight + frameThickness * 2) * scale,
      }}
    >
      {/* Outer frame - the titanium body */}
      <div
        className="relative bg-[#1c1c1e] dark:bg-[#2c2c2e] shadow-2xl"
        style={{
          width: deviceWidth + frameThickness * 2,
          height: deviceHeight + frameThickness * 2,
          borderRadius: borderRadius,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {/* Side buttons - Volume */}
        <div
          className="absolute bg-[#3a3a3c] rounded-l-sm"
          style={{
            left: -2,
            top: 160,
            width: 3,
            height: 32,
          }}
        />
        <div
          className="absolute bg-[#3a3a3c] rounded-l-sm"
          style={{
            left: -2,
            top: 200,
            width: 3,
            height: 64,
          }}
        />
        <div
          className="absolute bg-[#3a3a3c] rounded-l-sm"
          style={{
            left: -2,
            top: 272,
            width: 3,
            height: 64,
          }}
        />
        
        {/* Side button - Power */}
        <div
          className="absolute bg-[#3a3a3c] rounded-r-sm"
          style={{
            right: -2,
            top: 220,
            width: 3,
            height: 96,
          }}
        />

        {/* Screen bezel area */}
        <div
          className="absolute overflow-hidden"
          style={{
            left: frameThickness,
            top: frameThickness,
            width: deviceWidth,
            height: deviceHeight,
            borderRadius: screenBorderRadius,
            backgroundColor: screenBackground || undefined,
          }}
        >
          {/* Screen content with proper background */}
          <div 
            className={cn(
              "relative w-full h-full flex flex-col",
              !screenBackground && "bg-white dark:bg-black"
            )}
          >
            {/* Dynamic Island */}
            <div className="absolute top-0 left-0 right-0 flex justify-center pt-[11px] z-50 pointer-events-none">
              <div
                className="bg-black rounded-[20px]"
                style={{
                  width: dynamicIslandWidth,
                  height: dynamicIslandHeight,
                }}
              />
            </div>

            {/* Status bar */}
            {showStatusBar && (
              <div className="flex-shrink-0 z-40">
                <StatusBar />
              </div>
            )}

            {/* Main content area */}
            <div className="flex-1 overflow-hidden relative">
              {children}
            </div>

            {/* Home indicator */}
            {showHomeIndicator && (
              <div className="flex-shrink-0 z-40">
                <HomeIndicator />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

