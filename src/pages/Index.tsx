import Navbar from "@/components/Navbar";
import CursorGlow from "@/components/CursorGlow";
import HeroSection from "@/components/HeroSection";
import BentoGrid from "@/components/BentoGrid";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import TechStack from "@/components/TechStack";

const Index = () => {
  return (
    <main className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Cursor Following Glow */}
      <CursorGlow />

      {/* Main Content */}
      <HeroSection />
      <TechStack />
      <BentoGrid />
      <AboutSection />
      <Footer />
    </main>
  );
};

export default Index;
