import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "teacher" | "student";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase.rpc("get_user_roles", { _user_id: userId });
    if (data) setRoles(data as AppRole[]);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchRoles(session.user.id), 0);

        // Register device session and redirect to profile
        if (_event === "SIGNED_IN") {
          // Redirect to profile page if on login or root
          const path = window.location.pathname;
          if (path === "/login" || path === "/" || path.startsWith("/~oauth")) {
            setTimeout(() => { window.location.href = "/student"; }, 200);
          }
          setTimeout(async () => {
            const sessionId = session.access_token.slice(-20);
            const ua = navigator.userAgent;
            let deviceInfo = "Unknown Device";
            if (/Mobile|Android/i.test(ua)) deviceInfo = "Mobile Device";
            else if (/Windows/i.test(ua)) deviceInfo = "Windows PC";
            else if (/Mac/i.test(ua)) deviceInfo = "Mac";
            else if (/Linux/i.test(ua)) deviceInfo = "Linux PC";

            // Register session via edge function (captures IP server-side)
            await supabase.functions.invoke("register-session", {
              body: { session_id: sessionId, device_info: deviceInfo },
            });
          }, 100);
        }
      } else {
        setRoles([]);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    // Poll every 10s to check if this device's session record still exists
    const sessionCheckInterval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;

      const sessionId = currentSession.access_token.slice(-20);
      const { data } = await supabase
        .from("user_sessions")
        .select("id")
        .eq("user_id", currentSession.user.id)
        .eq("session_id", sessionId);

      // If session record was deleted (by another device or admin), sign out
      if (data && data.length === 0) {
        await supabase.auth.signOut();
        setRoles([]);
        window.location.href = "/login";
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  return (
    <AuthContext.Provider value={{ user, session, roles, loading, signUp, signIn, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
