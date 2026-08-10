import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShieldCheck, Loader2, X, CreditCard, Lock, Smartphone, Banknote, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentUrl: string | null;
  courseName: string;
  amount: number;
  invoiceNumber: string;
  onPaymentComplete?: (status: "success" | "failed") => void;
}

const PaymentDialog = ({
  open,
  onOpenChange,
  paymentUrl,
  courseName,
  amount,
  invoiceNumber,
  onPaymentComplete,
}: PaymentDialogProps) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!open) {
      setIframeLoaded(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const checkInterval = setInterval(async () => {
      try {
        const iframe = iframeRef.current;
        if (iframe) {
          const iframeUrl = iframe.contentWindow?.location?.href;
          if (iframeUrl && iframeUrl.includes("/payment-status")) {
            const url = new URL(iframeUrl);
            const status = url.searchParams.get("status");
            clearInterval(checkInterval);
            onPaymentComplete?.(status === "success" ? "success" : "failed");
          }
        }
      } catch {
        // Cross-origin — expected
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [open, onPaymentComplete]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[520px] p-0 gap-0 overflow-hidden border border-border bg-card shadow-2xl rounded-2xl sm:rounded-3xl max-h-[95vh] sm:max-h-[92vh] [&>button]:hidden">
        {/* Gradient header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4"
        >
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 rounded-full bg-primary-foreground/5 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-primary-foreground/5 translate-y-1/2 -translate-x-1/2" />

          {/* Close */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-2.5 right-2.5 z-10 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-primary-foreground/10 backdrop-blur-md flex items-center justify-center text-primary-foreground/80 hover:bg-primary-foreground/20 active:scale-95 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header content */}
          <div className="relative z-[1] flex items-start gap-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center shadow-lg shrink-0"
            >
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className="text-primary-foreground font-display font-bold text-base sm:text-lg leading-tight">
                Complete Payment
              </h3>
              <p className="text-primary-foreground/60 text-[11px] sm:text-xs mt-0.5 truncate">
                {courseName}
              </p>
            </div>
          </div>

          {/* Amount card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative z-[1] mt-3 sm:mt-4 bg-primary-foreground/10 backdrop-blur-md rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between"
          >
            <div>
              <p className="text-primary-foreground/50 text-[9px] sm:text-[10px] uppercase tracking-wider font-medium">Total Amount</p>
              <p className="text-primary-foreground font-display font-extrabold text-xl sm:text-2xl mt-0.5">
                ৳{amount.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-primary-foreground/50 text-[9px] sm:text-[10px] uppercase tracking-wider font-medium">Invoice</p>
              <p className="text-primary-foreground/80 text-[10px] sm:text-[11px] font-mono mt-0.5">{invoiceNumber.slice(0, 14)}</p>
            </div>
          </motion.div>

          {/* Payment methods */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative z-[1] mt-2.5 flex items-center gap-2 sm:gap-3 flex-wrap"
          >
            {[
              { icon: Smartphone, label: "bKash" },
              { icon: Smartphone, label: "Nagad" },
              { icon: Banknote, label: "Cards" },
              { icon: Globe, label: "Net Banking" },
            ].map((m, i) => (
              <div key={m.label} className="flex items-center gap-1 text-primary-foreground/50 text-[9px] sm:text-[10px]">
                {i > 0 && <span className="text-primary-foreground/20 mr-1">•</span>}
                <m.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>{m.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* iframe area — responsive height */}
        <div className="relative bg-background" style={{ minHeight: "clamp(360px, 55vh, 480px)" }}>
          <AnimatePresence>
            {!iframeLoaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-4 bg-background z-10"
              >
                <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                  <div className="w-full h-full rounded-full border-[3px] border-muted" />
                  <div className="w-full h-full rounded-full border-[3px] border-primary border-t-transparent absolute inset-0 animate-spin" />
                </div>
                <div className="text-center px-4">
                  <p className="text-sm font-medium text-foreground">Loading Payment Gateway</p>
                  <p className="text-xs text-muted-foreground mt-1">Please wait while we connect securely...</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-[10px] text-muted-foreground">
                    <Lock className="w-2.5 h-2.5" />
                    <span>SSL Encrypted</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-[10px] text-muted-foreground">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>Secure</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {paymentUrl && (
            <iframe
              ref={iframeRef}
              src={paymentUrl}
              className="w-full border-0"
              style={{ height: "clamp(360px, 55vh, 480px)" }}
              onLoad={() => setIframeLoaded(true)}
              allow="payment"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            />
          )}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="px-4 sm:px-5 py-2.5 sm:py-3 bg-muted/40 border-t border-border"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] sm:text-[11px] font-medium">Secured by PayStation</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 sm:h-7 text-[11px] text-muted-foreground hover:text-destructive active:scale-95"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
