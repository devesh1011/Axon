"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, AlertCircle, ExternalLink, Link } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import ky from "ky"

interface SolanaVerificationProps {
  tokenId?: string
}

interface SolanaVerificationResult {
  isOwner: boolean
  owner: string
  mint: string
  tokenAmount: number
  isNFT: boolean
}

export function SolanaVerification({ tokenId }: SolanaVerificationProps) {
  const [mint, setMint] = useState("")
  const [wallet, setWallet] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<SolanaVerificationResult | null>(null)

  const verifyOwnership = async () => {
    if (!mint || !wallet) {
      toast.error("Please fill in all fields")
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      const response = await ky
        .post("/api/omnisoul/verify-solana", {
          json: {
            mint,
            wallet,
          },
        })
        .json<{ success: boolean; data?: SolanaVerificationResult; error?: string }>()

      if (response.success && response.data) {
        setVerificationResult(response.data)
        if (response.data.isOwner && response.data.isNFT) {
          toast.success("Solana NFT ownership verified!")
        } else if (response.data.isOwner && !response.data.isNFT) {
          toast.error("This appears to be a fungible token, not an NFT")
        } else {
          toast.error("You don't own this NFT")
        }
      } else {
        throw new Error(response.error || "Verification failed")
      }
    } catch (err) {
      console.error("Verification error:", err)
      toast.error("Failed to verify Solana NFT ownership")
    } finally {
      setIsVerifying(false)
    }
  }

  const getExplorerUrl = (mint: string) => {
    return `https://solscan.io/token/${mint}`
  }

  return (
    <Card className="glass p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-neon-magenta mb-2">Verify Solana NFT</h3>
          <p className="text-sm text-muted-foreground">Verify ownership of your NFT on the Solana blockchain</p>
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
                        verificationResult.isOwner && verificationResult.isNFT ? "text-green-500" : "text-red-500"
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
                    onClick={() => window.open(getExplorerUrl(verificationResult.mint), "_blank")}
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {verificationResult.isOwner && verificationResult.isNFT && (
                <div className="p-4 bg-neon-purple/10 rounded-lg border border-neon-purple/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-neon-purple to-neon-magenta rounded-full flex items-center justify-center">
                      <Link className="h-4 w-4 text-background" />
                    </div>
                    <div>
                      <p className="font-medium text-neon-purple">Solana Linking Coming Soon</p>
                      <p className="text-sm text-muted-foreground">
                        Cross-chain linking for Solana NFTs will be available in a future update
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}
