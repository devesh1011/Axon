// frontend/lib/ipfs.ts
export async function fetchMetadataFromIPFS(cid: string) {
  if (!cid) return null;

  try {
    const gateway =
      process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud";
    const url = `${gateway}/ipfs/${cid}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error("Error fetching metadata from IPFS:", error);
    return null;
  }
}
