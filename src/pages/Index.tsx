import Navbar from "@/components/landing/Navbar";
import FeaturedCarousel from "@/components/landing/FeaturedCarousel";
import LearningPathSection from "@/components/landing/LearningPathSection";
import ReviewsSection from "@/components/landing/ReviewsSection";
import TelegramSection from "@/components/landing/TelegramSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background bg-dot-grid">
      <Navbar />
      <FeaturedCarousel />
      <LearningPathSection />
      <ReviewsSection />
      <TelegramSection />
      <Footer />
    </div>
  );
};

export default Index;
