"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ExternalLink, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useOmniSoulContract } from "@/hooks/useContract";

interface MintCardProps {
  uploadedFiles: Array<{
    cid: string;
    name: string;
    type: string;
  }>;
  personalData?: {
    name?: string;
    description?: string;
    bio?: string;
    background?: string;
    interests?: string[];
    goals?: string[];
    personality_traits?: string[];
  };
  onMintSuccess?: (tokenId: string) => void;
}

export function MintCard({
  uploadedFiles,
  personalData,
  onMintSuccess,
}: MintCardProps) {
  const { address } = useAccount();
  const { mintOmniSoul, hash, isPending, isConfirming, isConfirmed, error } =
    useOmniSoulContract();
  const [isCreatingMetadata, setIsCreatingMetadata] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<string>("");

  // Handle successful mint confirmation
  useEffect(() => {
    console.log("MintCard useEffect triggered:", {
      isConfirmed,
      hash,
      mintedTokenId,
    });
    if (isConfirmed && hash && !mintedTokenId) {
      console.log("Mint confirmed, triggering onMintSuccess callback");
      // In a real implementation, you would parse the transaction receipt to get the token ID
      // For now, we'll simulate it
      const simulatedTokenId = Math.floor(Math.random() * 10000).toString();
      setMintedTokenId(simulatedTokenId);
      onMintSuccess?.(simulatedTokenId);
      toast.success(
        `Axon NFT minted successfully! Token ID: ${simulatedTokenId}`
      );
    }
  }, [isConfirmed, hash, mintedTokenId, onMintSuccess]);

  const handleMint = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!personalData?.name || !personalData?.description) {
      toast.error("Please provide a name and description for your Axon");
      return;
    }

    setIsCreatingMetadata(true);

    try {
      // Step 1: Create metadata via API
      const metadata = {
        name: personalData.name,
        description: personalData.description,
        image: uploadedFiles.find((f) => f.type.startsWith("image/"))?.cid
          ? `ipfs://${
              uploadedFiles.find((f) => f.type.startsWith("image/"))?.cid
            }`
          : undefined,
        attributes: [
          {
            trait_type: "Type",
            value: "Axon",
          },
          {
            trait_type: "Files Uploaded",
            value: uploadedFiles.length,
          },
          ...(personalData.interests
            ? [
                {
                  trait_type: "Interests",
                  value: personalData.interests.join(", "),
                },
              ]
            : []),
          ...(personalData.personality_traits
            ? [
                {
                  trait_type: "Personality",
                  value: personalData.personality_traits.join(", "),
                },
              ]
            : []),
        ],
        personalData: {
          bio: personalData.bio,
          background: personalData.background,
          interests: personalData.interests || [],
          goals: personalData.goals || [],
          personality_traits: personalData.personality_traits || [],
        },
        uploadedFiles,
      };

      // Call the metadata creation API
      const response = await fetch("/api/nft/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ metadata }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to create metadata");
      }

      toast.success(
        "Metadata created! Now sign the transaction to mint your NFT."
      );

      // Step 2: Mint NFT using user's wallet
      mintOmniSoul(address, result.tokenURI);
    } catch (err) {
      console.error("Metadata creation error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create metadata";
      toast.error(errorMessage);
    } finally {
      setIsCreatingMetadata(false);
    }
  };

  const getExplorerUrl = (txHash: string) => {
    const explorerBase =
      process.env.NEXT_PUBLIC_ZETA_EXPLORER ||
      "https://athens.explorer.zetachain.com";
    return `${explorerBase}/tx/${txHash}`;
  };

  return (
    <Card className="glass p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-neon-cyan mb-2">
            Mint Your Axon
          </h3>
          <p className="text-muted-foreground">
            Create your AI-powered digital persona as an NFT on ZetaChain
          </p>
        </div>

        {/* Uploaded Files Summary */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">
              Uploaded Files ({uploadedFiles.length})
            </h4>
            <div className="space-y-2">
              {uploadedFiles.slice(0, 3).map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-card/50 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-neon-cyan rounded-full"></div>
                    <span className="text-sm font-medium">{file.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {file.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {file.cid.slice(0, 8)}...{file.cid.slice(-8)}
                  </span>
                </div>
              ))}
              {uploadedFiles.length > 3 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{uploadedFiles.length - 3} more files
                </p>
              )}
            </div>
          </div>
        )}

        {/* Personal Data Summary */}
        {personalData && (
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Persona Details</h4>
            <div className="bg-card/50 rounded-lg p-4 space-y-2">
              {personalData.name && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Name:{" "}
                  </span>
                  <span className="text-sm">{personalData.name}</span>
                </div>
              )}
              {personalData.description && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Description:{" "}
                  </span>
                  <span className="text-sm">{personalData.description}</span>
                </div>
              )}
              {personalData.interests && personalData.interests.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Interests:{" "}
                  </span>
                  <span className="text-sm">
                    {personalData.interests.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Minting Status */}
        {(isCreatingMetadata || isPending || isConfirming) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {isCreatingMetadata && (
              <div className="flex items-center justify-center space-x-2 bg-card/50 rounded-lg p-4">
                <Loader2 className="h-5 w-5 animate-spin text-neon-cyan" />
                <span className="text-sm font-medium">
                  Creating metadata on IPFS...
                </span>
              </div>
            )}

            {isPending && (
              <div className="flex items-center justify-center space-x-2 bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                <span className="text-sm font-medium text-orange-500">
                  Waiting for wallet confirmation...
                </span>
              </div>
            )}

            {isConfirming && hash && (
              <div className="flex items-center justify-center space-x-2 bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-sm font-medium text-blue-500">
                  Transaction confirming...
                </span>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Please don&apos;t close this page while the transaction is
              processing.
            </p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center space-x-2 bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <span className="text-sm font-medium text-red-500">
                Transaction failed: {error.message || "Unknown error"}
              </span>
            </div>
          </motion.div>
        )}

        {/* Success State */}
        {mintedTokenId && hash && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center space-x-2 bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-500">
                Successfully Minted!
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-card/50 rounded-lg p-3">
                <span className="text-sm font-medium">Token ID</span>
                <Badge variant="secondary">{mintedTokenId}</Badge>
              </div>

              <div className="flex items-center justify-between bg-card/50 rounded-lg p-3">
                <span className="text-sm font-medium">Transaction</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs"
                  onClick={() => window.open(getExplorerUrl(hash), "_blank")}
                >
                  {hash.slice(0, 10)}...{hash.slice(-8)}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mint Button */}
        {!mintedTokenId && (
          <Button
            onClick={handleMint}
            disabled={
              isCreatingMetadata || isPending || isConfirming || !address
            }
            className="w-full bg-gradient-to-r from-neon-cyan to-neon-magenta hover:opacity-90 text-background font-bold py-3"
          >
            {isCreatingMetadata || isPending || isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Minting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Mint Axon NFT
              </>
            )}
          </Button>
        )}

        {!address && (
          <p className="text-sm text-muted-foreground text-center">
            Please connect your wallet to mint your Axon NFT
          </p>
        )}
      </div>
    </Card>
  );
}
