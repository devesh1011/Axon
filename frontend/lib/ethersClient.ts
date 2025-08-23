import { ethers } from "ethers"
import { zetaChainAthens } from "./chains"

// Server-side ethers client for reading contract data
export function getEthersProvider() {
  const rpcUrl = process.env.NEXT_PUBLIC_ZETA_RPC_URL || zetaChainAthens.rpcUrls.default.http[0]
  return new ethers.JsonRpcProvider(rpcUrl)
}

export function getOmniSoulContract() {
  const provider = getEthersProvider()
  const contractAddress = process.env.NEXT_PUBLIC_OMNISOUL_ADDRESS

  if (!contractAddress) {
    throw new Error("NEXT_PUBLIC_OMNISOUL_ADDRESS environment variable is required")
  }

  // Import ABI dynamically to avoid bundling issues
  const omniSoulAbi = require("@/contracts/omnisoul.abi.json")

  return new ethers.Contract(contractAddress, omniSoulAbi, provider)
}
