"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { NetworkGuard } from "@/components/NetworkGuard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ArrowRight,
  Plus,
  X,
  Upload,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useOmniSoulContract } from "@/hooks/useContract";
import { toast } from "sonner";

interface PersonalData {
  name: string;
  description: string;
  bio: string;
  background: string;
  interests: string[];
  goals: string[];
  personality_traits: string[];
}

interface SelectedFile {
  file: File;
  name: string;
  type: string;
  size: number;
}

export default function CreatePage() {
  const { address } = useAccount();
  const router = useRouter();
  const {
    mintOmniSoul,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    receipt,
    error,
  } = useOmniSoulContract();
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [mintedTokenId, setMintedTokenId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdTokenURI, setCreatedTokenURI] = useState<string>("");

  // Function to extract token ID from transaction receipt
  const extractTokenIdFromReceipt = (receipt: unknown): string | null => {
    try {
      const receiptData = receipt as { logs?: Array<{ topics?: string[] }> };
      if (!receiptData?.logs) return null;

      // Look for Transfer event: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
      // The Transfer event signature hash is: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
      const transferEventSignature =
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

      for (const log of receiptData.logs) {
        if (log.topics && log.topics[0] === transferEventSignature) {
          // For NFT Transfer events:
          // topics[0] = event signature
          // topics[1] = from address (indexed)
          // topics[2] = to address (indexed)
          // topics[3] = tokenId (indexed)
          if (log.topics[3]) {
            const tokenId = BigInt(log.topics[3]).toString();
            console.log("Extracted token ID from receipt:", tokenId);
            return tokenId;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error extracting token ID from receipt:", error);
      return null;
    }
  };

  // Handle minting completion
  useEffect(() => {
    if (isConfirmed && hash && createdTokenURI && !mintedTokenId) {
      // TODO: Extract actual token ID from transaction receipt
      // For now, we'll create a timestamp-based ID since we can't easily get the return value
      // In production, you'd want to parse the transaction receipt for the Transfer event
      const timestampTokenId = Date.now().toString();
      setMintedTokenId(timestampTokenId);
      toast.success(`Omni-Soul NFT minted successfully! Transaction: ${hash}`);
      setIsProcessing(false);
    }
  }, [isConfirmed, hash, createdTokenURI, mintedTokenId]);

  // Handle minting errors
  useEffect(() => {
    if (error) {
      console.error("Minting error:", error);
      toast.error(`Minting failed: ${error.message}`);
      setIsProcessing(false);
    }
  }, [error]);
  const [personalData, setPersonalData] = useState<PersonalData>({
    name: "",
    description: "",
    bio: "",
    background: "",
    interests: [],
    goals: [],
    personality_traits: [],
  });
  const [newInterest, setNewInterest] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newTrait, setNewTrait] = useState("");

  const handleFilesSelected = (files: File[]) => {
    const fileData = files.map((file) => ({
      file,
      name: file.name,
      type: file.type,
      size: file.size,
    }));
    setSelectedFiles(fileData);
  };

  const handleCreateOmniSoul = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!personalData.name || !personalData.description) {
      toast.error(
        "Please provide at least a name and description for your Omni-Soul"
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Upload files to IPFS (if any)
      const uploadedFileCIDs: Array<{
        cid: string;
        name: string;
        type: string;
      }> = [];

      if (selectedFiles.length > 0) {
        console.log("Uploading files to IPFS...");
        toast.info("Uploading files to IPFS...");

        for (const fileData of selectedFiles) {
          const formData = new FormData();
          formData.append("file", fileData.file);
          formData.append("pinName", `omni-soul-${fileData.name}`);

          const response = await fetch("/api/ipfs/upload", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();

          if (result.success && result.data) {
            uploadedFileCIDs.push({
              cid: result.data.cid,
              name: fileData.name,
              type: fileData.type,
            });
          } else {
            throw new Error(
              `Failed to upload ${fileData.name}: ${result.error}`
            );
          }
        }
        console.log("Files uploaded successfully:", uploadedFileCIDs);
        toast.success("Files uploaded to IPFS successfully!");
      }

      // Step 2: Create and upload metadata JSON
      console.log("Creating metadata...");
      toast.info("Creating metadata...");
      const metadataResponse = await fetch("/api/nft/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: {
            name: personalData.name,
            description: personalData.description,
            attributes: [
              ...(personalData.interests.length > 0
                ? [
                    {
                      trait_type: "Interests",
                      value: personalData.interests.join(", "),
                    },
                  ]
                : []),
              ...(personalData.goals.length > 0
                ? [
                    {
                      trait_type: "Goals",
                      value: personalData.goals.join(", "),
                    },
                  ]
                : []),
              ...(personalData.personality_traits.length > 0
                ? [
                    {
                      trait_type: "Personality Traits",
                      value: personalData.personality_traits.join(", "),
                    },
                  ]
                : []),
            ],
            personalData: {
              bio: personalData.bio,
              background: personalData.background,
              interests: personalData.interests,
              goals: personalData.goals,
              personality_traits: personalData.personality_traits,
            },
            uploadedFiles: uploadedFileCIDs,
          },
        }),
      });

      const metadataResult = await metadataResponse.json();

      if (!metadataResult.success) {
        throw new Error(
          metadataResult.error?.message || "Failed to create metadata"
        );
      }

      console.log("Metadata created successfully:", metadataResult.tokenURI);
      toast.success("Metadata created successfully!");

      // Store the tokenURI for the minting process
      setCreatedTokenURI(metadataResult.tokenURI);

      // Step 3: Mint NFT using user's wallet
      console.log("Initiating NFT mint...");
      console.log("Minting to address:", address);
      console.log("TokenURI:", metadataResult.tokenURI);
      toast.info("Please confirm the transaction in your wallet...");

      if (!address) {
        throw new Error("Wallet address not found");
      }

      console.log("Minting NFT...");
      mintOmniSoul(address as `0x${string}`, metadataResult.tokenURI);
    } catch (error) {
      console.error("Error creating Omni-Soul:", error);
      toast.error(
        `Failed to create Omni-Soul: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsProcessing(false);
    }
  };

  // Effect to handle transaction confirmation and navigation
  useEffect(() => {
    if (isConfirmed && receipt) {
      console.log("Transaction confirmed with receipt:", receipt);

      // Extract the actual token ID from the transaction receipt
      const extractedTokenId = extractTokenIdFromReceipt(receipt);

      if (extractedTokenId) {
        console.log("Successfully minted with token ID:", extractedTokenId);
        setMintedTokenId(extractedTokenId);

        toast.success(
          `OmniSoul minted successfully! Token ID: ${extractedTokenId}`
        );

        // Navigate to the minted persona page
        router.push(`/omnisoul/${extractedTokenId}`);
        setIsProcessing(false);
      } else {
        console.error("Failed to extract token ID from transaction receipt");
        toast.error("Failed to extract token ID from transaction");
        setIsProcessing(false);
      }
    }
  }, [isConfirmed, receipt, router]);

  // Effect to handle transaction errors
  useEffect(() => {
    if (error) {
      console.error("Transaction error:", error);
      toast.error(`Transaction failed: ${error.message}`);
      setIsProcessing(false);
    }
  }, [error]);

  const addInterest = () => {
    if (newInterest.trim()) {
      setPersonalData((prev) => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()],
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (index: number) => {
    setPersonalData((prev) => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index),
    }));
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setPersonalData((prev) => ({
        ...prev,
        goals: [...prev.goals, newGoal.trim()],
      }));
      setNewGoal("");
    }
  };

  const removeGoal = (index: number) => {
    setPersonalData((prev) => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const addTrait = () => {
    if (newTrait.trim()) {
      setPersonalData((prev) => ({
        ...prev,
        personality_traits: [...prev.personality_traits, newTrait.trim()],
      }));
      setNewTrait("");
    }
  };

  const removeTrait = (index: number) => {
    setPersonalData((prev) => ({
      ...prev,
      personality_traits: prev.personality_traits.filter((_, i) => i !== index),
    }));
  };

  const steps = [
    {
      number: 1,
      title: "Create Persona",
      description: "Upload files and define your digital identity",
    },
    {
      number: 2,
      title: "Complete",
      description: "Your digital persona is ready!",
    },
  ];

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
                Create Your Omni-Soul
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Create your complete digital persona in one step: upload files,
                define your identity, and mint your AI-powered NFT
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-center mb-12">
              <div className="flex items-center space-x-4">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                          ${
                            mintedTokenId
                              ? "bg-gradient-to-r from-neon-cyan to-neon-magenta text-background neon-glow-cyan"
                              : step.number === 1
                              ? "bg-gradient-to-r from-neon-cyan to-neon-magenta text-background neon-glow-cyan"
                              : "bg-card border-2 border-border text-muted-foreground"
                          }
                        `}
                      >
                        {mintedTokenId && step.number === 1 ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : mintedTokenId && step.number === 2 ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          step.number
                        )}
                      </div>
                      <div className="min-w-[160px] max-w-[220px]">
                        <p
                          className={`font-medium ${
                            mintedTokenId || step.number === 1
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <ArrowRight className="h-5 w-5 text-muted-foreground mx-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-8">
              {/* Single Form - Only show if not minted */}
              {!mintedTokenId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* File Upload Section */}
                  <Card className="glass p-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-neon-cyan mb-2">
                          Upload Your Persona Files
                        </h3>
                        <p className="text-muted-foreground">
                          Upload documents that represent your persona (PDFs,
                          text files, etc.)
                        </p>
                      </div>

                      {/* File Drop Zone - We'll create this inline */}
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-neon-cyan/50 transition-colors">
                        <input
                          type="file"
                          multiple
                          accept=".txt,.md,.pdf,.json"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleFilesSelected(Array.from(e.target.files));
                            }
                          }}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-12 h-12 bg-neon-cyan/10 rounded-full flex items-center justify-center">
                              <Upload className="h-6 w-6 text-neon-cyan" />
                            </div>
                            <p className="text-lg font-medium">
                              Drop files here or click to upload
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Supports: .txt, .md, .pdf, .json (Max 10MB each)
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* Selected Files Display */}
                      {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Selected Files:</p>
                          {selectedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-card/50 rounded-lg p-3"
                            >
                              <div className="flex items-center space-x-3">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedFiles((files) =>
                                    files.filter((_, i) => i !== index)
                                  );
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Personal Data Form */}
                  <Card className="glass p-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-neon-cyan mb-2">
                          Define Your Persona
                        </h3>
                        <p className="text-muted-foreground">
                          Tell us about yourself to create your digital identity
                        </p>
                      </div>

                      <div className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Name *
                            </label>
                            <Input
                              placeholder="Your persona name"
                              value={personalData.name}
                              onChange={(e) =>
                                setPersonalData((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Description *
                            </label>
                            <Input
                              placeholder="Brief description"
                              value={personalData.description}
                              onChange={(e) =>
                                setPersonalData((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Bio
                          </label>
                          <Textarea
                            placeholder="Tell us about yourself..."
                            value={personalData.bio}
                            onChange={(e) =>
                              setPersonalData((prev) => ({
                                ...prev,
                                bio: e.target.value,
                              }))
                            }
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Background
                          </label>
                          <Textarea
                            placeholder="Your background, education, experience..."
                            value={personalData.background}
                            onChange={(e) =>
                              setPersonalData((prev) => ({
                                ...prev,
                                background: e.target.value,
                              }))
                            }
                            rows={3}
                          />
                        </div>

                        {/* Interests */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Interests
                          </label>
                          <div className="flex gap-2 mb-2">
                            <Input
                              placeholder="Add an interest"
                              value={newInterest}
                              onChange={(e) => setNewInterest(e.target.value)}
                              onKeyPress={(e) =>
                                e.key === "Enter" && addInterest()
                              }
                            />
                            <Button
                              type="button"
                              onClick={addInterest}
                              size="sm"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {personalData.interests.map((interest, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {interest}
                                <button onClick={() => removeInterest(index)}>
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Goals */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Goals
                          </label>
                          <div className="flex gap-2 mb-2">
                            <Input
                              placeholder="Add a goal"
                              value={newGoal}
                              onChange={(e) => setNewGoal(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && addGoal()}
                            />
                            <Button type="button" onClick={addGoal} size="sm">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {personalData.goals.map((goal, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {goal}
                                <button onClick={() => removeGoal(index)}>
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Personality Traits */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Personality Traits
                          </label>
                          <div className="flex gap-2 mb-2">
                            <Input
                              placeholder="Add a personality trait"
                              value={newTrait}
                              onChange={(e) => setNewTrait(e.target.value)}
                              onKeyPress={(e) =>
                                e.key === "Enter" && addTrait()
                              }
                            />
                            <Button type="button" onClick={addTrait} size="sm">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {personalData.personality_traits.map(
                              (trait, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  {trait}
                                  <button onClick={() => removeTrait(index)}>
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Create & Mint Button */}
                  <Card className="glass p-6">
                    <div className="text-center space-y-4">
                      <h3 className="text-xl font-bold text-neon-cyan">
                        Ready to Create Your Omni-Soul?
                      </h3>
                      <p className="text-muted-foreground">
                        This will upload your files, create metadata, and mint
                        your NFT in one step
                      </p>

                      <Button
                        onClick={handleCreateOmniSoul}
                        disabled={
                          isProcessing ||
                          isPending ||
                          isConfirming ||
                          !personalData.name ||
                          !personalData.description
                        }
                        className="w-full max-w-md bg-gradient-to-r from-neon-cyan to-neon-magenta hover:opacity-90 text-background font-bold py-3"
                        size="lg"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Creating Metadata...
                          </>
                        ) : isPending ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Confirm in Wallet...
                          </>
                        ) : isConfirming ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Minting NFT...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5 mr-2" />
                            Create & Mint Omni-Soul NFT
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Success State */}
              {mintedTokenId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <Card className="glass p-8 text-center">
                    <div className="space-y-6">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-neon-cyan to-neon-magenta rounded-full flex items-center justify-center neon-glow-cyan">
                        <CheckCircle className="h-10 w-10 text-background" />
                      </div>

                      <div>
                        <h3 className="text-3xl font-bold text-neon-cyan mb-2">
                          Congratulations!
                        </h3>
                        <p className="text-lg text-muted-foreground mb-4">
                          Your Omni-Soul has been successfully minted on
                          ZetaChain! You can view the transaction on the
                          blockchain explorer.
                        </p>
                        <div className="space-y-2">
                          <Badge variant="secondary" className="text-sm">
                            Transaction: {hash?.slice(0, 10)}...
                            {hash?.slice(-8)}
                          </Badge>
                          <br />
                          <Badge variant="outline" className="text-sm">
                            Reference ID: {mintedTokenId}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                          href={`/persona/${mintedTokenId}`}
                          className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-magenta text-background font-medium rounded-lg hover:opacity-90 transition-opacity"
                        >
                          View Your Persona
                        </a>
                        <a
                          href="/create"
                          className="inline-flex items-center justify-center px-6 py-3 border border-border bg-card/50 text-foreground font-medium rounded-lg hover:bg-card/70 transition-colors"
                        >
                          Create Another
                        </a>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </NetworkGuard>
  );
}
