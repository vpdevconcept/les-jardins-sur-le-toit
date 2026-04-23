import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "staff" | "client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  roles: AppRole[];
  isAdmin: boolean;
  isStaff: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  roles: [],
  isAdmin: false,
  isStaff: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const ADMIN_EMAILS = [
  "green.shake.reunion@gmail.com",
  "conception.vpdev@gmail.com",
  "jardinssurletoit@gmail.com",
];

// E2E test domain — only honoured in non-production builds (DEV/preview).
const E2E_TEST_DOMAIN = "@jardins-test.local";

export const isAdminEmail = (email?: string | null) => {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  if (ADMIN_EMAILS.includes(lower)) return true;
  if (import.meta.env.DEV && lower.endsWith(E2E_TEST_DOMAIN)) return true;
  return false;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setLoading(false);
        if (newSession?.user) {
          // Defer to avoid deadlock
          setTimeout(() => fetchRoles(newSession.user.id), 0);
        } else {
          setRoles([]);
        }
      },
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
      if (s?.user) fetchRoles(s.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const user = session?.user ?? null;
  const isAdmin = roles.includes("admin") || isAdminEmail(user?.email);
  const isStaff = roles.includes("staff") || isAdmin;

  return (
    <AuthContext.Provider
      value={{ session, user, loading, roles, isAdmin, isStaff, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
