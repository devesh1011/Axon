"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Plus, ExternalLink, MessageCircle, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonaCardSkeleton } from "@/components/LoadingSkeleton";
import { NetworkGuard } from "@/components/NetworkGuard";

interface PersonaToken {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  createdAt: string;
  linkedAssets: number;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [personas, setPersonas] = useState<PersonaToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserPersonas();
    }
  }, [isConnected, address]);

  const fetchUserPersonas = async () => {
    try {
      setLoading(true);
      // In a real implementation, you'd fetch from your API
      // For now, we'll simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPersonas([]);
    } catch (err) {
      setError("Failed to load personas");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-400">
            Please connect your wallet to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <NetworkGuard>
      <div className="min-h-screen bg-black flex flex-col">
        <div className="container mx-auto px-4 py-8 flex-1 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Your Digital Personas
            </h1>
            <p className="text-gray-400">
              Manage your OmniSoul NFTs and linked cross-chain assets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Persona Card */}
            <div
              onClick={() => router.push("/create")}
              className="bg-gray-900/50 backdrop-blur-sm border border-dashed border-cyan-500/30 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-colors group"
            >
              <Plus className="w-12 h-12 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Create New Persona
              </h3>
              <p className="text-gray-400 text-center">
                Mint a new OmniSoul NFT with your digital identity
              </p>
            </div>

            {/* Loading Skeletons */}
            {loading && (
              <>
                <PersonaCardSkeleton />
                <PersonaCardSkeleton />
                <PersonaCardSkeleton />
              </>
            )}

            {/* Error State */}
            {error && (
              <div className="col-span-full text-center py-12">
                <p className="text-red-400 mb-4">{error}</p>
                <Button onClick={fetchUserPersonas} variant="outline">
                  Try Again
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && personas.length === 0 && (
              <div className="col-span-full text-center py-12">
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Personas Yet
                </h3>
                <p className="text-gray-400 mb-6">
                  Create your first digital persona to get started
                </p>
                <Button onClick={() => router.push("/create")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Persona
                </Button>
              </div>
            )}

            {/* Persona Cards */}
            {personas.map((persona) => (
              <div
                key={persona.tokenId}
                className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg overflow-hidden hover:border-cyan-500/40 transition-colors"
              >
                <div className="aspect-square bg-gradient-to-br from-cyan-500/20 to-purple-500/20 relative">
                  {persona.image && (
                    <img
                      src={persona.image || "/placeholder.svg"}
                      alt={persona.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {persona.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {persona.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Token #{persona.tokenId}</span>
                    <span>{persona.linkedAssets} linked assets</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/persona/${persona.tokenId}`)}
                      className="flex-1"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push("/link")}
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `https://athens.explorer.zetachain.com/token/${process.env.NEXT_PUBLIC_OMNISOUL_ADDRESS}/${persona.tokenId}`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NetworkGuard>
  );
}
