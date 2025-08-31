"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, ExternalLink, Link } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useOmniSoulContract } from "@/hooks/useContract";
import ky from "ky";

interface EvmVerificationProps {
  tokenId?: string;
}

interface VerificationResult {
  isOwner: boolean;
  owner: string;
  chain: string;
  nftContract: string;
  tokenId: string;
}

const SUPPORTED_CHAINS = [
  { value: "ethereum", label: "Ethereum", explorer: "https://etherscan.io" },
  { value: "polygon", label: "Polygon", explorer: "https://polygonscan.com" },
  { value: "bsc", label: "BSC", explorer: "https://bscscan.com" },
  { value: "arbitrum", label: "Arbitrum", explorer: "https://arbiscan.io" },
  {
    value: "optimism",
    label: "Optimism",
    explorer: "https://optimistic.etherscan.io",
  },
];

export function EvmVerification({ tokenId }: EvmVerificationProps) {
  const { address } = useAccount();
  const {
    linkCrossChainAsset,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  } = useOmniSoulContract();

  const [selectedChain, setSelectedChain] = useState("");
  const [nftContract, setNftContract] = useState("");
  const [nftTokenId, setNftTokenId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const verifyOwnership = async () => {
    if (!selectedChain || !nftContract || !nftTokenId || !address) {
      toast.error("Please fill in all fields and connect your wallet");
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await ky
        .post("/api/omnisoul/verify-evm", {
          json: {
            chain: selectedChain,
            nftContract,
            tokenId: nftTokenId,
            wallet: address,
          },
        })
        .json<{
          success: boolean;
          data?: VerificationResult;
          error?: string;
        }>();

      if (response.success && response.data) {
        setVerificationResult(response.data);
        if (response.data.isOwner) {
          toast.success("NFT ownership verified!");
        } else {
          toast.error("You don't own this NFT");
        }
      } else {
        throw new Error(response.error || "Verification failed");
      }
    } catch (err) {
      console.error("Verification error:", err);
      toast.error("Failed to verify NFT ownership");
    } finally {
      setIsVerifying(false);
    }
  };

  const linkAsset = async () => {
    if (
      !verificationResult ||
      !tokenId ||
      !verificationResult.isOwner ||
      !address
    ) {
      toast.error("Cannot link asset - verification required");
      return;
    }

    try {
      setIsLinking(true);
      linkCrossChainAsset(
        BigInt(tokenId),
        verificationResult.chain,
        verificationResult.nftContract,
        BigInt(verificationResult.tokenId),
        "" // Empty metadata for now
      );
      toast.success("Linking transaction submitted!");
    } catch (err) {
      console.error("Link error:", err);
      toast.error("Failed to link asset");
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
          chainName: verificationResult.chain,
          assetAddress: verificationResult.nftContract,
          assetId: verificationResult.tokenId,
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

  const getExplorerUrl = (chain: string, contract: string, tokenId: string) => {
    const chainData = SUPPORTED_CHAINS.find((c) => c.value === chain);
    if (!chainData) return "";
    return `${chainData.explorer}/token/${contract}?a=${tokenId}`;
  };

  return (
    <Card className="glass p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-neon-cyan mb-2">
            Verify EVM NFT
          </h3>
          <p className="text-sm text-muted-foreground">
            Verify ownership of your NFT on Ethereum, Polygon, or other EVM
            chains
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="chain">Blockchain</Label>
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select blockchain" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CHAINS.map((chain) => (
                  <SelectItem key={chain.value} value={chain.value}>
                    {chain.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contract">NFT Contract Address</Label>
            <Input
              id="contract"
              value={nftContract}
              onChange={(e) => setNftContract(e.target.value)}
              placeholder="0x..."
              className="mt-1 font-mono"
            />
          </div>

          <div>
            <Label htmlFor="tokenId">Token ID</Label>
            <Input
              id="tokenId"
              value={nftTokenId}
              onChange={(e) => setNftTokenId(e.target.value)}
              placeholder="1234"
              className="mt-1"
            />
          </div>
        </div>

        <Button
          onClick={verifyOwnership}
          disabled={
            isVerifying || !selectedChain || !nftContract || !nftTokenId
          }
          className="w-full neon-glow-cyan"
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
                  verificationResult.isOwner
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-red-500/10 border-red-500/20"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {verificationResult.isOwner ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        verificationResult.isOwner
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {verificationResult.isOwner
                        ? "Ownership Verified!"
                        : "Ownership Not Verified"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Owner: {verificationResult.owner.slice(0, 6)}...
                      {verificationResult.owner.slice(-4)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open(
                        getExplorerUrl(
                          verificationResult.chain,
                          verificationResult.nftContract,
                          verificationResult.tokenId
                        ),
                        "_blank"
                      )
                    }
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {verificationResult.isOwner && tokenId && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border">
                    <div>
                      <p className="font-medium">Link to Axon</p>
                      <p className="text-sm text-muted-foreground">
                        Connect this NFT to your persona
                      </p>
                    </div>
                    <Badge variant="outline" className="text-neon-cyan">
                      Token #{tokenId}
                    </Badge>
                  </div>

                  <Button
                    onClick={linkAsset}
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
                        Link Asset
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
