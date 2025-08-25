
import {


  Link,

} from "react-router-dom";
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { isWalletConnected } from '../utils';

function Navbar() {

  const [connected, toggleConnect] = useState(false);
  const location = useLocation();
  const [currAddress, updateAddress] = useState('0x');

  async function getAddress() {
    try {
      const ethers = require("ethers");

      // Check if ethereum is available
      if (!window.ethereum) {
        console.log("No ethereum provider found");
        return;
      }

      // Check if connected
      if (!isWalletConnected()) {
        console.log("Wallet not connected");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Check if signer has an account
      try {
        const addr = await signer.getAddress();
        updateAddress(addr);
        console.log("Address retrieved:", addr);
      } catch (error) {
        console.log("Error getting address:", error.message);
        updateAddress('0x');
      }
    } catch (error) {
      console.error("Error in getAddress:", error);
      updateAddress('0x');
    }
  }

  function updateButton() {
    const ethereumButton = document.querySelector('.enableEthereumButton');
    if (ethereumButton) {
      ethereumButton.textContent = "Connected";
      ethereumButton.classList.remove("hover:bg-blue-70");
      ethereumButton.classList.remove("bg-blue-500");
      ethereumButton.classList.add("hover:bg-green-70");
      ethereumButton.classList.add("bg-green-500");
    }
  }

  async function connectWebsite() {
    try {
      // Check if ethereum is available
      if (!window.ethereum) {
        alert("Please install MetaMask or another Ethereum wallet");
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      if (accounts.length === 0) {
        alert("No accounts found");
        return;
      }

      // Check and switch to correct network (Hardhat local network)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0x539') // 0x539 = 1337 in hex (Hardhat default)
      {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x539' }],
          });
        } catch (switchError) {
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x539',
                  chainName: 'Hardhat Local',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['http://127.0.0.1:8545'],
                  blockExplorerUrls: []
                }]
              });
            } catch (addError) {
              console.error('Error adding network:', addError);
              alert('Please add the Hardhat network to MetaMask manually');
              return;
            }
          } else {
            console.error('Error switching network:', switchError);
            alert('Please switch to the Hardhat network manually');
            return;
          }
        }
      }

      // Update UI and get address
      updateButton();
      toggleConnect(true);
      await getAddress();

      console.log("Wallet connected successfully");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet: " + error.message);
    }
  }

  useEffect(() => {
    if (window.ethereum === undefined)
      return;

    // Check if already connected
    if (isWalletConnected()) {
      console.log("Wallet already connected");
      getAddress();
      toggleConnect(true);
      updateButton();
    }

    // Listen for account changes
    window.ethereum.on('accountsChanged', function (accounts) {
      if (accounts.length === 0) {
        // User disconnected
        toggleConnect(false);
        updateAddress('0x');
        console.log("Wallet disconnected");
      } else {
        // Account changed
        getAddress();
        console.log("Account changed");
      }
    });

    // Listen for chain changes
    window.ethereum.on('chainChanged', function (chainId) {
      console.log("Chain changed to:", chainId);
      if (chainId === '0x539') {
        getAddress();
      } else {
        updateAddress('0x');
        toggleConnect(false);
      }
    });

    // Cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  return (
    <div className="">
      <nav className="w-screen">
        <ul className='flex items-end justify-between py-3 bg-transparent text-white pr-5'>
          <li className='flex items-end ml-5 pb-2'>
            <Link to="/">
              <div className='inline-block font-bold text-xl ml-2'>
                Digital Will Management
              </div>
            </Link>
          </li>
          <li className='w-2/6'>
            <ul className='lg:flex justify-between font-bold mr-10 text-lg'>
              {location.pathname === "/" ?
                <li className='border-b-2 hover:pb-0 p-2'>
                  <Link to="/marketplace">Claim Your Inheritence</Link>
                </li>
                :
                <li className='hover:border-b-2 hover:pb-0 p-2'>
                  <Link to="/marketplace">Claim Your Inheritence</Link>
                </li>
              }
              {location.pathname === "/sellNFT" ?
                <li className='border-b-2 hover:pb-0 p-2'>
                  <Link to="/sellNFT">Create New Will</Link>
                </li>
                :
                <li className='hover:border-b-2 hover:pb-0 p-2'>
                  <Link to="/sellNFT">Create New Will</Link>
                </li>
              }
              {location.pathname === "/profile" ?
                <li className='border-b-2 hover:pb-0 p-2'>
                  <Link to="/profile">Profile</Link>
                </li>
                :
                <li className='hover:border-b-2 hover:pb-0 p-2'>
                  <Link to="/profile">Profile</Link>
                </li>
              }
              <li>
                <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={connectWebsite}>{connected ? "Connected" : "Connect Wallet"}</button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
      <div className='text-white text-bold text-right mr-10 text-sm'>
        {currAddress !== "0x" ? "Connected to" : "Not Connected. Please login to view NFTs"} {currAddress !== "0x" ? (currAddress.substring(0, 15) + '...') : ""}
      </div>
    </div>
  );
}

export default Navbar;