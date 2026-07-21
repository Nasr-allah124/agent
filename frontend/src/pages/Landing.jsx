import LandingNav from "../landing_page/components/LandingNav";
import HeroSection from "../landing_page/components/HeroSection";
import ServiceSelection from "../landing_page/components/ServiceSelection";
import FeaturesSection from "../landing_page/components/FeaturesSection";
import HowItWorksSection from "../landing_page/components/HowItWorksSection";
import FAQSection from "../landing_page/components/FAQSection";
import AboutSection from "../landing_page/components/AboutSection";
import ScrollDownArrow from "../landing_page/components/ui/ScrollDownArrow";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <ServiceSelection />
      <FeaturesSection />
      <HowItWorksSection />
      <FAQSection />
      <AboutSection />
      <ScrollDownArrow threshold={150} />
    </div>
  );
}
