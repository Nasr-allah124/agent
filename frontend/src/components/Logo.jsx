import logo from "../assets/logo.svg";

export default function DaisyLogo({ className = "w-9 h-9" }) {
  return <img src={logo} alt="Daisy Consulting" className={`${className} object-contain`} />;
}