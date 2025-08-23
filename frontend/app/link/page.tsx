"use client"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { NetworkGuard } from "@/components/NetworkGuard"
import { EvmVerification } from "@/components/EvmVerification"
import { SolanaVerification } from "@/components/SolanaVerification"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Link, Zap } from "lucide-react"
import { motion } from "framer-motion"

export default function LinkPage() {
  const searchParams = useSearchParams()
  const tokenId = searchParams.get("tokenId")

  return (
    <NetworkGuard requireConnection>
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="container mx-auto px-4 pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-neon-cyan to-neon-magenta bg-clip-text text-transparent mb-4">
                Link Cross-Chain Assets
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
                Connect your existing NFTs from other blockchains to your Omni-Soul persona
              </p>
              {tokenId && (
                <Badge variant="outline" className="text-neon-cyan">
                  Linking to Token #{tokenId}
                </Badge>
              )}
            </div>

            {/* Info Card */}
            <Card className="glass p-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-neon-cyan to-neon-magenta rounded-full flex items-center justify-center flex-shrink-0">
                  <Link className="h-6 w-6 text-background" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">How Cross-Chain Linking Works</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      • <strong>Verify Ownership:</strong> We check that you own the NFT on the source blockchain
                    </p>
                    <p>
                      • <strong>Link to Persona:</strong> The verified asset gets linked to your Omni-Soul on ZetaChain
                    </p>
                    <p>
                      • <strong>Maintain Ownership:</strong> Your original NFT stays on its native chain - we only
                      create a reference
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Verification Tabs */}
            <Tabs defaultValue="evm" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="evm" className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>EVM Chains</span>
                </TabsTrigger>
                <TabsTrigger value="solana" className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full" />
                  <span>Solana</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="evm" className="space-y-6">
                <div className="grid gap-6">
                  <Card className="glass p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-neon-cyan mb-2">Supported EVM Chains</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Ethereum</Badge>
                        <Badge variant="secondary">Polygon</Badge>
                        <Badge variant="secondary">BSC</Badge>
                        <Badge variant="secondary">Arbitrum</Badge>
                        <Badge variant="secondary">Optimism</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter your NFT contract address and token ID to verify ownership on any supported EVM chain.
                    </p>
                  </Card>

                  <EvmVerification tokenId={tokenId || undefined} />
                </div>
              </TabsContent>

              <TabsContent value="solana" className="space-y-6">
                <div className="grid gap-6">
                  <Card className="glass p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-neon-magenta mb-2">Solana NFTs</h3>
                      <Badge variant="secondary">Solana Mainnet</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter your NFT mint address and wallet address to verify ownership on Solana.
                    </p>
                  </Card>

                  <SolanaVerification tokenId={tokenId || undefined} />
                </div>
              </TabsContent>
            </Tabs>

            {/* Additional Info */}
            <Card className="glass p-6 mt-8">
              <h3 className="text-lg font-bold mb-4">Important Notes</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  • <strong>Gas Fees:</strong> Linking assets requires a transaction on ZetaChain (small ZETA fee)
                </p>
                <p>
                  • <strong>Verification:</strong> We only verify ownership at the time of linking - transfers after
                  linking won't update automatically
                </p>
                <p>
                  • <strong>Privacy:</strong> Only the contract address, token ID, and chain are stored on-chain
                </p>
                <p>
                  • <strong>Reversible:</strong> Asset links can be updated or removed by the Omni-Soul owner
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </NetworkGuard>
  )
}
