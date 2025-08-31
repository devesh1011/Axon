"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ky from "ky";

interface MetadataFormProps {
  uploadedFiles: { cid: string; name: string; type: string }[];
  onMetadataCreated?: (cid: string) => void;
}

interface Attribute {
  trait_type: string;
  value: string;
}

export function MetadataForm({
  uploadedFiles,
  onMetadataCreated,
}: MetadataFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newAttribute, setNewAttribute] = useState({
    trait_type: "",
    value: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  const addAttribute = () => {
    if (newAttribute.trait_type && newAttribute.value) {
      setAttributes((prev) => [...prev, newAttribute]);
      setNewAttribute({ trait_type: "", value: "" });
    }
  };

  const removeAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const createMetadata = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsCreating(true);

    try {
      const metadata = {
        name: name.trim(),
        description: description.trim(),
        image: `/placeholder.svg?height=400&width=400&query=cyberpunk digital persona avatar neon`,
        personaCid: uploadedFiles.find((f) => f.type.includes("text"))?.cid,
        files: uploadedFiles.map((f) => ({
          cid: f.cid,
          name: f.name,
          type: f.type,
        })),
        attributes:
          attributes.length > 0
            ? attributes
            : [
                { trait_type: "Type", value: "Digital Persona" },
                { trait_type: "Chain", value: "ZetaChain" },
                { trait_type: "Files", value: uploadedFiles.length.toString() },
              ],
        external_url: `${window.location.origin}/persona/`,
        created_at: new Date().toISOString(),
      };

      const response = await ky
        .post("/api/ipfs/pin-json", {
          json: {
            data: metadata,
            pinName: `Axon-metadata-${name.replace(/\s+/g, "-").toLowerCase()}`,
          },
        })
        .json<{ success: boolean; data?: { cid: string }; error?: string }>();

      if (response.success && response.data) {
        toast.success("Metadata created and uploaded to IPFS!");
        onMetadataCreated?.(response.data.cid);
      } else {
        throw new Error(response.error || "Failed to create metadata");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create metadata";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="glass p-6">
      <div className="space-y-6">
        <div>
          <Label className="text-lg font-semibold text-neon-magenta">
            Persona Metadata
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Define your digital persona's identity and attributes
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Digital Persona"
              className="mt-1"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your digital persona..."
              className="mt-1 min-h-[100px]"
              maxLength={500}
            />
          </div>

          {/* Uploaded Files Summary */}
          {uploadedFiles.length > 0 && (
            <div>
              <Label>Uploaded Files ({uploadedFiles.length})</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {file.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Attributes */}
          <div>
            <Label>Attributes</Label>
            <div className="mt-2 space-y-3">
              {attributes.map((attr, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-2 p-2 bg-card/50 rounded border"
                >
                  <span className="text-sm font-medium text-neon-cyan">
                    {attr.trait_type}:
                  </span>
                  <span className="text-sm">{attr.value}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttribute(index)}
                    className="ml-auto h-6 w-6 p-0 hover:bg-destructive/20"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
              ))}

              <div className="flex space-x-2">
                <Input
                  placeholder="Trait type"
                  value={newAttribute.trait_type}
                  onChange={(e) =>
                    setNewAttribute((prev) => ({
                      ...prev,
                      trait_type: e.target.value,
                    }))
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="Value"
                  value={newAttribute.value}
                  onChange={(e) =>
                    setNewAttribute((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addAttribute}
                  disabled={!newAttribute.trait_type || !newAttribute.value}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={createMetadata}
          disabled={isCreating || !name.trim()}
          className="w-full neon-glow-magenta"
          size="lg"
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
              Creating Metadata...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Create Metadata
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
