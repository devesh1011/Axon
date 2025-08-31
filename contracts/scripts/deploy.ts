import hre from "hardhat";
const { ethers } = hre;

interface DeploymentInfo {
  network: string;
  contractAddress: string;
  deployerAddress: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
}

async function main(): Promise<void> {
  console.log("Deploying OmniSoul contract to ZetaChain...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Check balance (Ethers v6 syntax)
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ZETA");

  if (balance < ethers.parseEther("0.1")) {
    // Simplified comparison
    throw new Error(
      "Insufficient balance for deployment. Need at least 0.1 ZETA"
    );
  }

  // Deploy OmniSoul contract
  console.log("🚀 Starting contract deployment...");
  const OmniSoul = await ethers.getContractFactory("OmniSoul");

  // Deploy with explicit gas settings
  const omniSoul = await OmniSoul.deploy({
    gasLimit: 5000000,
    gasPrice: ethers.parseUnits("50", "gwei"),
  });

  // Ethers v6 automatically waits for the transaction to be mined before returning
  // The deployTransaction promise resolves when the transaction is sent
  // The omniSoul.waitForDeployment() promise resolves when the contract is deployed
  await omniSoul.waitForDeployment();

  const deployTx = omniSoul.deploymentTransaction();

  console.log("✅ OmniSoul contract deployed successfully!");
  console.log("📍 Contract address:", await omniSoul.getAddress());
  console.log("🔗 Transaction hash:", deployTx.hash);

  // Wait for a few confirmations
  console.log("⏳ Waiting for confirmations...");
  await deployTx.wait(2);

  console.log("✅ Contract confirmed!");

  // Verify deployment by calling a view function
  try {
    const name = await omniSoul.name();
    const symbol = await omniSoul.symbol();
    const totalSupply = await omniSoul.totalSupply();

    console.log("📊 Contract details:");
    console.log("  Name:", name);
    console.log("  Symbol:", symbol);
    console.log("  Total Supply:", totalSupply.toString());
  } catch (error: any) {
    console.log("⚠️  Could not verify contract details:", error.message);
  }

  // Save deployment info
  const deploymentInfo: DeploymentInfo = {
    network: "zetachain_testnet",
    contractAddress: await omniSoul.getAddress(),
    deployerAddress: deployer.address,
    transactionHash: deployTx.hash,
    blockNumber: deployTx.blockNumber || 0,
    timestamp: new Date().toISOString(),
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n💡 Next steps:");
  console.log("1. Update your .env file with the contract address:");
  console.log(`   CONTRACT_ADDRESS=${await omniSoul.getAddress()}`);
  console.log("2. Start the backend server");
  console.log("3. Test the contract interaction");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
