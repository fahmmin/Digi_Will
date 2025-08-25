export const GetIpfsUrlFromPinata = (pinataUrl) => {
    var IPFSUrl = pinataUrl.split("/");
    const lastIndex = IPFSUrl.length;
    IPFSUrl = "https://ipfs.io/ipfs/" + IPFSUrl[lastIndex - 1];
    return IPFSUrl;
};

// Utility function to check if wallet is connected and ready
export const isWalletConnected = () => {
    return window.ethereum && window.ethereum.isConnected();
};

// Utility function to get provider and signer with error handling
export const getProviderAndSigner = async () => {
    try {
        if (!isWalletConnected()) {
            throw new Error("Wallet not connected");
        }

        const ethers = require("ethers");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // Verify signer has an account
        await signer.getAddress();

        return { provider, signer };
    } catch (error) {
        console.error("Error getting provider and signer:", error);
        throw error;
    }
};

// Utility function to check if we're on the correct network
export const checkNetwork = async () => {
    try {
        if (!window.ethereum) {
            return false;
        }

        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        return chainId === '0x539'; // Hardhat local network (1337)
    } catch (error) {
        console.error("Error checking network:", error);
        return false;
    }
};