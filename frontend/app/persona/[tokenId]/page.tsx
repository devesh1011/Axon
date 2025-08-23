"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { ChatPanel } from "@/components/ChatPanel"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, ExternalLink, Link, User } from "lucide-react"
import { motion } from "framer-motion"
import ky from "ky"

interface TokenData {
  tokenId: number
  tokenURI: string
  owner: string
  metadata: {
    name: string
    description: string
    image: string
    personaCid?: string
    files?: Array<{ cid: string; name: string; type: string }>
    attributes?: Array<{ trait_type: string; value: string }>
    created_at: string
  }
}

export default function PersonaPage() {
  const params = useParams()
  const tokenId = params.tokenId as string
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const fetchTokenData = async () => {
      if (!tokenId || isNaN(Number(tokenId))) {
        setError("Invalid token ID")
        setLoading(false)
        return
      }

      try {
        const response = await ky
          .get(`/api/omnisoul/token/${tokenId}`)
          .json<{ success: boolean; data?: TokenData; error?: string }>()

        if (response.success && response.data) {
          setTokenData(response.data)
        } else {
          setError(response.error || "Token not found")
        }
      } catch (err) {
        console.error("Failed to fetch token data:", err)
        setError("Failed to load persona data")
      } finally {
        setLoading(false)
      }
    }

    fetchTokenData()
  }, [tokenId])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getExplorerUrl = (address: string) => {
    const explorerBase = process.env.NEXT_PUBLIC_ZETA_EXPLORER || "https://athens.explorer.zetachain.com"
    return `${explorerBase}/address/${address}`
  }

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
    )
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
    )
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
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-neon-cyan to-neon-magenta bg-clip-text text-transparent mb-4">
              {tokenData.metadata.name}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">{tokenData.metadata.description}</p>
            <div className="flex items-center justify-center space-x-4">
              <Badge variant="outline" className="text-neon-cyan">
                Token #{tokenData.tokenId}
              </Badge>
              <Badge variant="outline" className="text-neon-magenta">
                ZetaChain Athens
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Persona Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Persona Card */}
              <Card className="glass p-6">
                <div className="flex items-start space-x-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-neon-cyan to-neon-magenta rounded-full flex items-center justify-center flex-shrink-0">
                    <Brain className="h-12 w-12 text-background" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{tokenData.metadata.name}</h3>
                    <p className="text-muted-foreground mb-4">{tokenData.metadata.description}</p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-neon-cyan" />
                        <span className="text-sm">Owner:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getExplorerUrl(tokenData.owner), "_blank")}
                          className="h-auto p-0 text-neon-cyan hover:text-neon-cyan/80"
                        >
                          {formatAddress(tokenData.owner)}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Tabs for different sections */}
              <Tabs defaultValue="attributes" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="attributes">Attributes</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="attributes" className="space-y-4">
                  {tokenData.metadata.attributes && tokenData.metadata.attributes.length > 0 ? (
                    <Card className="glass p-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {tokenData.metadata.attributes.map((attr, index) => (
                          <div key={index} className="p-3 bg-card/50 rounded-lg border text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">{attr.trait_type}</p>
                            <p className="font-medium mt-1">{attr.value}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ) : (
                    <Card className="glass p-6 text-center">
                      <p className="text-muted-foreground">No attributes defined for this persona</p>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                  {tokenData.metadata.files && tokenData.metadata.files.length > 0 ? (
                    <Card className="glass p-6">
                      <div className="space-y-3">
                        {tokenData.metadata.files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-card/50 rounded-lg border"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-neon-purple to-neon-cyan rounded flex items-center justify-center">
                                <span className="text-xs font-bold text-background">
                                  {file.name.split(".").pop()?.toUpperCase() || "FILE"}
                                </span>
                              </div>
                              <span className="font-medium">{file.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://ipfs.io/ipfs/${file.cid}`, "_blank")}
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
                      <p className="text-muted-foreground">No files uploaded for this persona</p>
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
                        <span>{new Date(tokenData.metadata.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Token URI:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(`https://ipfs.io/ipfs/${tokenData.tokenURI.replace("ipfs://", "")}`, "_blank")
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

            {/* Right Column - Chat */}
            <div className="space-y-6">
              <ChatPanel tokenId={tokenId} personaName={tokenData.metadata.name} />

              {/* Link Assets Card */}
              <Card className="glass p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-neon-magenta to-neon-purple rounded-full flex items-center justify-center">
                    <Link className="h-8 w-8 text-background" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neon-magenta mb-2">Link Cross-Chain Assets</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect your NFTs from other chains to this persona
                    </p>
                  </div>
                  <Button asChild variant="outline" className="w-full glass bg-transparent" size="lg">
                    <a href="/link">
                      <Link className="mr-2 h-5 w-5" />
                      Link Assets
                    </a>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
