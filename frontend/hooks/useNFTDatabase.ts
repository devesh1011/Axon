import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface NFTData {
  token_id: string;
  name: string;
  description: string;
  metadata_uri: string;
  pinata_cid: string;
  image_cid: string;
  uploaded_files?: string[];
  wallet_address: string;
  transaction_hash: string;
}

export function useNFTDatabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const saveNFT = async (nftData: NFTData) => {
    if (!profile) {
      throw new Error("Wallet must be connected to save NFT");
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("nfts")
        .insert({
          profile_id: profile.id,
          ...nftData,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save NFT";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getUserNFTs = async () => {
    if (!profile) {
      throw new Error("Wallet must be connected to fetch NFTs");
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("nfts")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch NFTs";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateNFT = async (nftId: string, updates: Partial<NFTData>) => {
    if (!profile) {
      throw new Error("Wallet must be connected to update NFT");
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("nfts")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", nftId)
        .eq("profile_id", profile.id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update NFT";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteNFT = async (nftId: string) => {
    if (!profile) {
      throw new Error("Wallet must be connected to delete NFT");
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("nfts")
        .delete()
        .eq("id", nftId)
        .eq("profile_id", profile.id);

      if (error) throw error;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete NFT";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    saveNFT,
    getUserNFTs,
    updateNFT,
    deleteNFT,
    loading,
    error,
  };
}
