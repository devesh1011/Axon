"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Zap, Sparkles, Link } from "lucide-react";
import NextLink from "next/link";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />

      {/* Animated background grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-neon-cyan to-neon-magenta bg-clip-text text-transparent mb-6">
              OMNI-SOUL
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Mint your digital persona as an NFT on ZetaChain. Upload your data
              to IPFS and chat with an AI version of yourself.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button asChild size="lg" className="neon-glow-cyan">
              <NextLink href="/create">
                <Sparkles className="mr-2 h-5 w-5" />
                Create Omni-Soul
              </NextLink>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="glass bg-transparent"
            >
              <NextLink href="/gallery">
                <Brain className="mr-2 h-5 w-5" />
                View Gallery
              </NextLink>
            </Button>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          <Card className="glass p-8 text-center group hover:neon-glow-cyan transition-all duration-300">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-neon-cyan to-neon-purple rounded-full flex items-center justify-center">
                <Brain className="h-8 w-8 text-background" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-neon-cyan">
              AI Persona
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Upload your personal data and create an AI that speaks in your
              voice, powered by Google Gemini and LangChain.
            </p>
          </Card>

          <Card className="glass p-8 text-center group hover:neon-glow-magenta transition-all duration-300">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-neon-magenta to-neon-cyan rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-background" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-neon-magenta">
              ZetaChain NFT
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Mint your persona as an ERC-721 NFT on ZetaChain Athens Testnet
              with metadata stored on IPFS.
            </p>
          </Card>

          <Card className="glass p-8 text-center group hover:neon-glow-cyan transition-all duration-300">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-neon-purple to-neon-magenta rounded-full flex items-center justify-center">
                <Link className="h-8 w-8 text-background" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-neon-purple">
              Cross-Chain Assets
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Link your existing NFTs from Ethereum, Polygon, and Solana to your
              Omni-Soul persona.
            </p>
          </Card>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 bg-gradient-to-r from-neon-cyan/10 to-neon-magenta/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-neon-cyan to-neon-magenta bg-clip-text text-transparent">
              Ready to Create Your Digital Soul?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the future of digital identity. Mint your persona, chat with
              your AI self, and connect your cross-chain assets.
            </p>
            <Button asChild size="lg" className="neon-glow-magenta">
              <NextLink href="/create">
                <Sparkles className="mr-2 h-5 w-5" />
                Get Started Now
              </NextLink>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
