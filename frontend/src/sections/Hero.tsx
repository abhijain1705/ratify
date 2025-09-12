"use client";
import ArrowIcon from "@/assets/arrow-right.svg";
import cogImage from "@/assets/cog.png";
import cylinderImage from "@/assets/cylinder.png";
import noodleImage from "@/assets/noodle.png";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase"; // make sure you export `auth` from firebase.js

export const Hero = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start end", "end start"],
  });

  const translateY = useTransform(scrollYProgress, [0, 1], [150, -150]);

  // track user state
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <section
      ref={heroRef}
      className="pt-8 pb-20 md:pt-5 md:pb-10 overflow-x-clip"
      style={{
        background:
          "radial-gradient(ellipse 200% 100% at bottom left, #183EC2, #EAEEFE 100%)",
      }}
    >
      <div className="container">
        <div className="md:flex items-center">
          <div className="md:w-[478px]">
            <h1 className="text-5xl md:text-5xl font-bold tracking-tighter bg-gradient-to-b from-black to-[#001E80] text-transparent bg-clip-text mt-6">
              Smart Multi-Cloud Resource Management
            </h1>
            <p className="text-xl text-[#010D3E] tracking-tight mt-6">
              Manage AWS, GCP, and Azure from one dashboard — monitor workloads,
              auto-heal failures, optimize costs, and keep your cloud
              infrastructure secure with AI-powered automation.
            </p>
            <div className="flex gap-1 items-center mt-[30px]">
              {user ? (
                <button className="btn btn-primary">
                  <a href="/dashboard">Dashboard</a>
                </button>
              ) : (
                <button className="btn btn-primary">
                  <a href="/login">Login</a>
                </button>
              )}
            </div>
          </div>

          <div className="mt-20 md:mt-0 md:h-[648px] md:flex-1 relative">
            <motion.img
              src={cogImage.src}
              alt="Cog"
              className="md:absolute md:h-full md:w-auto md:max-w-none md:-left-6 lg:left-0"
              animate={{
                translateY: [-30, 30],
              }}
              transition={{
                repeat: Infinity,
                repeatType: "mirror",
                duration: 3,
                ease: "easeInOut",
              }}
            />

            <motion.img
              src={noodleImage.src}
              width={220}
              alt="Noodle image"
              className="hidden lg:block top-[524px] left-[448px] absolute rotate-[30deg]"
              style={{
                rotate: 30,
                translateY: translateY,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
