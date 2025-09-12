import ArrowRight from "@/assets/arrow-right.svg";
import Logo from "@/assets/logo.png";
import Image from "next/image";
import MenuIcon from "@/assets/menu.svg";

export const Header = () => {
  return (
    <header className="sticky top-0 backdrop-blur-sm z-20">
      <div className="flex justify-center items-center py-3 bg-black text-white text-sm gap-3">
        <p className="text-white/60 hidden md:block">Securely manage AWS, GCP & Azure from one dashboard 
      </p>
        <div className="inline-flex gap-1 items-center">
          <p>Try it now →</p>
          <ArrowRight className="h-4 w-4 inline-flex justify-center items-center" />
        </div>
      </div>

      <div className="py-5">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="inline-flex gap-2 items-center">
              <Image src={Logo} alt="Saas logo" height={20} width={85} />
              <h2 className="text-[45px] font-bold">RATIFY</h2>
            </div>
            <MenuIcon className="h-5 w-5 md:hidden" />
            
              <button className="bg-black text-white px-4 py-2 rounded-lg font-medium inline-flex items-center justify-center tracking-tight">
                <a href="/login">Login</a>
              </button>
            
          </div>
        </div>
      </div>
    </header>
  );
};
