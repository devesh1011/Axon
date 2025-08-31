"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, ExternalLink, Link } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useOmniSoulContract } from "@/hooks/useContract";
import ky from "ky";

interface SolanaVerificationProps {
  tokenId?: string;
}

interface SolanaVerificationResult {
  isOwner: boolean;
  owner: string;
  mint: string;
  tokenAmount: number;
  isNFT: boolean;
}

export function SolanaVerification({ tokenId }: SolanaVerificationProps) {
  const { address } = useAccount();
  const {
    linkCrossChainAsset,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  } = useOmniSoulContract();

  const [mint, setMint] = useState("");
  const [wallet, setWallet] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<SolanaVerificationResult | null>(null);

  const linkSolanaAsset = async () => {
    if (
      !verificationResult ||
      !tokenId ||
      !verificationResult.isOwner ||
      !verificationResult.isNFT ||
      !address
    ) {
      toast.error("Cannot link asset - verification required");
      return;
    }

    try {
      setIsLinking(true);
      // For Solana, we use the mint address as the asset address and 0 as the token ID
      // since Solana NFTs are typically single-token contracts
      linkCrossChainAsset(
        BigInt(tokenId),
        "solana",
        verificationResult.mint as `0x${string}`, // Convert to hex format
        BigInt(0), // Solana NFTs typically have token ID 0
        "" // Empty metadata for now
      );
      toast.success("Linking transaction submitted!");
    } catch (err) {
      console.error("Link error:", err);
      toast.error("Failed to link Solana asset");
    } finally {
      setIsLinking(false);
    }
  };

  // Save linked asset to database after successful blockchain transaction
  const saveLinkedAsset = async (transactionHash: string) => {
    if (!verificationResult || !tokenId || !address) return;

    try {
      await ky.post("/api/omnisoul/link-asset", {
        json: {
          tokenId,
          chainName: "solana",
          assetAddress: verificationResult.mint,
          assetId: "0",
          walletAddress: address,
          transactionHash,
          metadata: "",
        },
      });
    } catch (err) {
      console.error("Failed to save linked asset:", err);
    }
  };

  // Call saveLinkedAsset when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && hash) {
      saveLinkedAsset(hash);
    }
  }, [isConfirmed, hash]);

  const verifyOwnership = async () => {
    if (!mint || !wallet) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await ky
        .post("/api/omnisoul/verify-solana", {
          json: {
            mint,
            wallet,
          },
        })
        .json<{
          success: boolean;
          data?: SolanaVerificationResult;
          error?: string;
        }>();

      if (response.success && response.data) {
        setVerificationResult(response.data);
        if (response.data.isOwner && response.data.isNFT) {
          toast.success("Solana NFT ownership verified!");
        } else if (response.data.isOwner && !response.data.isNFT) {
          toast.error("This appears to be a fungible token, not an NFT");
        } else {
          toast.error("You don't own this NFT");
        }
      } else {
        throw new Error(response.error || "Verification failed");
      }
    } catch (err) {
      console.error("Verification error:", err);
      toast.error("Failed to verify Solana NFT ownership");
    } finally {
      setIsVerifying(false);
    }
  };

  const getExplorerUrl = (mint: string) => {
    return `https://solscan.io/token/${mint}`;
  };

  return (
    <Card className="glass p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-neon-magenta mb-2">
            Verify Solana NFT
          </h3>
          <p className="text-sm text-muted-foreground">
            Verify ownership of your NFT on the Solana blockchain
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="mint">NFT Mint Address</Label>
            <Input
              id="mint"
              value={mint}
              onChange={(e) => setMint(e.target.value)}
              placeholder="Mint address (base58)"
              className="mt-1 font-mono"
            />
          </div>

          <div>
            <Label htmlFor="wallet">Your Solana Wallet Address</Label>
            <Input
              id="wallet"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Wallet address (base58)"
              className="mt-1 font-mono"
            />
          </div>
        </div>

        <Button
          onClick={verifyOwnership}
          disabled={isVerifying || !mint || !wallet}
          className="w-full neon-glow-magenta"
        >
          {isVerifying ? (
            <>
              <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
              Verifying...
            </>
          ) : (
            "Verify Ownership"
          )}
        </Button>

        <AnimatePresence>
          {verificationResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div
                className={`p-4 rounded-lg border ${
                  verificationResult.isOwner && verificationResult.isNFT
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-red-500/10 border-red-500/20"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {verificationResult.isOwner && verificationResult.isNFT ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        verificationResult.isOwner && verificationResult.isNFT
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {verificationResult.isOwner && verificationResult.isNFT
                        ? "NFT Ownership Verified!"
                        : verificationResult.isOwner
                        ? "Token Owned (Not NFT)"
                        : "Ownership Not Verified"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Token Amount: {verificationResult.tokenAmount}
                      {verificationResult.isNFT && " (NFT)"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open(
                        getExplorerUrl(verificationResult.mint),
                        "_blank"
                      )
                    }
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {verificationResult.isOwner &&
                verificationResult.isNFT &&
                tokenId && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border">
                      <div>
                        <p className="font-medium">Link to Axon</p>
                        <p className="text-sm text-muted-foreground">
                          Connect this Solana NFT to your persona
                        </p>
                      </div>
                      <Badge variant="outline" className="text-neon-magenta">
                        Token #{tokenId}
                      </Badge>
                    </div>

                    <Button
                      onClick={() => linkSolanaAsset()}
                      disabled={
                        isPending || isConfirming || isConfirmed || isLinking
                      }
                      className="w-full neon-glow-magenta"
                    >
                      {isPending || isLinking ? (
                        <>
                          <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                          Confirm in Wallet...
                        </>
                      ) : isConfirming ? (
                        <>
                          <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                          Linking...
                        </>
                      ) : isConfirmed ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Linked Successfully!
                        </>
                      ) : (
                        <>
                          <Link className="mr-2 h-4 w-4" />
                          Link Solana Asset
                        </>
                      )}
                    </Button>
                  </div>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
