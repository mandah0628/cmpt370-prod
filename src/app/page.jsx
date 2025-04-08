"use client";

import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export default function Home() {
  const { authState, authLoading } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center mt-10">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow">
      <main className="flex flex-col flex-grow items-center justify-center text-center py-16 px-6 relative overflow-hidden bg-gradient-to-br from-gray-50 via-orange-50 to-gray-50">
        {/* Loop-themed background patterns - reduced to 3 key elements */}
        
        {/* Animated circle that loops in an orbit */}
        <div className="absolute top-1/4 left-1/4 w-6 h-6 border-2 border-orange-200 rounded-full opacity-20 animate-[orbitLoop_8s_linear_infinite]"></div>
        
        {/* Figure-8 looping circle */}
        <div className="absolute top-1/2 left-1/5 w-5 h-5 border-2 border-orange-200 rounded-full opacity-20 animate-[figure8_12s_linear_infinite]"></div>
        
        {/* Infinity symbol (made of two circles) */}
        <div className="absolute bottom-[15%] right-[10%] w-16 h-16 border-2 border-gray-200 rounded-full opacity-15 -translate-x-4"></div>
        <div className="absolute bottom-[15%] right-[10%] w-16 h-16 border-2 border-gray-200 rounded-full opacity-15 translate-x-4"></div>

        <h1 className="text-4xl font-bold relative z-10">
          Let's get the tools <span className="relative inline-block group cursor-pointer">
            <span className="text-orange-500 italic inline-block animate-bounce hover:animate-none transition-all duration-700 ease-in-out group-hover:tracking-wider group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:via-orange-400 group-hover:to-orange-600 group-hover:[transform:perspective(500px)_rotateY(15deg)]" style={{animationDuration: '2s'}}>loop!</span>
            
            {/* Loops orbiting around the word "loop" */}
            <span className="absolute -inset-3 w-full h-full">
              <span className="absolute w-2 h-2 rounded-full bg-orange-200 opacity-60 animate-[orbitWord_3s_linear_infinite] group-hover:animate-[orbitWordFast_1s_linear_infinite] group-hover:bg-orange-300"></span>
              <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-300 opacity-40 animate-[orbitWord_3s_linear_infinite_1.5s] group-hover:animate-[orbitWordFast_1.2s_linear_infinite_0.2s] group-hover:bg-gray-400"></span>
              <span className="absolute w-1 h-1 rounded-full bg-gray-400 opacity-30 animate-[orbitWordCounter_4s_linear_infinite] group-hover:animate-[orbitWordCounterFast_1.5s_linear_infinite] group-hover:bg-orange-400"></span>
            </span>
            
            {/* More dynamic underline */}
            <span className="absolute bottom-0 left-0 w-0 h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-300 animate-[grow_2s_ease-in-out_infinite] group-hover:animate-[growFast_1s_ease-in-out_infinite] group-hover:h-2"></span>
            
            <style jsx>{`
              @keyframes grow {
                0% { width: 0; transform: translateX(0); }
                50% { width: 100%; transform: translateX(0); }
                75% { width: 80%; transform: translateX(20%); }
                100% { width: 0; transform: translateX(100%); }
              }
              
              @keyframes orbitLoop {
                0% { transform: translateX(0) translateY(0); }
                25% { transform: translateX(60px) translateY(-30px); }
                50% { transform: translateX(120px) translateY(0); }
                75% { transform: translateX(60px) translateY(30px); }
                100% { transform: translateX(0) translateY(0); }
              }
              
              @keyframes figure8 {
                0% { transform: translate(0, 0); }
                12.5% { transform: translate(30px, -40px); }
                25% { transform: translate(60px, 0); }
                37.5% { transform: translate(30px, 40px); }
                50% { transform: translate(0, 0); }
                62.5% { transform: translate(-30px, -40px); }
                75% { transform: translate(-60px, 0); }
                87.5% { transform: translate(-30px, 40px); }
                100% { transform: translate(0, 0); }
              }

              @keyframes orbitWord {
                0% { transform: rotate(0deg) translateX(15px) rotate(0deg); }
                100% { transform: rotate(360deg) translateX(15px) rotate(-360deg); }
              }
              
              @keyframes orbitWordCounter {
                0% { transform: rotate(0deg) translateX(10px) rotate(0deg); }
                100% { transform: rotate(-360deg) translateX(10px) rotate(360deg); }
              }
              
              @keyframes orbitWordFast {
                0% { transform: rotate(0deg) translateX(20px) rotate(0deg); }
                100% { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
              }
              
              @keyframes orbitWordCounterFast {
                0% { transform: rotate(0deg) translateX(15px) rotate(0deg); }
                100% { transform: rotate(-360deg) translateX(15px) rotate(360deg); }
              }
              
              @keyframes growFast {
                0% { width: 0; transform: translateX(0); }
                50% { width: 100%; transform: translateX(0); }
                75% { width: 80%; transform: translateX(20%); }
                100% { width: 0; transform: translateX(100%); }
              }
            `}</style>
            
            <span className={`absolute -inset-1 bg-orange-100 rounded-lg -z-10 opacity-0 ${isAnimating ? 'animate-ping' : ''}`} style={{animationDuration: '6s', animationIterationCount: '3'}}></span>
          </span>
        </h1>
        
        <p className="mt-4 text-gray-600 font-medium relative z-10">
          Welcome to TooLoop - Rent & Share Tools Effortlessly
        </p>
        <p className="text-gray-500 max-w-2xl relative z-10">
          This is a platform that connects you with local users to rent, share, or borrow tools whenever you need them.
        </p>

        {/* Always show SearchBar */}
        <div className="mt-6 relative z-10">
          <SearchBar />
        </div>

        {/* Auth-dependent buttons */}
        <div className="mt-6 relative z-10">
          {authState ? (
            // Optionally add a profile button or dashboard link here if desired
            null
          ) : (
            <div className="flex gap-4">
              <Link
                href="/login"
                className="rounded-full bg-black text-white flex items-center justify-center px-6 py-3 hover:bg-gray-800"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-gray-400 text-white flex items-center justify-center px-6 py-3 hover:bg-gray-500"
              >
                Sign-Up
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}