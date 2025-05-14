"use client";

import Link from "next/link";

import { GithubIcon, KnotieAILogo } from "./Icons";

export default function NavBar() {
  return (
    <>
      <div className="flex flex-row justify-between items-center w-[1000px] m-auto p-6">
        <div className="flex flex-row items-center gap-4">
          <div className="flex items-center">
            <KnotieAILogo />
          </div>
          <div className="bg-gradient-to-br from-indigo-400 to-purple-600 bg-clip-text">
            <p className="text-xl font-bold text-transparent">
              Knotie-AI Pro Interactive Avatar
            </p>
          </div>
        </div>
        <div className="flex flex-row items-center gap-6">
          <Link
            href="https://youtube.com/@kno2gether"
            target="_blank"
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 animate-pulse"
          >
            Subscribe to Kno2gether
          </Link>
          <Link
            href="mailto:support@kno2gether.com"
            className="px-4 py-2 border border-indigo-500 text-indigo-400 font-medium rounded-md hover:bg-indigo-500 hover:text-white transition-all duration-300"
          >
            Contact Us
          </Link>
          <Link
            href="mailto:support@knotie-ai.pro"
            className="px-4 py-2 bg-gray-800 text-white font-medium rounded-md hover:bg-gray-700 transition-all duration-300"
          >
            Reach out to Knotie-AI Pro
          </Link>
        </div>
      </div>
    </>
  );
}
