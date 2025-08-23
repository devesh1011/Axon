// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title OmniSoul
 * @dev Manages ownership and metadata of Omni-Soul NFTs on ZetaChain
 * Features cross-chain asset linking and decentralized metadata storage
 */
contract OmniSoul is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Mapping from token ID to token URI (IPFS CID)
    mapping(uint256 => string) private _tokenURIs;
    
    // Structure to represent cross-chain assets
     struct CrossChainAsset {
        string chainName;
        address assetAddress;
        uint256 tokenId;
        string metadata; // Additional metadata or CID
    }
    
    // Mapping from Omni-Soul token ID to array of linked cross-chain assets
    mapping(uint256 => CrossChainAsset[]) public linkedAssets;
    
    // Events
    event OmniSoulMinted(address indexed owner, uint256 indexed tokenId, string tokenURI);
    event TokenURIUpdated(uint256 indexed tokenId, string newTokenURI);
    event CrossChainAssetLinked(uint256 indexed tokenId, string chainName, address assetAddress, uint256 assetId);
    event CrossChainAssetUnlinked(uint256 indexed tokenId, uint256 assetIndex);
    
    constructor() ERC721("OmniSoul", "OMNI") {}
    
    /**
     * @dev Mints a new Omni-Soul NFT
     * @param owner Address that will own the NFT
     * @param tokenURI IPFS CID containing the metadata
     * @return The newly minted token ID
     */
    function mintOmniSoul(address owner, string memory tokenURI) 
        public 
        onlyOwner 
        returns (uint256) 
    {
        require(owner != address(0), "OmniSoul: Cannot mint to zero address");
        require(bytes(tokenURI).length > 0, "OmniSoul: Token URI cannot be empty");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(owner, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        emit OmniSoulMinted(owner, tokenId, tokenURI);
        return tokenId;
    }
    
    /**
     * @dev Updates the token URI for an existing token
     * @param tokenId The token ID to update
     * @param tokenURI New IPFS CID for the metadata
     */
    function setTokenURI(uint256 tokenId, string memory tokenURI) 
        public 
        onlyOwner 
    {
        require(_exists(tokenId), "OmniSoul: Token does not exist");
        require(bytes(tokenURI).length > 0, "OmniSoul: Token URI cannot be empty");
        
        _setTokenURI(tokenId, tokenURI);
        emit TokenURIUpdated(tokenId, tokenURI);
    }
    
    /**
     * @dev Gets the token URI for a given token ID
     * @param tokenId The token ID to query
     * @return The IPFS CID containing the metadata
     */
    function getTokenURI(uint256 tokenId) 
        public 
        view 
        returns (string memory) 
    {
        require(_exists(tokenId), "OmniSoul: Token does not exist");
        return tokenURI(tokenId);
    }
    
    /**
     * @dev Links a cross-chain asset to an Omni-Soul NFT
     * @param tokenId The Omni-Soul token ID
     * @param chainName Name of the external chain
     * @param assetAddress Contract address on the external chain
     * @param assetId Token ID on the external chain
     * @param metadata Additional metadata or CID for the asset
     */
    function linkCrossChainAsset(
        uint256 tokenId,
        string memory chainName,
        address assetAddress,
        uint256 assetId,
        string memory metadata
    ) public onlyOwner {
        require(_exists(tokenId), "OmniSoul: Token does not exist");
        require(bytes(chainName).length > 0, "OmniSoul: Chain name cannot be empty");
        require(assetAddress != address(0), "OmniSoul: Asset address cannot be zero");
        
        CrossChainAsset memory newAsset = CrossChainAsset({
            chainName: chainName,
            assetAddress: assetAddress,
            tokenId: assetId,
            metadata: metadata
        });
        
        linkedAssets[tokenId].push(newAsset);
        
        emit CrossChainAssetLinked(tokenId, chainName, assetAddress, assetId);
    }
    
    /**
     * @dev Unlinks a cross-chain asset from an Omni-Soul NFT
     * @param tokenId The Omni-Soul token ID
     * @param assetIndex Index of the asset in the linkedAssets array
     */
    function unlinkCrossChainAsset(uint256 tokenId, uint256 assetIndex) 
        public 
        onlyOwner 
    {
        require(_exists(tokenId), "OmniSoul: Token does not exist");
        require(assetIndex < linkedAssets[tokenId].length, "OmniSoul: Invalid asset index");
        
        // Move the last element to the deleted spot and remove the last element
        linkedAssets[tokenId][assetIndex] = linkedAssets[tokenId][linkedAssets[tokenId].length - 1];
        linkedAssets[tokenId].pop();
        
        emit CrossChainAssetUnlinked(tokenId, assetIndex);
    }
    
    /**
     * @dev Gets all linked assets for a given token
     * @param tokenId The token ID to query
     * @return Array of linked cross-chain assets
     */
    function getLinkedAssets(uint256 tokenId) 
        public 
        view 
        returns (CrossChainAsset[] memory) 
    {
        require(_exists(tokenId), "OmniSoul: Token does not exist");
        return linkedAssets[tokenId];
    }
    
    /**
     * @dev Gets the total number of minted tokens
     * @return The current token count
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @dev Gets the next token ID that will be minted
     * @return The next token ID
     */
    function getNextTokenId() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
        // Clean up linked assets when burning
        delete linkedAssets[tokenId];
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
