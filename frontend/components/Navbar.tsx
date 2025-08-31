"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import NextLink from "next/link";
import { motion } from "framer-motion";
import { useDisconnect, useAccount } from "wagmi";
import Image from "next/image";

export function Navbar() {
  const { disconnect, isPending } = useDisconnect();
  const { isConnected } = useAccount();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <NextLink href="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-neon-cyan to-neon-magenta rounded-full flex items-center justify-center group-hover:neon-glow-cyan transition-all duration-300 overflow-hidden">
            <Image
              src="/logo.png"
              alt="Axon Logo"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-neon-cyan to-neon-magenta bg-clip-text text-transparent">
            Axon
          </span>
        </NextLink>

        {/* Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Button asChild variant="ghost" className="hover:text-neon-cyan">
            <NextLink href="/dashboard">Dashboard</NextLink>
          </Button>
          <Button asChild variant="ghost" className="hover:text-neon-cyan">
            <NextLink href="/create">Create</NextLink>
          </Button>
          <Button asChild variant="ghost" className="hover:text-neon-cyan">
            <NextLink href="/gallery">Gallery</NextLink>
          </Button>
          <Button asChild variant="ghost" className="hover:text-neon-magenta">
            <NextLink href="/link">Link Assets</NextLink>
          </Button>
        </div>

        {/* Wallet */}
        <div className="flex items-center space-x-2">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== "loading";
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === "authenticated");

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {!connected ? (
                    <Button
                      onClick={openConnectModal}
                      className="neon-glow-cyan"
                    >
                      Connect Wallet
                    </Button>
                  ) : chain?.unsupported ? (
                    <Button
                      onClick={openChainModal}
                      variant="destructive"
                      className="neon-glow-magenta"
                    >
                      Wrong Network
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {/* Chain */}
                      <Button
                        onClick={openChainModal}
                        variant="outline"
                        size="sm"
                        className="glass bg-transparent"
                      >
                        {chain?.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 12,
                              height: 12,
                              borderRadius: 999,
                              overflow: "hidden",
                              marginRight: 4,
                            }}
                          >
                            {chain?.iconUrl && (
                              <img
                                alt={chain?.name ?? "Chain icon"}
                                src={chain?.iconUrl || "/placeholder.svg"}
                                style={{ width: 12, height: 12 }}
                              />
                            )}
                          </div>
                        )}
                        {chain?.name}
                      </Button>

                      {/* Address chip (always readable) */}
                      <Button
                        onClick={openAccountModal}
                        size="sm"
                        className="bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-semibold neon-glow-cyan"
                      >
                        {account?.displayName}
                        {account?.displayBalance
                          ? ` (${account.displayBalance})`
                          : ""}
                      </Button>

                      {/* Disconnect (via Wagmi) */}
                      {isConnected && (
                        <Button
                          onClick={() => disconnect()}
                          variant="ghost"
                          size="icon"
                          className="hover:text-neon-magenta"
                          disabled={isPending}
                          aria-label="Disconnect"
                          title="Disconnect"
                        >
                          <LogOut className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </motion.nav>
  );
}
