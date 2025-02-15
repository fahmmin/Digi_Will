import Navbar from "./Navbar";
import { useState } from "react";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../pinata";
import Marketplace from '../Marketplace.json';
import { useLocation } from "react-router";
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

export default function SellNFT () {
    const [formParams, updateFormParams] = useState({ contractId: '', description: '' });
    const [fileURL, setFileURL] = useState(null);
    const [beneficiaries, setBeneficiaries] = useState([{ address: '', percentage: '' }]);
    const ethers = require("ethers");
    const [message, updateMessage] = useState('');
    const location = useLocation();

    const addBeneficiary = () => {
        setBeneficiaries([...beneficiaries, { address: '', percentage: '' }]);
    };

    const updateBeneficiary = (index, field, value) => {
        const newBeneficiaries = [...beneficiaries];
        newBeneficiaries[index][field] = value;
        setBeneficiaries(newBeneficiaries);
    };

    const removeBeneficiary = (index) => {
        const newBeneficiaries = beneficiaries.filter((_, i) => i !== index);
        setBeneficiaries(newBeneficiaries);
    };

    async function disableButton() {
        const listButton = document.getElementById("list-button")
        listButton.disabled = true
        listButton.style.backgroundColor = "grey";
        listButton.style.opacity = 0.3;
    }

    async function enableButton() {
        const listButton = document.getElementById("list-button")
        listButton.disabled = false
        listButton.style.backgroundColor = "#A500FF";
        listButton.style.opacity = 1;
    }

    //This function uploads the NFT image to IPFS
    async function OnChangeFile(e) {
        var file = e.target.files[0];
        //check for file extension
        try {
            //upload the file to IPFS
            disableButton();
            updateMessage("Uploading image.. please dont click anything!")
            const response = await uploadFileToIPFS(file);
            if(response.success === true) {
                enableButton();
                updateMessage("")
                console.log("Uploaded image to Pinata: ", response.pinataURL)
                setFileURL(response.pinataURL);
            }
        }
        catch(e) {
            console.log("Error during file upload", e);
        }
    }

    //This function uploads the metadata to IPFS
    async function uploadMetadataToIPFS() {
        const {contractId, description} = formParams;
        //Make sure that none of the fields are empty
        if(!contractId || !description || !fileURL)
        {
            updateMessage("Please fill all the fields!")
            return -1;
        }

        const nftJSON = {
            contractId, 
            description, 
            price: '0.001', 
            image: fileURL
        }

        try {
            //upload the metadata JSON to IPFS
            const response = await uploadJSONToIPFS(nftJSON);
            if(response.success === true){
                console.log("Uploaded JSON to Pinata: ", response)
                return response.pinataURL;
            }
        }
        catch(e) {
            console.log("error uploading JSON metadata:", e)
        }
    }

    async function saveBeneficiariesToFirebase(tokenId) {
        try {
            const docRef = await addDoc(collection(db, "willBeneficiaries"), {
                tokenId: tokenId,
                contractId: formParams.contractId,
                beneficiaries: beneficiaries,
                createdAt: new Date().toISOString()
            });
            console.log("Beneficiaries saved with ID: ", docRef.id);
        } catch (error) {
            console.error("Error saving beneficiaries: ", error);
            throw error;
        }
    }

    async function listNFT(e) {
        e.preventDefault();

        // Validate total percentage is 100
        const totalPercentage = beneficiaries.reduce((sum, b) => sum + Number(b.percentage), 0);
        if (totalPercentage !== 100) {
            updateMessage("Total percentage must equal 100%");
            return;
        }

        //Upload data to IPFS
        try {
            const metadataURL = await uploadMetadataToIPFS();
            if(metadataURL === -1)
                return;
            //After adding your Hardhat network to your metamask, this code will get providers and signers
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            disableButton();
            updateMessage("Uploading Will Contract (takes 5 mins).. please dont click anything!")

            //Pull the deployed contract instance
            let contract = new ethers.Contract(Marketplace.address, Marketplace.abi, signer)

            //Set constant price of 0.001 ETH
            const price = ethers.utils.parseUnits('0.001', 'ether')
            let listingPrice = await contract.getListPrice()
            listingPrice = listingPrice.toString()

            //actually create the NFT
            let transaction = await contract.createToken(metadataURL, price, { value: listingPrice })
            await transaction.wait()

            // Save beneficiaries to Firebase
            const tokenId = await contract.getCurrentToken();
            await saveBeneficiariesToFirebase(tokenId.toString());

            alert("Successfully created Will Contract!");
            enableButton();
            updateMessage("");
            updateFormParams({ contractId: '', description: '' });
            setBeneficiaries([{ address: '', percentage: '' }]);
            window.location.replace("/")
        }
        catch(e) {
            alert( "Upload error"+e )
        }
    }

    console.log("Working", process.env);
    return (
        <div className="">
        <Navbar></Navbar>
        <div className="flex flex-col place-items-center mt-10" id="nftForm">
            <form className="bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4">
            <h3 className="text-center font-bold text-purple-500 mb-8">Create your Will Contract</h3>
                <div className="mb-4">
                    <label className="block text-purple-500 text-sm font-bold mb-2">Will Contract ID</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                        type="text" 
                        placeholder="Enter a unique identifier for your will contract"
                        value={formParams.contractId}
                        onChange={e => updateFormParams({...formParams, contractId: e.target.value})}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-purple-500 text-sm font-bold mb-2">Beneficiaries</label>
                    {beneficiaries.map((beneficiary, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                            <input
                                className="shadow appearance-none border rounded w-2/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="text"
                                placeholder="Wallet Address"
                                value={beneficiary.address}
                                onChange={(e) => updateBeneficiary(index, 'address', e.target.value)}
                            />
                            <input
                                className="shadow appearance-none border rounded w-1/4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="number"
                                placeholder="%"
                                value={beneficiary.percentage}
                                onChange={(e) => updateBeneficiary(index, 'percentage', e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => removeBeneficiary(index)}
                                className="bg-red-500 text-white px-2 rounded"
                            >
                                X
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addBeneficiary}
                        className="bg-purple-500 text-white px-4 py-2 rounded mt-2"
                    >
                        Add Beneficiary
                    </button>
                </div>
                <div className="mb-6">
                    <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="description">Will Description</label>
                    <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" cols="40" rows="5" id="description" type="text" placeholder="Axie Infinity Collection" value={formParams.description} onChange={e => updateFormParams({...formParams, description: e.target.value})}></textarea>
                </div>
                <div>
                    <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="image">Upload The Digital Asset (&lt;500 KB)</label>
                    <input type={"file"} onChange={OnChangeFile}></input>
                </div>
                <br></br>
                <div className="text-red-500 text-center">{message}</div>
                <button onClick={listNFT} className="font-bold mt-10 w-full bg-purple-500 text-white rounded p-2 shadow-lg" id="list-button">
                    List NFT
                </button>
            </form>
        </div>
        </div>
    )
}