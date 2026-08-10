import { GraduationCap, Send, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border pt-12 sm:pt-16 pb-6 sm:pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg mb-3 text-foreground">
              <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold">TG</div>
                <div className="text-sm font-bold text-primary">COURSE.SHOP</div>

              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              The best online learning platform. Learn from expert instructors and build your future.
            </p>
            <a
              href="https://t.me/Free_Paid_Course01"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9] hover:bg-[#229ED9]/20 transition-colors px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <Send className="w-4 h-4" />
              Join Telegram
            </a>
          </div>

          {/* Pages */}
          <div>
            <h4 className="font-display font-bold mb-4 text-foreground text-sm sm:text-base">Pages</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/courses" className="hover:text-primary transition-colors">Courses</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Login / Sign Up</Link></li>
              <li><Link to="/learn" className="hover:text-primary transition-colors">My Learning</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold mb-4 text-foreground text-sm sm:text-base">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/student" className="hover:text-primary transition-colors">Student Profile</Link></li>
              <li>
                <a href="https://t.me/Free_Paid_Course01" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
                  Telegram Channel <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Terms of Service</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground">
          <span>© 2026 TG COURSE.SHOP. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-primary transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Terms</span>
            <a href="https://t.me/Free_Paid_Course01" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
              <Send className="w-3 h-3" /> Telegram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
