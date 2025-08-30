"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Link, CheckCircle } from "lucide-react";
import Image from "next/image";
import { demoNFTs, DEMO_MODE } from "@/lib/demoData";

const getBlockchainColor = (blockchain: string) => {
  const colors = {
    ethereum: "bg-blue-500",
    polygon: "bg-purple-500",
    bsc: "bg-yellow-500",
    arbitrum: "bg-cyan-500",
    optimism: "bg-red-500",
    solana: "bg-green-500",
  };
  return colors[blockchain as keyof typeof colors] || "bg-gray-500";
};

const getBlockchainExplorerUrl = (
  blockchain: string,
  address: string,
  tokenId?: string
) => {
  const explorers = {
    ethereum: `https://etherscan.io/token/${address}${
      tokenId ? `?a=${tokenId}` : ""
    }`,
    polygon: `https://polygonscan.com/token/${address}${
      tokenId ? `?a=${tokenId}` : ""
    }`,
    bsc: `https://bscscan.com/token/${address}${
      tokenId ? `?a=${tokenId}` : ""
    }`,
    arbitrum: `https://arbiscan.io/token/${address}${
      tokenId ? `?a=${tokenId}` : ""
    }`,
    optimism: `https://optimistic.etherscan.io/token/${address}${
      tokenId ? `?a=${tokenId}` : ""
    }`,
    solana: `https://solscan.io/token/${address}`,
  };
  return explorers[blockchain as keyof typeof explorers] || "#";
};

export default function DemoCrossChainAssets() {
  const [selectedNFTs, setSelectedNFTs] = useState<Set<string>>(new Set());
  const [linkedNFTs, setLinkedNFTs] = useState<Set<string>>(new Set());
  const [isLinking, setIsLinking] = useState<string | null>(null);

  if (!DEMO_MODE) {
    return null;
  }

  const handleSelectNFT = (nftId: string) => {
    const newSelected = new Set(selectedNFTs);
    if (newSelected.has(nftId)) {
      newSelected.delete(nftId);
    } else {
      newSelected.add(nftId);
    }
    setSelectedNFTs(newSelected);
  };

  const handleLinkAsset = async (nft: Record<string, any>) => {
    const address = nft.contractAddress || nft.mint || "";
    const token = nft.tokenId || "";
    const nftId = `${nft.blockchain}-${address}-${token}`;
    setIsLinking(nftId);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const newLinked = new Set(linkedNFTs);
    newLinked.add(nftId);
    setLinkedNFTs(newLinked);
    setIsLinking(null);

    // Remove from selected
    const newSelected = new Set(selectedNFTs);
    newSelected.delete(nftId);
    setSelectedNFTs(newSelected);
  };

  const allNFTs = Object.entries(demoNFTs).flatMap(([blockchain, nfts]) =>
    nfts.map((nft) => ({ ...nft, blockchain }))
  );

  return (
    <div className="space-y-6">
      <Card className="glass border-neon-cyan/20">
        <CardHeader>
          <CardTitle className="text-neon-cyan flex items-center gap-2">
            <Link className="h-5 w-5" />
            Demo: Cross-Chain Asset Linking
          </CardTitle>
          <p className="text-muted-foreground">
            This demo showcases how users can link NFTs from multiple
            blockchains to their digital persona.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allNFTs.map((nft) => {
              const address =
                (nft as Record<string, any>).contractAddress ||
                (nft as Record<string, any>).mint ||
                "";
              const token = (nft as Record<string, any>).tokenId || "";
              const nftId = `${nft.blockchain}-${address}-${token}`;
              const isSelected = selectedNFTs.has(nftId);
              const isLinked = linkedNFTs.has(nftId);
              const isCurrentlyLinking = isLinking === nftId;

              return (
                <Card
                  key={nftId}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected ? "ring-2 ring-neon-cyan" : ""
                  } ${isLinked ? "opacity-60 ring-2 ring-green-500" : ""}`}
                  onClick={() =>
                    !isLinked && !isCurrentlyLinking && handleSelectNFT(nftId)
                  }
                >
                  <div className="relative">
                    <Image
                      src={nft.image}
                      alt={nft.name}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover rounded-t-lg"
                      onError={(e) => {
                        e.currentTarget.src = `https://via.placeholder.com/300x300/1a1b1f/00ffff?text=${encodeURIComponent(
                          nft.name
                        )}`;
                      }}
                    />
                    <Badge
                      className={`absolute top-2 right-2 ${getBlockchainColor(
                        nft.blockchain
                      )} text-white`}
                    >
                      {nft.blockchain.toUpperCase()}
                    </Badge>
                    {isLinked && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-1">{nft.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {nft.collection}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-muted-foreground">
                          {nft.blockchain === "solana" ? "Mint:" : "Token #"}
                        </span>
                        <span className="ml-1 font-mono">
                          {nft.blockchain === "solana"
                            ? `${address.slice(0, 8)}...`
                            : token}
                        </span>
                      </div>
                      <a
                        href={getBlockchainExplorerUrl(
                          nft.blockchain,
                          address,
                          token
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-neon-cyan hover:text-neon-cyan/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    {isSelected && !isLinked && (
                      <Button
                        className="w-full mt-3"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLinkAsset(nft);
                        }}
                        disabled={isCurrentlyLinking}
                      >
                        {isCurrentlyLinking ? "Linking..." : "Link to Persona"}
                      </Button>
                    )}
                    {isLinked && (
                      <div className="w-full mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-center">
                        <span className="text-green-500 text-sm font-medium">
                          ✓ Linked
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedNFTs.size > 0 && (
        <Card className="glass border-orange-500/20">
          <CardContent className="p-4">
            <p className="text-orange-400 font-medium">
              📝 Demo Instructions: Click &ldquo;Link to Persona&rdquo; on
              selected NFTs to simulate the cross-chain linking process.
            </p>
          </CardContent>
        </Card>
      )}

      {linkedNFTs.size > 0 && (
        <Card className="glass border-green-500/20">
          <CardContent className="p-4">
            <p className="text-green-400 font-medium">
              ✅ Successfully linked {linkedNFTs.size} cross-chain asset
              {linkedNFTs.size > 1 ? "s" : ""} to this persona!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
