import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Landing from "./Landing";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { PressableButton } from "@/components/ui/pressable-button";

type AuthView = "landing" | "signin" | "signup" | "signup-success";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialView = (searchParams.get("view") as AuthView) || "landing";
  const [view, setView] = useState<AuthView>(initialView);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const normalizedUsername = username.trim().toLowerCase();

  // Authenticated users should not stay on the login/signup screens.
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (view === "signup") {
      // Usernames are normalized before saving so profile links and search stay predictable.
      if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
        toast.error("Username must be 3-24 characters using lowercase letters, numbers, or underscores");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }

      // Check the profiles table first because Supabase Auth does not know about app usernames.
      const { data: existingProfile, error: usernameError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", normalizedUsername)
        .maybeSingle();

      if (usernameError) {
        toast.error(usernameError.message);
        setLoading(false);
        return;
      }

      if (existingProfile) {
        toast.error("That username is already taken");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username: normalizedUsername,
            display_name: normalizedUsername,
          },
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        // When email confirmation is not required, create/update the profile immediately.
        if (data.user && data.session) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              user_id: data.user.id,
              username: normalizedUsername,
              display_name: normalizedUsername,
            });

          if (profileError) {
            toast.error(profileError.message);
            setLoading(false);
            return;
          }
        }
        setView("signup-success");
      }
    } else {
      // Sign-in delegates password verification to Supabase Auth.
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      }
    }
    setLoading(false);
  };

  if (view === "landing") {
    return (
      <Landing
        onGetStarted={() => setView("signup")}
        onSignIn={() => setView("signin")}
      />
    );
  }

  if (view === "signup-success") {
    return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle2 size={56} className="text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-3">
            Account Created!
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Your account has been created successfully. You can now sign in.
          </p>
          <PressableButton
            onClick={() => setView("signin")}
            className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign In Now
          </PressableButton>
        </div>
      </div>
    );
  }

  const isSignUp = view === "signup";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-gradient mb-2">Recall.fm</h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className="w-full rounded-lg border border-input bg-card px-3 py-2.5 pl-7 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="username"
                  required
                  minLength={3}
                  maxLength={24}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Lowercase letters, numbers, and underscores only.
              </p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2.5 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <PressableButton
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </PressableButton>
            </div>
          </div>
          {isSignUp && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-card px-3 py-2.5 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <PressableButton
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </PressableButton>
              </div>
            </div>
          )}

          <PressableButton
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </PressableButton>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <PressableButton
            onClick={() => setView(isSignUp ? "signin" : "signup")}
            className="text-primary font-medium hover:underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </PressableButton>
        </p>

        <PressableButton
          onClick={() => setView("landing")}
          className="block mx-auto mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </PressableButton>
      </div>
    </div>
  );
};

export default Auth;
