"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { NetworkGuard } from "@/components/NetworkGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PersonaCardSkeleton } from "@/components/LoadingSkeleton";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";

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
  ownerDisplayName: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function GalleryPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (isConnected) {
      fetchNFTs();
    }
  }, [isConnected, currentPage, sortBy]);

  const fetchNFTs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
      });

      const response = await fetch(`/api/nft/all?${params}`);
      const result = await response.json();

      if (result.success) {
        setNfts(result.data || []);
        setPagination(result.pagination);
      } else {
        setError(result.error || "Failed to load NFTs");
        toast.error("Failed to load NFTs");
      }
    } catch (err) {
      console.error("Error fetching NFTs:", err);
      setError("Failed to load NFTs");
      toast.error("Failed to load NFTs");
    } finally {
      setLoading(false);
    }
  };

  const filteredNFTs = nfts.filter((nft) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      nft.name.toLowerCase().includes(query) ||
      nft.description.toLowerCase().includes(query) ||
      nft.ownerDisplayName.toLowerCase().includes(query) ||
      nft.tokenId.includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-400">
            Please connect your wallet to view the NFT gallery
          </p>
        </div>
      </div>
    );
  }

  return (
    <NetworkGuard>
      <div className="min-h-screen bg-black flex flex-col">
        <div className="container mx-auto px-4 py-8 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Omni-Soul Gallery
            </h1>
            <p className="text-gray-400">
              Explore all Omni-Soul NFTs created by the community
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 max-w-md items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search NFTs, names, or owners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              <PersonaCardSkeleton />
              <PersonaCardSkeleton />
              <PersonaCardSkeleton />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={fetchNFTs} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredNFTs.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-white mb-2">
                No NFTs Found
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Be the first to create an Omni-Soul NFT!"}
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push("/create")}>
                  Create Your First NFT
                </Button>
              )}
            </div>
          )}

          {/* NFT Grid/List */}
          {!loading && !error && filteredNFTs.length > 0 && (
            <>
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1"
                }`}
              >
                {filteredNFTs.map((nft) => (
                  <motion.div
                    key={nft.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card
                      className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg overflow-hidden hover:border-cyan-500/40 hover:scale-105 transition-all duration-300 cursor-pointer group"
                      onClick={() => router.push(`/persona/${nft.tokenId}`)}
                    >
                      {/* NFT Image */}
                      <div className="aspect-square bg-gradient-to-br from-cyan-500/20 to-purple-500/20 relative overflow-hidden">
                        {nft.imageUrl ? (
                          <img
                            src={nft.imageUrl}
                            alt={nft.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
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
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-medium">
                            Click to view details
                          </div>
                        </div>
                      </div>

                      {/* NFT Info */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-semibold text-white mb-2 line-clamp-1">
                            {nft.name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            #{nft.tokenId}
                          </Badge>
                        </div>

                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {nft.description}
                        </p>

                        {/* Owner Info */}
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <User className="h-4 w-4 mr-2" />
                          <span>{nft.ownerDisplayName}</span>
                        </div>

                        {/* Creation Date */}
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDate(nft.createdAt)}</span>
                        </div>

                        {/* Files Count */}
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <FileText className="h-4 w-4 mr-2" />
                          <span>{nft.uploadedFiles.length} linked files</span>
                        </div>

                        {/* Action Buttons */}
                        <div
                          className="flex space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(`/persona/${nft.tokenId}`)
                            }
                            className="flex-1"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
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
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <span className="text-gray-400 text-sm">
                    Page {currentPage} of {pagination.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </NetworkGuard>
  );
}
