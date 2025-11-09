import logo from "@/assets/logo.png";

interface LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export const Logo = ({ className = "", size = "md" }: LogoProps) => {
  return (
    <img 
      src={logo} 
      alt="PÊCHE GABON" 
      className={`${sizeMap[size]} object-contain ${className}`}
    />
  );
};
