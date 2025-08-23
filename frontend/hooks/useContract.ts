import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { zetaChainAthens } from "@/lib/chains";
import omniSoulAbi from "@/contracts/omnisoul.abi.json";

const contractAddress = process.env
  .NEXT_PUBLIC_OMNISOUL_ADDRESS as `0x${string}`;

export function useOmniSoulContract() {
  console.log("Contract address:", contractAddress);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const mintOmniSoul = (to: `0x${string}`, tokenURI: string) => {
    console.log("Minting to address:", to);
    console.log("Token URI:", tokenURI);

    if (!to || to === "0x0000000000000000000000000000000000000000") {
      throw new Error("Invalid recipient address");
    }

    writeContract({
      address: contractAddress,
      abi: omniSoulAbi,
      functionName: "mintOmniSoul",
      args: [to, tokenURI],
      chainId: zetaChainAthens.id,
    });
  };

  const setTokenURI = (tokenId: bigint, tokenURI: string) => {
    writeContract({
      address: contractAddress,
      abi: omniSoulAbi,
      functionName: "setTokenURI",
      args: [tokenId, tokenURI],
      chainId: zetaChainAthens.id,
    });
  };

  const linkCrossChainAsset = (
    tokenId: bigint,
    chainName: string,
    assetAddress: string,
    assetId: bigint
  ) => {
    writeContract({
      address: contractAddress,
      abi: omniSoulAbi,
      functionName: "linkCrossChainAsset",
      args: [tokenId, chainName, assetAddress, assetId],
      chainId: zetaChainAthens.id,
    });
  };

  return {
    mintOmniSoul,
    setTokenURI,
    linkCrossChainAsset,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    receipt,
    error,
  };
}

export function useTokenURI(tokenId: bigint) {
  return useReadContract({
    address: contractAddress,
    abi: omniSoulAbi,
    functionName: "tokenURI",
    args: [tokenId],
    chainId: zetaChainAthens.id,
  });
}

export function useTokenOwner(tokenId: bigint) {
  return useReadContract({
    address: contractAddress,
    abi: omniSoulAbi,
    functionName: "ownerOf",
    args: [tokenId],
    chainId: zetaChainAthens.id,
  });
}
