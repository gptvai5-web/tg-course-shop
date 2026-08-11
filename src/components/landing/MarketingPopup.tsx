import { useState, useEffect } from "react";
import { X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const MarketingPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if the popup was closed for a day
    const hideUntil = localStorage.getItem("marketingPopupHideUntil");
    if (hideUntil && new Date().getTime() < parseInt(hideUntil, 10)) {
      return; // Do not show if still within the 24-hour hidden period
    }

    // Otherwise, show it every time they visit the home page (with a small delay)
    const timer = setTimeout(() => {
      setOpen(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNormalClose = () => {
    setOpen(false);
  };

  const handleCloseForDay = () => {
    // Set expiry to 24 hours from now
    const expiry = new Date().getTime() + 24 * 60 * 60 * 1000;
    localStorage.setItem("marketingPopupHideUntil", expiry.toString());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border-border rounded-2xl [&>button]:hidden">
        <div className="relative p-6 pt-10 text-center flex flex-col items-center">
          {/* Normal Red Close Button */}
          <button
            onClick={handleNormalClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-full transition-colors focus:outline-none"
            title="Close"
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

          <div className="w-full space-y-3">
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
            
            <Button 
              variant="outline" 
              onClick={handleCloseForDay}
              className="w-full h-10 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Clock className="w-4 h-4 mr-2" />
              আজকের জন্য আর দেখাবেন না
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarketingPopup;
