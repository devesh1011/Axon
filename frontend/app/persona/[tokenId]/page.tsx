"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ChatPanel } from "@/components/ChatPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  ExternalLink,
  Link,
  User,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import ky from "ky";

interface TokenData {
  tokenId: number;
  tokenURI: string;
  owner: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    personaCid?: string;
    files?: Array<{ cid: string; name: string; type: string }>;
    uploadedFiles?: Array<{ cid: string; name: string; type: string }>;
    attributes?: Array<{ trait_type: string; value: string }>;
    created_at: string;
  };
}

interface LinkedAsset {
  id: number;
  omni_soul_token_id: string;
  chain_name: string;
  asset_address: string;
  asset_id: string;
  metadata: string;
  wallet_address: string;
  transaction_hash: string;
  linked_at: string;
}

export default function PersonaPage() {
  const params = useParams();
  const tokenId = params.tokenId as string;
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [linkedAssets, setLinkedAssets] = useState<LinkedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showPersonaInfo, setShowPersonaInfo] = useState(false);

  useEffect(() => {
    const fetchTokenData = async () => {
      if (!tokenId || isNaN(Number(tokenId))) {
        setError("Invalid token ID");
        setLoading(false);
        return;
      }

      try {
        const [tokenResponse, linkedAssetsResponse] = await Promise.all([
          ky
            .get(`/api/omnisoul/token/${tokenId}`)
            .json<{ success: boolean; data?: TokenData; error?: string }>(),
          ky
            .get(`/api/omnisoul/linked-assets/${tokenId}`)
            .json<{ success: boolean; data?: LinkedAsset[]; error?: string }>(),
        ]);

        if (tokenResponse.success && tokenResponse.data) {
          console.log("Token data received:", tokenResponse.data);
          console.log("Metadata structure:", tokenResponse.data.metadata);
          setTokenData(tokenResponse.data);
        } else {
          setError(tokenResponse.error || "Token not found");
        }

        if (linkedAssetsResponse.success && linkedAssetsResponse.data) {
          setLinkedAssets(linkedAssetsResponse.data);
        }
      } catch (err) {
        console.error("Failed to fetch token data:", err);
        setError("Failed to load persona data");
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [tokenId]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getExplorerUrl = (address: string) => {
    const explorerBase =
      process.env.NEXT_PUBLIC_ZETA_EXPLORER ||
      "https://athens.explorer.zetachain.com";
    return `${explorerBase}/address/${address}`;
  };

  const getChainExplorerUrl = (
    chainName: string,
    assetAddress: string,
    assetId: string
  ) => {
    const explorers: Record<string, string> = {
      ethereum: "https://etherscan.io",
      polygon: "https://polygonscan.com",
      bsc: "https://bscscan.com",
      arbitrum: "https://arbiscan.io",
      optimism: "https://optimistic.etherscan.io",
      solana: "https://solscan.io",
    };

    const explorerBase = explorers[chainName.toLowerCase()];
    if (!explorerBase) return null;

    if (chainName.toLowerCase() === "solana") {
      return `${explorerBase}/token/${assetAddress}`;
    } else {
      return `${explorerBase}/token/${assetAddress}?a=${assetId}`;
    }
  };

  const toIpfsUrl = (uri: string | undefined) => {
    if (!uri) return "";
    if (/^https?:\/\//i.test(uri)) return uri;
    const cleaned = uri.replace(/^ipfs:\/\//i, "").replace(/^\/?ipfs\//i, "");
    const gateway =
      process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud";
    return `${gateway}/ipfs/${cleaned}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-6xl mx-auto space-y-8">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-48" />
                <Skeleton className="h-32" />
              </div>
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="glass p-8">
              <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Persona Not Found</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button asChild>
                <a href="/create">Create New Persona</a>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* Mobile-Friendly Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-neon-cyan to-neon-magenta rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                {tokenData.metadata.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={toIpfsUrl(tokenData.metadata.image)}
                    alt={tokenData.metadata.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Brain className="h-6 w-6 md:h-8 md:w-8 text-background" />
                )}
              </div>
              <div className="text-left">
                <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-neon-cyan to-neon-magenta bg-clip-text text-transparent">
                  {tokenData.metadata.name}
                </h1>
                <p className="text-sm md:text-lg text-muted-foreground max-w-2xl">
                  {tokenData.metadata.description}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-2 md:space-x-4">
              <Badge
                variant="outline"
                className="text-neon-cyan text-xs md:text-sm"
              >
                Token #{tokenData.tokenId}
              </Badge>
              <Badge
                variant="outline"
                className="text-neon-magenta text-xs md:text-sm"
              >
                ZetaChain Athens
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-1 gap-8">
            {/* Main Content - Chat Interface */}
            <div className="space-y-6">
              {/* Collapsible Persona Info */}
              <Card className="glass p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 md:space-x-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-neon-cyan to-neon-magenta rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {tokenData.metadata.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={toIpfsUrl(tokenData.metadata.image)}
                          alt={tokenData.metadata.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Brain className="h-6 w-6 md:h-8 md:w-8 text-background" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg md:text-2xl font-bold">
                        {tokenData.metadata.name}
                      </h2>
                      <p className="text-sm md:text-base text-muted-foreground">
                        {tokenData.metadata.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPersonaInfo(!showPersonaInfo)}
                    className="text-neon-cyan hover:text-neon-cyan/80"
                  >
                    {showPersonaInfo ? (
                      <ChevronUp className="h-4 w-4 md:h-5 md:w-5" />
                    ) : (
                      <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                  </Button>
                </div>

                {showPersonaInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-neon-cyan" />
                        <span className="text-sm">Owner:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              getExplorerUrl(tokenData.owner),
                              "_blank"
                            )
                          }
                          className="h-auto p-0 text-neon-cyan hover:text-neon-cyan/80"
                        >
                          {formatAddress(tokenData.owner)}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </Card>

              {/* Tabs for different sections */}
              <Tabs defaultValue="attributes" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="attributes">Attributes</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="linked">Linked Assets</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="attributes" className="space-y-4">
                  {(() => {
                    const attributes = tokenData.metadata.attributes || [];
                    console.log("Attributes check:", attributes);
                    return attributes.length > 0 ? (
                      <Card className="glass p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {attributes.map((attr, index) => (
                            <div
                              key={index}
                              className="p-3 bg-card/50 rounded-lg border text-center"
                            >
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                {attr.trait_type}
                              </p>
                              <p className="font-medium mt-1">{attr.value}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ) : (
                      <Card className="glass p-6 text-center">
                        <p className="text-muted-foreground">
                          No attributes defined for this persona
                        </p>
                        <details className="mt-4 text-left">
                          <summary className="cursor-pointer text-sm text-neon-cyan">
                            Debug: Show metadata structure
                          </summary>
                          <pre className="mt-2 text-xs bg-card/50 p-2 rounded overflow-auto">
                            {JSON.stringify(tokenData.metadata, null, 2)}
                          </pre>
                          <div className="mt-2 text-xs">
                            <p>
                              <strong>Attributes found:</strong>{" "}
                              {attributes.length}
                            </p>
                            <p>
                              <strong>Has attributes property:</strong>{" "}
                              {!!tokenData.metadata.attributes}
                            </p>
                          </div>
                        </details>
                      </Card>
                    );
                  })()}
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                  {(() => {
                    const files =
                      tokenData.metadata.files ||
                      tokenData.metadata.uploadedFiles ||
                      [];
                    console.log("Files check:", files);
                    return files.length > 0 ? (
                      <Card className="glass p-6">
                        <div className="space-y-3">
                          {files.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-card/50 rounded-lg border"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-neon-purple to-neon-cyan rounded flex items-center justify-center">
                                  <span className="text-xs font-bold text-background">
                                    {file.name
                                      .split(".")
                                      .pop()
                                      ?.toUpperCase() || "FILE"}
                                  </span>
                                </div>
                                <span className="font-medium">{file.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    `https://ipfs.io/ipfs/${file.cid}`,
                                    "_blank"
                                  )
                                }
                                className="h-8 w-8 p-0"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ) : (
                      <Card className="glass p-6 text-center">
                        <p className="text-muted-foreground">
                          No files uploaded for this persona
                        </p>
                        <details className="mt-4 text-left">
                          <summary className="cursor-pointer text-sm text-neon-cyan">
                            Debug: Show metadata structure
                          </summary>
                          <pre className="mt-2 text-xs bg-card/50 p-2 rounded overflow-auto">
                            {JSON.stringify(tokenData.metadata, null, 2)}
                          </pre>
                          <div className="mt-2 text-xs">
                            <p>
                              <strong>Files found:</strong> {files.length}
                            </p>
                            <p>
                              <strong>Has files property:</strong>{" "}
                              {!!tokenData.metadata.files}
                            </p>
                            <p>
                              <strong>Has uploadedFiles property:</strong>{" "}
                              {!!tokenData.metadata.uploadedFiles}
                            </p>
                          </div>
                        </details>
                      </Card>
                    );
                  })()}
                </TabsContent>

                <TabsContent value="linked" className="space-y-4">
                  {linkedAssets.length > 0 ? (
                    <Card className="glass p-6">
                      <div className="space-y-4">
                        {linkedAssets.map((asset, index) => (
                          <div
                            key={asset.id}
                            className="flex items-center justify-between p-4 bg-card/50 rounded-lg border"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-neon-magenta to-neon-purple rounded-full flex items-center justify-center">
                                <Link className="h-6 w-6 text-background" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <Badge
                                    variant="secondary"
                                    className="capitalize"
                                  >
                                    {asset.chain_name}
                                  </Badge>
                                  <span className="font-medium">
                                    {asset.asset_address.slice(0, 6)}...
                                    {asset.asset_address.slice(-4)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Token ID: {asset.asset_id} • Linked{" "}
                                  {new Date(
                                    asset.linked_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const explorerUrl = getChainExplorerUrl(
                                    asset.chain_name,
                                    asset.asset_address,
                                    asset.asset_id
                                  );
                                  if (explorerUrl) {
                                    window.open(explorerUrl, "_blank");
                                  }
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ) : (
                    <Card className="glass p-6 text-center">
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-neon-magenta to-neon-purple rounded-full flex items-center justify-center">
                          <Link className="h-8 w-8 text-background" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-neon-magenta mb-2">
                            No Linked Assets
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            This persona doesn&apos;t have any cross-chain
                            assets linked yet
                          </p>
                          <Button
                            asChild
                            variant="outline"
                            className="glass bg-transparent"
                          >
                            <a href="/link">
                              <Link className="mr-2 h-4 w-4" />
                              Link Assets
                            </a>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <Card className="glass p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Token ID:</span>
                        <span className="font-mono">#{tokenData.tokenId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Network:</span>
                        <span>ZetaChain Athens</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Created:</span>
                        <span>
                          {new Date(
                            tokenData.metadata.created_at
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Token URI:
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://ipfs.io/ipfs/${tokenData.tokenURI.replace(
                                "ipfs://",
                                ""
                              )}`,
                              "_blank"
                            )
                          }
                          className="h-auto p-0 text-neon-cyan hover:text-neon-cyan/80"
                        >
                          View Metadata
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Chat Interface - Full Width */}
            <div className="flex flex-col h-[calc(100vh-300px)] min-h-[600px] relative">
              <ChatPanel
                tokenId={tokenId}
                personaName={tokenData.metadata.name}
              />

              {/* Floating Action Button for Linking Assets */}
              <div className="fixed bottom-6 right-6 z-50">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full w-14 h-14 bg-gradient-to-r from-neon-magenta to-neon-purple hover:opacity-90 shadow-lg"
                >
                  <a href={`/link?tokenId=${tokenId}`}>
                    <Plus className="h-6 w-6" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
