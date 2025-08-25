import Navbar from "./Navbar";
import { useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import { GetIpfsUrlFromPinata } from "../utils";
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function NFTPage(props) {

    const [data, updateData] = useState({});
    const [dataFetched, updateDataFetched] = useState(false);
    const [message, updateMessage] = useState("");
    const [currAddress, updateCurrAddress] = useState("0x");
    const [isBeneficiary, setIsBeneficiary] = useState(false);

    async function checkBeneficiaryStatus(tokenId, address) {
        try {
            const q = query(collection(db, "willBeneficiaries"), where("tokenId", "==", tokenId));
            const querySnapshot = await getDocs(q);

            let isBeneficiaryFound = false;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const beneficiaries = data.beneficiaries || [];
                if (beneficiaries.some(b => b.address.toLowerCase() === address.toLowerCase())) {
                    isBeneficiaryFound = true;
                }
            });

            setIsBeneficiary(isBeneficiaryFound);
        } catch (error) {
            console.error("Error checking beneficiary status:", error);
            setIsBeneficiary(false);
        }
    }

    async function getNFTData(tokenId) {
        try {
            const ethers = require("ethers");

            // Check if ethereum is available and connected
            if (!window.ethereum || !window.ethereum.isConnected()) {
                console.log("Wallet not connected");
                return;
            }

            //After adding your Hardhat network to your metamask, this code will get providers and signers
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Check if signer has an account
            let addr;
            try {
                addr = await signer.getAddress();
            } catch (error) {
                console.log("Error getting address:", error.message);
                return;
            }

            //Pull the deployed contract instance
            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)
            //create an NFT Token
            var tokenURI = await contract.tokenURI(tokenId);
            const listedToken = await contract.getListedTokenForId(tokenId);
            tokenURI = GetIpfsUrlFromPinata(tokenURI);
            let meta = await axios.get(tokenURI);
            meta = meta.data;
            console.log(listedToken);

            let item = {
                price: meta.price,
                tokenId: tokenId,
                seller: listedToken.seller,
                owner: listedToken.owner,
                image: meta.image,
                name: meta.name,
                description: meta.description,
            }
            console.log(item);
            updateData(item);
            updateDataFetched(true);
            console.log("address", addr)
            updateCurrAddress(addr);
            await checkBeneficiaryStatus(tokenId, addr);
        } catch (error) {
            console.error("Error in getNFTData:", error);
            updateDataFetched(true);
            updateCurrAddress("0x");
        }
    }

    async function buyNFT(tokenId) {
        try {
            const ethers = require("ethers");
            //After adding your Hardhat network to your metamask, this code will get providers and signers
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            //Pull the deployed contract instance
            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
            const salePrice = ethers.utils.parseUnits(data.price, 'ether')
            updateMessage("Claiming the Will... Please Wait (Upto 5 mins)")
            //run the executeSale function
            let transaction = await contract.executeSale(tokenId, { value: salePrice });
            await transaction.wait();

            alert('You successfully claimed the Will!');
            updateMessage("");
        }
        catch (e) {
            alert("Upload Error" + e)
        }
    }

    const params = useParams();
    const tokenId = params.tokenId;
    if (!dataFetched)
        getNFTData(tokenId);
    if (typeof data.image == "string")
        data.image = GetIpfsUrlFromPinata(data.image);

    return (
        <div style={{ "min-height": "100vh" }}>
            <Navbar></Navbar>
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-2/5" />
                <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">
                    <div>
                        Name: {data.name}
                    </div>
                    <div>
                        Description: {data.description}
                    </div>
                    {/* <div>
                        Price: <span className="">{data.price + " ETH"}</span>
                    </div> */}
                    <div>
                        Owner: <span className="text-sm">{data.owner}</span>
                    </div>
                    <div>
                        Seller: <span className="text-sm">{data.seller}</span>
                    </div>
                    <div>
                        {currAddress !== data.owner && currAddress !== data.seller ? (
                            isBeneficiary ? (
                                <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId)}>
                                    Claim the Will
                                </button>
                            ) : (
                                <div className="text-red-500">You are not a beneficiary of this Will</div>
                            )
                        ) : (
                            <div className="text-emerald-700">You are the owner of this NFT</div>
                        )}

                        <div className="text-green text-center mt-3">{message}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
