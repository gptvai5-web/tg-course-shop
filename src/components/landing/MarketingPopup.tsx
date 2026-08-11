import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const MarketingPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if the popup has been shown in this session
    const hasShown = sessionStorage.getItem("marketingPopupShown");
    if (!hasShown) {
      // Add a small delay for better user experience
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem("marketingPopupShown", "true");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border-border rounded-2xl">
        <div className="relative p-6 pt-10 text-center flex flex-col items-center">
          {/* Custom Red Close Button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🚀</span>
          </div>
          
          <h2 className="text-xl md:text-2xl font-display font-bold mb-4 leading-snug">
            এরকম Course Selling ওয়েব অ্যাপ তৈরি করতে চাইলে মেসেজ করুন
          </h2>
          
          <p className="text-sm text-muted-foreground mb-6">
            খুব সহজেই আপনার নিজস্ব কোর্সের ওয়েবসাইট তৈরি করে ফেলুন। বিস্তারিত জানতে আমাদের সাথে টেলিগ্রামে যোগাযোগ করুন।
          </p>

          <a 
            href="https://t.me/itz_weary" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full block"
          >
            <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-12 text-lg rounded-xl shadow-lg shadow-[#25D366]/20 transition-all">
              টেলিগ্রামে মেসেজ করুন
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarketingPopup;
