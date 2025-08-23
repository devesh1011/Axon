import { z } from "zod"

// IPFS schemas
export const PinFileSchema = z.object({
  pinName: z.string().optional(),
})

export const PinJsonSchema = z.object({
  data: z.record(z.any()),
  pinName: z.string().optional(),
})

// OmniSoul schemas
export const CreateOmniSoulSchema = z.object({
  owner: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  metadata: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500),
    personaCid: z.string().optional(),
    files: z.array(z.string()).optional(),
    attributes: z
      .array(
        z.object({
          trait_type: z.string(),
          value: z.union([z.string(), z.number()]),
        }),
      )
      .optional(),
  }),
})

// Verification schemas
export const VerifyEvmSchema = z.object({
  chain: z.enum(["ethereum", "polygon", "bsc", "arbitrum", "optimism"]),
  rpcUrl: z.string().url().optional(),
  nftContract: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
  tokenId: z.union([z.string(), z.number()]),
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
})

export const VerifySolanaSchema = z.object({
  rpcUrl: z.string().url().optional(),
  mint: z.string().min(32).max(44),
  wallet: z.string().min(32).max(44),
})

// AI schemas
export const ChatSchema = z.object({
  tokenId: z.number().int().positive(),
  question: z.string().min(1).max(1000),
})

// Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
})
