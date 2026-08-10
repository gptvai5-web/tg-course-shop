import { supabase } from "@/integrations/supabase/client";

export const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
  const redirectTo = `${window.location.origin}/`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt: "select_account" },
    },
  });

  return { error: error ? new Error(error.message) : null };
};
