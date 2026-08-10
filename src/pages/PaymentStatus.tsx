import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get("status");
  const invoice = searchParams.get("invoice");
  const isSuccess = status === "success";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20 container mx-auto px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-2xl p-8 md:p-12 max-w-md w-full text-center space-y-6"
        >
          {isSuccess ? (
            <>
              <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-display font-bold">Payment Successful!</h1>
              <p className="text-muted-foreground">
                Your payment has been processed successfully. You are now enrolled in the course.
              </p>
              {invoice && (
                <p className="text-sm text-muted-foreground">Invoice: {invoice}</p>
              )}
              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={() => navigate("/learn")} className="bg-gradient-primary">
                  Start Learning
                </Button>
                <Button variant="outline" onClick={() => navigate("/courses")}>
                  Browse Courses
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-display font-bold">Payment Failed</h1>
              <p className="text-muted-foreground">
                Your payment could not be processed. Please try again or contact support.
              </p>
              {invoice && (
                <p className="text-sm text-muted-foreground">Invoice: {invoice}</p>
              )}
              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={() => navigate(-1)} className="bg-gradient-primary">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => navigate("/contact")}>
                  Contact Support
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentStatus;
