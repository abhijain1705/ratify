"use client";
import Gcloudlogo from "@/assets/Google_Cloud_Platform-Logo.wine.png";
import HerokuLogo from "@/assets/Heroku_logo.svg.png";
import AzoreLogo from "@/assets/azure.png";
import AWSLogo from "@/assets/images.png";
import { motion } from "framer-motion";
import Image from "next/image";

export const LogoTicker = () => {
  return (
    <div className="py-8 md:py-12 bg-white">
      <div className="container">
        <div
          className="flex overflow-hidden"
          style={{ maskImage: "linear-gradient(to right, transparent, black, transparent)" }}
        >
          <motion.div
            className="flex gap-14 flex-none pr-14"
            animate={{
              translateX: "-50%",
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop",
            }}
          >
            <Image src={Gcloudlogo} alt="Acme logo" className="logo-ticker-image" />
            <Image src={HerokuLogo} alt="quantam logo" className="logo-ticker-image" />
            <Image src={AzoreLogo} alt="Echo logo" className="logo-ticker-image" />
            <Image src={AWSLogo} alt="celestial logo" className="logo-ticker-image" />

            <Image src={Gcloudlogo} alt="Acme logo" className="logo-ticker-image" />
            <Image src={HerokuLogo} alt="quantam logo" className="logo-ticker-image" />
            <Image src={AzoreLogo} alt="Echo logo" className="logo-ticker-image" />
            <Image src={AWSLogo} alt="celestial logo" className="logo-ticker-image" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
