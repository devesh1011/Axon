"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  wallet_address: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (walletAddress: string) => {
    try {
      setLoading(true);
      setError(null);

      // First, try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from("wallet_profiles")
        .select("*")
        .eq("wallet_address", walletAddress.toLowerCase())
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (existingProfile) {
        setProfile(existingProfile);
        return;
      }

      // If no profile exists, create one
      const { data: newProfile, error: insertError } = await supabase
        .from("wallet_profiles")
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          display_name: `User ${walletAddress.slice(
            0,
            6
          )}...${walletAddress.slice(-4)}`,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setProfile(newProfile);
    } catch (err) {
      console.error("Error fetching/creating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (address) {
      await fetchProfile(address);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchProfile(address);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [isConnected, address]);

  return (
    <AuthContext.Provider value={{ profile, loading, error, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
