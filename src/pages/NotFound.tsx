import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="text-[8rem] font-display font-extrabold text-gradient leading-none mb-4">
          404
        </div>
        <h1 className="text-2xl font-display font-bold mb-3">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/">
            <Button className="bg-gradient-primary hover:opacity-90 rounded-xl gap-2 px-6">
              <Home className="w-4 h-4" /> Go Home
            </Button>
          </Link>
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
