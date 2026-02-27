"use client";

import { ReactNode } from "react";

interface GameLayoutProps {
    children: ReactNode;
    controls: ReactNode;
    gameName: string;
}

export function GameLayout({ children, controls, gameName }: GameLayoutProps) {
    return (
        <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto pb-12">
            {/* Game Area Container */}
            <div className="flex flex-col lg:flex-row gap-0 w-full min-h-[640px] rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl relative">

                {/* Left Control Panel */}
                <div className="flex-shrink-0 w-full lg:w-[320px] bg-gray-800 border-r border-gray-700 z-10 flex flex-col relative shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
                    {controls}
                </div>

                {/* Right Main Game Area */}
                <div className="flex flex-1 items-stretch justify-stretch bg-[#1a1429] relative overflow-hidden">
                    {/* Inner shadow for depth */}
                    <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] pointer-events-none z-10" />

                    <div className="w-full h-full flex items-center justify-center relative z-0">
                        {children}
                    </div>
                </div>
            </div>

            {/* Footer Game Info Expandable */}
            <div className="w-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors">
                    <h3 className="font-bold text-lg text-white">{gameName}</h3>
                </div>
            </div>
        </div>
    );
}
