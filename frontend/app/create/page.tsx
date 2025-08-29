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
  const [nftImage, setNftImage] = useState<SelectedFile | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPostProcessing, setIsPostProcessing] = useState(false);
  const [isFullyComplete, setIsFullyComplete] = useState(false);
  const [createdTokenURI, setCreatedTokenURI] = useState<string>("");

  // Function to extract token ID from transaction receipt
  const extractTokenIdFromReceipt = (receipt: unknown): string | null => {
    try {
      const receiptData = receipt as { logs?: Array<{ topics?: string[] }> };
      if (!receiptData?.logs) return null;
      const transferEventSignature =
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
      for (const log of receiptData.logs) {
        if (
          log.topics &&
          log.topics[0] === transferEventSignature &&
          log.topics[3]
        ) {
          return BigInt(log.topics[3]).toString();
        }
      }
      return null;
    } catch (e) {
      console.error("Error extracting token ID:", e);
      return null;
    }
  };

  // Handle minting errors
  useEffect(() => {
    if (error) {
      console.error("Minting error:", error);
      toast.error(`Minting failed: ${error.message}`);
      setIsProcessing(false);
      setIsPostProcessing(false);
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

  const handleNftImageSelected = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file for the NFT");
      return;
    }
    setNftImage({ file, name: file.name, type: file.type, size: file.size });
  };

  const handleCreateOmniSoul = async () => {
    if (
      !address ||
      !personalData.name ||
      !personalData.description ||
      !nftImage
    ) {
      toast.error("Please provide a name, description, and an NFT image.");
      return;
    }
    setIsProcessing(true);
    try {
      const placeholderTokenURI = `data:application/json;base64,${btoa(
        JSON.stringify({
          name: personalData.name,
          description: personalData.description,
        })
      )}`;
      toast.info("Please confirm the transaction in your wallet...");
      mintOmniSoul(address as `0x${string}`, placeholderTokenURI);
    } catch (e) {
      toast.error(
        `Failed to initiate mint: ${
          e instanceof Error ? e.message : "Unknown error"
        }`
      );
      setIsProcessing(false);
    }
  };

  const handlePostTransactionProcessing = async (
    tokenId: string,
    txHash: string
  ) => {
    setIsPostProcessing(true);
    toast.info("Transaction confirmed! Setting up your Omni-Soul...");

    try {
      let nftImageCID = "";
      if (nftImage) {
        const imageFormData = new FormData();
        imageFormData.append("file", nftImage.file);
        const imageResponse = await fetch("/api/ipfs/upload", {
          method: "POST",
          body: imageFormData,
        });
        const imageResult = await imageResponse.json();
        if (!imageResult.success)
          throw new Error("Failed to upload NFT image.");
        nftImageCID = imageResult.data.cid;
        toast.success("NFT image uploaded!");
      }

      const uploadedFileCIDs: Array<{
        cid: string;
        name: string;
        type: string;
      }> = [];
      if (selectedFiles.length > 0) {
        toast.info(`Uploading ${selectedFiles.length} additional files...`);
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
            console.warn(`Failed to upload ${fileData.name}, skipping.`);
          }
        }
        toast.success("Additional files uploaded!");
      }

      toast.info("Creating final metadata...");
      const metadataResponse = await fetch("/api/nft/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            name: personalData.name,
            description: personalData.description,
            image: `ipfs://${nftImageCID}`,
            attributes: [
              { trait_type: "Type", value: "Omni-Soul" },
              { trait_type: "Files Uploaded", value: uploadedFileCIDs.length },
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
            personalData: personalData,
            uploadedFiles: uploadedFileCIDs,
          },
        }),
      });
      const metadataResult = await metadataResponse.json();
      if (!metadataResult.success)
        throw new Error(
          metadataResult.error?.message || "Failed to create metadata"
        );
      const finalTokenURI = metadataResult.tokenURI;
      setCreatedTokenURI(finalTokenURI);
      toast.success("Metadata created successfully!");

      await saveNFTToDatabase(tokenId, txHash, finalTokenURI);
      toast.success("NFT record saved to database!");

      // --- CRITICAL CHANGE: Link Token ID to Embeddings ---
      if (selectedFiles.length > 0) {
        toast.info("Processing persona files for AI...");
        try {
          const formData = new FormData();
          // This is the key step: sending the tokenId with the files.
          formData.append("tokenId", tokenId);
          selectedFiles.forEach((fileData) => {
            formData.append("files", fileData.file, fileData.name);
          });

          const embeddingsResponse = await fetch("/api/ai/embeddings", {
            method: "POST",
            body: formData,
          });

          const embeddingsResult = await embeddingsResponse.json();
          if (embeddingsResult.success) {
            toast.success(
              `AI processing complete: ${
                embeddingsResult.newFilesProcessed || 0
              } new documents stored.`
            );
          } else {
            toast.warning(
              `Could not process files for AI: ${embeddingsResult.error}`
            );
          }
        } catch (err) {
          console.error("Error during embeddings processing:", err);
          toast.error("An error occurred while processing persona files.");
        }
      }

      setIsFullyComplete(true);
      toast.success(`OmniSoul fully created! Token ID: ${tokenId}`);
    } catch (error) {
      toast.error(
        `Post-processing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsPostProcessing(false);
    }
  };

  useEffect(() => {
    if (isConfirmed && receipt && !mintedTokenId) {
      const extractedTokenId = extractTokenIdFromReceipt(receipt);
      if (extractedTokenId) {
        setMintedTokenId(extractedTokenId);
        setIsProcessing(false);
        handlePostTransactionProcessing(
          extractedTokenId,
          (receipt as any).transactionHash
        );
      } else {
        toast.error("Failed to extract token ID from transaction.");
        setIsProcessing(false);
      }
    }
  }, [isConfirmed, receipt, mintedTokenId]);

  const saveNFTToDatabase = async (
    tokenId: string,
    txHash: string,
    finalTokenURI: string
  ) => {
    try {
      const response = await fetch("/api/nft/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId,
          transactionHash: txHash,
          tokenURI: finalTokenURI,
          walletAddress: address,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        // Throw an error to be caught by the main handler
        throw new Error(result.error || "Failed to save NFT to database.");
      }
    } catch (e) {
      console.error("Error in saveNFTToDatabase:", e);
      // Re-throw the error to ensure the main handler catches it
      throw e;
    }
  };

  useEffect(() => {
    if (isFullyComplete && mintedTokenId) {
      setTimeout(() => {
        router.push(`/persona/${mintedTokenId}`);
      }, 2000);
    }
  }, [isFullyComplete, mintedTokenId, router]);

  const addInterest = () => {
    if (newInterest.trim()) {
      setPersonalData((p) => ({
        ...p,
        interests: [...p.interests, newInterest.trim()],
      }));
      setNewInterest("");
    }
  };
  const removeInterest = (index: number) => {
    setPersonalData((p) => ({
      ...p,
      interests: p.interests.filter((_, i) => i !== index),
    }));
  };
  const addGoal = () => {
    if (newGoal.trim()) {
      setPersonalData((p) => ({ ...p, goals: [...p.goals, newGoal.trim()] }));
      setNewGoal("");
    }
  };
  const removeGoal = (index: number) => {
    setPersonalData((p) => ({
      ...p,
      goals: p.goals.filter((_, i) => i !== index),
    }));
  };
  const addTrait = () => {
    if (newTrait.trim()) {
      setPersonalData((p) => ({
        ...p,
        personality_traits: [...p.personality_traits, newTrait.trim()],
      }));
      setNewTrait("");
    }
  };
  const removeTrait = (index: number) => {
    setPersonalData((p) => ({
      ...p,
      personality_traits: p.personality_traits.filter((_, i) => i !== index),
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
                            isFullyComplete
                              ? "bg-gradient-to-r from-neon-cyan to-neon-magenta text-background neon-glow-cyan"
                              : step.number === 1
                              ? "bg-gradient-to-r from-neon-cyan to-neon-magenta text-background neon-glow-cyan"
                              : "bg-card border-2 border-border text-muted-foreground"
                          }
                        `}
                      >
                        {isFullyComplete && step.number === 1 ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : isFullyComplete && step.number === 2 ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          step.number
                        )}
                      </div>
                      <div className="min-w-[160px] max-w-[220px]">
                        <p
                          className={`font-medium ${
                            isFullyComplete || step.number === 1
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
              {/* Single Form - Only show if not fully complete */}
              {!isFullyComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* NFT Image Upload Section */}
                  <Card className="glass p-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-neon-cyan mb-2">
                          Upload NFT Image
                        </h3>
                        <p className="text-muted-foreground">
                          Choose an image that will represent your NFT
                        </p>
                      </div>

                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-neon-cyan/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleNftImageSelected(file);
                          }}
                          className="hidden"
                          id="nft-image-upload"
                          disabled={isProcessing || isPostProcessing}
                        />
                        <label
                          htmlFor="nft-image-upload"
                          className="cursor-pointer"
                        >
                          <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-neon-cyan to-neon-magenta rounded-full flex items-center justify-center">
                              <Upload className="h-8 w-8 text-background" />
                            </div>
                            <div>
                              <p className="text-lg font-medium">
                                Drop image here or click to upload
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Supports PNG, JPG, GIF, WebP
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>

                      {nftImage && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-magenta rounded-full flex items-center justify-center">
                                <FileText className="h-5 w-5 text-background" />
                              </div>
                              <div>
                                <p className="font-medium">{nftImage.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {(nftImage.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setNftImage(null)}
                              disabled={isProcessing || isPostProcessing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Additional Files Upload Section */}
                  <Card className="glass p-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-neon-cyan mb-2">
                          Upload Additional Files (Optional)
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
                          disabled={isProcessing || isPostProcessing}
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
                                disabled={isProcessing || isPostProcessing}
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
                              disabled={isProcessing || isPostProcessing}
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
                              disabled={isProcessing || isPostProcessing}
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
                            disabled={isProcessing || isPostProcessing}
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
                            disabled={isProcessing || isPostProcessing}
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
                              disabled={isProcessing || isPostProcessing}
                            />
                            <Button
                              type="button"
                              onClick={addInterest}
                              size="sm"
                              disabled={isProcessing || isPostProcessing}
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
                                <button
                                  onClick={() => removeInterest(index)}
                                  disabled={isProcessing || isPostProcessing}
                                >
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
                              disabled={isProcessing || isPostProcessing}
                            />
                            <Button
                              type="button"
                              onClick={addGoal}
                              size="sm"
                              disabled={isProcessing || isPostProcessing}
                            >
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
                                <button
                                  onClick={() => removeGoal(index)}
                                  disabled={isProcessing || isPostProcessing}
                                >
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
                              disabled={isProcessing || isPostProcessing}
                            />
                            <Button
                              type="button"
                              onClick={addTrait}
                              size="sm"
                              disabled={isProcessing || isPostProcessing}
                            >
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
                                  <button
                                    onClick={() => removeTrait(index)}
                                    disabled={isProcessing || isPostProcessing}
                                  >
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
                        {mintedTokenId && isPostProcessing
                          ? "Transaction confirmed! Setting up your files and metadata..."
                          : "This will mint your NFT first, then setup your files and metadata"}
                      </p>

                      <Button
                        onClick={handleCreateOmniSoul}
                        disabled={
                          isProcessing ||
                          isPending ||
                          isConfirming ||
                          isPostProcessing ||
                          !personalData.name ||
                          !personalData.description ||
                          !nftImage
                        }
                        className="w-full max-w-md bg-gradient-to-r from-neon-cyan to-neon-magenta hover:opacity-90 text-background font-bold py-3"
                        size="lg"
                      >
                        {isPostProcessing ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Setting up files & metadata...
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

              {/* Success State - Only show when everything is complete */}
              {isFullyComplete && mintedTokenId && (
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
                          ZetaChain! All files have been uploaded and metadata
                          has been created.
                        </p>
                        <div className="space-y-2">
                          <Badge variant="secondary" className="text-sm">
                            Transaction: {hash?.slice(0, 10)}...
                            {hash?.slice(-8)}
                          </Badge>
                          <br />
                          <Badge variant="outline" className="text-sm">
                            Token ID: {mintedTokenId}
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
