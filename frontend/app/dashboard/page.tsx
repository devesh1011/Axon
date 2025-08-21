"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Plus, ExternalLink, MessageCircle, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonaCardSkeleton } from "@/components/LoadingSkeleton";
import { NetworkGuard } from "@/components/NetworkGuard";
import { toast } from "sonner";

interface NFTData {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  metadataUri: string;
  pinataCid: string;
  imageCid: string;
  walletAddress: string;
  transactionHash: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown> | null;
  uploadedFiles: string[];
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserNFTs();
    }
  }, [isConnected, address]);

  const fetchUserNFTs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/nft/user/${address}`);
      const result = await response.json();

      if (result.success) {
        setNfts(result.data || []);
      } else {
        setError(result.error || "Failed to load NFTs");
        toast.error("Failed to load your NFTs");
      }
    } catch (err) {
      console.error("Error fetching NFTs:", err);
      setError("Failed to load NFTs");
      toast.error("Failed to load your NFTs");
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
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => router.push("/gallery")}
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
              >
                View All NFTs
              </Button>
            </div>
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
                <Button onClick={fetchUserNFTs} variant="outline">
                  Try Again
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && nfts.length === 0 && (
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

            {/* NFT Cards */}
            {nfts.map((nft) => (
              <div
                key={nft.id}
                className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg overflow-hidden hover:border-cyan-500/40 transition-colors"
              >
                <div className="aspect-square bg-gradient-to-br from-cyan-500/20 to-purple-500/20 relative">
                  {nft.imageUrl ? (
                    <img
                      src={nft.imageUrl}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to gradient background if image fails to load
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-cyan-400 text-4xl font-bold">
                        {nft.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {nft.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {nft.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Token #{nft.tokenId}</span>
                    <span>{nft.uploadedFiles.length} linked files</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/persona/${nft.tokenId}`)}
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
                          `https://athens.explorer.zetachain.com/tx/${nft.transactionHash}`,
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
