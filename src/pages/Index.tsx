import CursorGlow from '@/components/CursorGlow';
import HeroSection from '@/components/HeroSection';
import BentoGrid from '@/components/BentoGrid';
import AboutSection from '@/components/AboutSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <main className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Cursor Following Glow */}
      <CursorGlow />
      
      {/* Main Content */}
      <HeroSection />
      <BentoGrid />
      <AboutSection />
      <Footer />
    </main>
  );
};

export default Index;
