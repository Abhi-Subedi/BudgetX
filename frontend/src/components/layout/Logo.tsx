import Image from "next/image";
import logo from "../../../public/fav-icon.png";
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span translate="no" className={`font-display text-[21px] font-bold leading-none tracking-tight ${className}`}>
      Budget<span className="text-brand">X</span>
    </span>
  );
}

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <Image src={logo} alt="BudgetX Logo" className={className} height={20} width={20}/>
  );
}
