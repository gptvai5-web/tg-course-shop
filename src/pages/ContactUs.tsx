import { useState } from "react";
import { motion } from "framer-motion";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const ContactUs = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [telegram, setTelegram] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_messages" as any).insert({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim() || null,
      telegram: telegram.trim() || null,
      message: message.trim(),
    } as any);
    if (error) {
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
    } else {
      toast({ title: "Message Sent!", description: "We'll get back to you as soon as possible." });
      setName(""); setEmail(""); setSubject(""); setTelegram(""); setMessage("");
    }
    setSending(false);
  };


  return (
    <div className="min-h-screen bg-background bg-dot-grid">
      <Navbar />
      <section className="pt-28 pb-20 md:pt-36">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-5 py-2 rounded-full text-sm font-semibold text-primary mb-6">
              <MessageSquare className="w-4 h-4" /> Get in Touch
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4 tracking-tight">
              Contact <span className="text-gradient">Us</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">Have questions or feedback? We'd love to hear from you.</p>
          </motion.div>
          <div className="grid lg:grid-cols-[1fr_400px] gap-10 max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-display font-bold mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1.5 rounded-xl" maxLength={100} /></div>
                  <div><Label>Email *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="mt-1.5 rounded-xl" maxLength={255} /></div>
                </div>
                <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" className="mt-1.5 rounded-xl" maxLength={200} /></div>
                <div><Label>Telegram Username / Number</Label><Input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username or phone number" className="mt-1.5 rounded-xl" maxLength={100} /></div>
                <div><Label>Message *</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us more..." className="mt-1.5 rounded-xl min-h-[140px]" maxLength={2000} /></div>
                <Button type="submit" disabled={sending} className="w-full h-12 rounded-xl bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 gap-2">
                  <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-5">
              <a
                href="https://t.me/Free_Paid_Course01"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow group"
              >
                <div className="w-14 h-14 rounded-xl bg-[#229ED9]/10 flex items-center justify-center shrink-0 group-hover:bg-[#229ED9]/20 transition-colors">
                  <svg className="w-7 h-7 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Join Our Telegram Channel</h3>
                  <p className="text-sm text-muted-foreground mt-1">Get instant updates, free resources, and connect with our community.</p>
                  <span className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-[#229ED9]">
                    @Free_Paid_Course01
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </span>
                </div>
              </a>
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-display font-bold mb-2">Office Hours</h3>
                <div className="text-sm text-muted-foreground space-y-1.5">
                  <p>Saturday – Thursday: 9:00 AM – 9:00 PM</p>
                  <p>Friday: Closed</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ContactUs;
