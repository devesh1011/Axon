"use client"

import type React from "react"

import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { zetaChainAthens } from "@/lib/chains"
import { motion } from "framer-motion"

interface NetworkGuardProps {
  children: React.ReactNode
  requireConnection?: boolean
}

export function NetworkGuard({ children, requireConnection = false }: NetworkGuardProps) {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  // If connection is required but wallet is not connected
  if (requireConnection && !isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass p-8 text-center max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-neon-cyan to-neon-magenta rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-background" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-neon-cyan">Wallet Required</h2>
            <p className="text-muted-foreground mb-6">Please connect your wallet to access this feature.</p>
          </Card>
        </motion.div>
      </div>
    )
  }

  // If connected but on wrong network
  if (isConnected && chainId !== zetaChainAthens.id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass p-8 text-center max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-neon-magenta to-neon-purple rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-background" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-neon-magenta">Wrong Network</h2>
            <p className="text-muted-foreground mb-6">Please switch to ZetaChain Athens Testnet to continue.</p>
            <Button
              onClick={() => switchChain({ chainId: zetaChainAthens.id })}
              disabled={isPending}
              className="neon-glow-magenta"
            >
              {isPending ? "Switching..." : "Switch to ZetaChain"}
            </Button>
          </Card>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
