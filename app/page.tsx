"use client";

import InteractiveAvatar from "@/components/InteractiveAvatar";
export default function App() {
  return (
    <div className="w-screen min-h-screen flex flex-col bg-gradient-to-b from-black to-indigo-950">
      <div className="w-[900px] flex flex-col items-start justify-start gap-5 mx-auto pt-4 pb-20">
        <div className="w-full rounded-xl overflow-hidden shadow-2xl shadow-indigo-500/20">
          <InteractiveAvatar />
        </div>
        <div className="w-full text-center mt-6 text-indigo-400 text-sm">
          <p>Powered by Knotie-AI Pro - Your Business AI Assistant</p>
        </div>
      </div>
    </div>
  );
}
