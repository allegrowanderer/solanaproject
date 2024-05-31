"use client";

import { useState, useEffect } from 'react';
import {
  Connection,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Image from 'next/image';
import Link from 'next/link';
import '@solana/wallet-adapter-react-ui/styles.css';
import './globals.css';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const { publicKey, signTransaction }: WalletContextState = useWallet();
  const [amount, setAmount] = useState('');
  const [buyNowMessage, setBuyNowMessage] = useState<string>('');
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [balance, setBalance] = useState(0);
  const [twitterUsername, setTwitterUsername] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [hasFollowed, setHasFollowed] = useState(false);
  const [hasPosted, setHasPosted] = useState(false);
  const recipient = "CY52uCB6LwdjeWPysgtqGZT3tqYvRxw5haxG6Z5HcY9E";
  const rpcEndpoint = "https://solana-mainnet.g.alchemy.com/v2/alcht_HKkPrptPNAoXPKN3jOQlKrIZ129QMa";

  useEffect(() => {
    setIsClient(true);
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const connection = new Connection(rpcEndpoint, 'confirmed');
      const pubKey = new PublicKey(recipient);
      const balance = await connection.getBalance(pubKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      setBalance(solBalance);
      setProgress((solBalance / 300) * 100);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTwitterUsername(e.target.value);
  };

  const handleUsernameSubmit = async () => {
    if (!hasFollowed || !hasPosted) {
      setSubmitMessage("Please complete the given Twitter tasks.");
      setTimeout(() => setSubmitMessage(''), 3000);
      return;
    }

    if (!twitterUsername) {
      setSubmitMessage("Please enter a Twitter username");
      setTimeout(() => setSubmitMessage(''), 3000);
      return;
    }

    if (!publicKey) {
      setSubmitMessage("Please connect your wallet first");
      setTimeout(() => setSubmitMessage(''), 3000);
      return;
    }

    const { data: existingData, error: existingError } = await supabase
      .from('twitter_usernames')
      .select('*')
      .eq('wallet_address', publicKey.toString());

    if (existingError) {
      console.error("Failed to fetch existing data:", existingError);
      setSubmitMessage("Failed to fetch existing data");
      setTimeout(() => setSubmitMessage(''), 3000);
      return;
    }

    if (existingData && existingData.length > 0) {
      setSubmitMessage("You already submitted your wallet address.");
      setTimeout(() => setSubmitMessage(''), 3000);
      return;
    }

    const { data, error } = await supabase
      .from('twitter_usernames')
      .insert([{ username: twitterUsername, wallet_address: publicKey.toString() }]);

    if (error) {
      console.error("Failed to save username:", error);
      setSubmitMessage("Failed to save username");
      setTimeout(() => setSubmitMessage(''), 3000);
    } else {
      setSubmitMessage("Username and wallet address saved successfully");
      setTimeout(() => setSubmitMessage(''), 3000);
      setTwitterUsername('');
    }
  };

  const handleClick = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      setBuyNowMessage("Please enter a valid amount");
      setTimeout(() => setBuyNowMessage(''), 3000);
      return;
    }

    let pubKey;
    try {
      pubKey = new PublicKey(recipient);
    } catch (error) {
      setBuyNowMessage("Invalid recipient public key");
      setTimeout(() => setBuyNowMessage(''), 3000);
      return;
    }

    try {
      const connection = new Connection(rpcEndpoint, 'confirmed');
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey!,
          toPubkey: pubKey,
          lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
        })
      );

      const { blockhash } = await connection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey!;

      if (signTransaction) {
        const signedTransaction = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction(signature, 'confirmed');
        setBuyNowMessage(`Transaction successful: ${signature}`);
        fetchBalance();
      } else {
        setBuyNowMessage("Please connect your wallet first.");
      }
    } catch (error: any) {
      setBuyNowMessage(`Transaction failed: ${error.message}`);
    }
    setTimeout(() => setBuyNowMessage(''), 3000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recipient).then(
      () => {
        setCopySuccess("Address copied to clipboard!");
        setTimeout(() => setCopySuccess(''), 2000);
      },
      (err) => {
        console.error("Failed to copy text: ", err);
      }
    );
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-cherryRed text-white">
      {copySuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-2 rounded z-50">
          {copySuccess}
        </div>
      )}
      {submitMessage && (
        <div className={`fixed top-4 right-4 ${submitMessage.includes("saved successfully") ? "bg-green-500" : "bg-red-500"} text-white p-2 rounded z-50`}>
          {submitMessage}
        </div>
      )}
      {buyNowMessage && (
        <div className={`fixed top-4 right-4 ${buyNowMessage.includes("successful") ? "bg-green-500" : "bg-red-500"} text-white p-2 rounded z-50`}>
          {buyNowMessage}
        </div>
      )}
      <header className="flex justify-between items-center p-2 lg:p-4 bg-[#B90000] border-b-4 border-black">
        <div className="flex items-center">
          <Link href="https://hellcatsol.com">
            <Image src="/hellcat.jpg" alt="Hellcat Logo" width={100} height={100} className="rounded-full cursor-pointer" />
          </Link>
          <h1 className="ml-4 text-3xl font-halloween text-black" style={{ fontSize: '150%' }}>HELLCAT on Solana</h1>
        </div>
        <div className="hidden lg:flex items-center space-x-12">
          <a href="#about" className="text-black font-halloween text-6xl">ABOUT</a>
          <a href="#how-to-buy" className="text-black font-halloween text-6xl">HOW TO BUY</a>
        </div>
        <div className="flex items-center space-x-4 lg:hidden">
          <button onClick={toggleMenu} className="text-black">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="https://twitter.com/HellCat_Sol">
            <Image src="/twitter.png" alt="Twitter" width={45} height={45} className="cursor-pointer" />
          </Link>
          <Link href="https://telegram.org">
            <Image src="/telegram.png" alt="Telegram" width={45} height={45} className="cursor-pointer" />
          </Link>
          <WalletMultiButton className="wallet-adapter-button bg-[#F3A351] font-halloween" />
        </div>
      </header>
      {isMenuOpen && (
        <div className="lg:hidden bg-[#B90000] text-black font-halloween flex flex-col items-center space-y-4 py-4">
          <a href="#about" className="text-6xl" onClick={toggleMenu}>ABOUT</a>
          <a href="#how-to-buy" className="text-6xl" onClick={toggleMenu}>HOW TO BUY</a>
        </div>
      )}

      <main className="flex flex-col lg:flex-row items-start justify-center flex-grow p-4 bg-cover bg-center" style={{ backgroundImage: "url('/hellcatbg.png')" }}>
        <div className="w-full max-w-md bg-[#F3A351] text-black rounded-lg shadow-md p-8 space-y-4 mt-0 lg:mt-10 border-4 border-black">
          <h2 className="text-2xl font-bold text-center font-halloween" style={{ fontSize: '300%' }}>PRESALE IS LIVE!</h2>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount in SOL"
            className="px-4 py-2 border-black border-2 rounded-md w-full bg-[#B90000] text-white"
          />
          <div className="flex justify-center">
            <button
              onClick={handleClick}
              className="px-4 py-2 bg-[#FF450B] text-white rounded-full w-2/5 font-halloween"
              style={{ fontSize: '110%' }}
            >
              BUY NOW
            </button>
          </div>
          <div className="mt-4 progress-container relative">
            <div className="h-8 w-full bg-gray-200 border-black border-4">
              <div
                className="h-full"
                style={{ width: `${progress}%`, backgroundColor: '#B90000' }}
              ></div>
              <p className="absolute inset-0 flex items-center justify-center font-halloween text-[#000000]" style={{ top: '25%' }}>RAISED OF 300 SOL GOAL</p>
            </div>
          </div>
          <p className="text-center mt-6 font-halloween">{balance} SOL RAISED</p>
          <div className="mt-4 text-center text-xs">
            <p className="font-halloween text-2xl">IF YOU HAVE PROBLEMS CONNECTING YOUR WALLET, SEND SOL TO:</p>
            <p className="font-bold bg-[#F3A351] text-[#B90000] text-xl py-1 cursor-pointer" style={{ fontSize: '110%' }} onClick={copyToClipboard}>
              CY52uCB6LwdjeWPysgtqGZT3tqYvRxw5haxG6Z5HcY9E
            </p>
            <p className="font-halloween" style={{ fontSize: '140%' }}>AND TOKENS WILL BE AIRDROPPED TO THE SENDING WALLET.</p>
            <p className="font-halloween" style={{ fontSize: '140%' }}>NB: DON’T USE A CEX TO SEND SOL. USE YOUR OWN WALLET.</p>
          </div>
        </div>

        <div className="flex flex-col items-center lg:ml-[5cm] mt-0 lg:mt-10 relative">
          <div className="w-full max-w-md bg-[#F3A351] text-black rounded-lg shadow-md p-8 space-y-4 border-4 border-black relative">
            <div className="absolute top-0 left-0 flex items-center mt-2 ml-2">
              <Image src="/airdrop.svg" alt="Airdrop" width={25} height={25} />
              <h2 className="ml-2 text-white font-halloween text-xl">AIRDROP</h2>
            </div>
            <h2 className="text-5xl font-bold text-center font-halloween mt-12" style={{ fontSize: '300%' }}>JOIN NOW</h2>
            <p className="text-center font-halloween" style={{ fontSize: '100%' }}>
              10% OF HELL’S TOTAL SUPPLY WILL BE AIRDROPPED FOR FREE TO EVENT PARTICIPANTS. TO JOIN THE AIRDROP, COMPLETE THE TWO SPECIFIED TASKS. TOKENS WILL BE SENT TO YOUR WALLET AFTER THE PRESALE CONCLUDES.
            </p>
            <div className="flex items-center justify-center space-x-2">
              <span className="font-halloween text-xl">Step 1:</span>
              <button
                onClick={() => {
                  window.open('https://twitter.com/HellCat_Sol', '_blank');
                  setHasFollowed(true);
                }}
                className="px-4 py-2 bg-[#000000] text-white rounded-full w-3/5 font-halloween"
              >
                Follow @HellCat_Sol
              </button>
            </div>
            <div className="flex items-center justify-center space-x-2 mt-4">
              <span className="font-halloween text-xl">Step 2:</span>
              <button
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent("Missed $BOME? Don't Miss $HELL!\n\nHellCat Pre-sale has started 🚀🚀🚀Whales Discover This New SOL Meme Coin!1000%x 📈📈📈\n\nYou can see the HELLCAT pre-sale being recommended on SOLSCAN.\n\nPresale Link: https://hellcatsol.com\n\nTwitter: @HellCat_Sol\n\n#Memecoin #solana #HELLCAT #Airdrop")}`, '_blank');
                  setHasPosted(true);
                }}
                className="px-4 py-2 bg-[#000000] text-white rounded-full w-3/5 font-halloween"
              >
                Post on Twitter
              </button>
            </div>
            <div className="flex items-center justify-center space-x-2 mt-4">
              <span className="font-halloween text-xl">Step 3:</span>
              <input
                type="text"
                value={twitterUsername}
                onChange={handleUsernameChange}
                placeholder="Submit your Twitter username"
                className="px-4 py-2 border-black border-2 rounded-md w-3/5 bg-[#B90000] text-white"
              />
            </div>
            <div className="flex items-center justify-center mt-2">
              <button
                onClick={handleUsernameSubmit}
                className="px-2 py-1 bg-[#000000] text-white rounded-full w-1/3 ml-4 font-halloween"
              >
                Submit
              </button>
            </div>
            <Image src="/hellcatphoto.png" alt="Hellcat Photo" width={75} height={75} className="absolute top-[-10px] right-[-10px]" />
          </div>
        </div>
      </main>

      {/* Duplicate Section */}
      <main className="flex flex-col items-center justify-center flex-grow p-4 bg-cover bg-center" style={{ backgroundImage: "url('/hellcatbg2.png')" }}>
        <div id="about" className="w-full max-w-4xl bg-[#F3A351] text-black rounded-lg shadow-md p-8 space-y-4 mt-10 border-4 border-black">
          <h2 className="text-2xl font-bold text-center font-halloween" style={{ fontSize: '200%' }}>
            WHAT IS <span className="text-[#B90000]">$HELL</span>?
          </h2>
          <p className="text-xl font-halloween">
            $HELL is the place where crypto meets chaos! Our devilish memecoin embodies the spirit of rebellion. Offering thrill-seeking investors a wild ride! HELL is a fun and joyful project aimed at bringing happiness to everyone. Join the HELL community to grow and leave your worries behind. The total supply of HELL tokens is still being determined, with 10% allocated for airdrops, 45% for presale, and 45% for liquidity pools (LP). Participate in the $HELL presale and watch your investment grow from 100 to $10 billion!
          </p>
        </div>
        <div id="how-to-buy" className="w-full max-w-4xl bg-[#F3A351] text-black rounded-lg shadow-md p-8 space-y-4 mt-10 border-4 border-black">
          <h2 className="text-2xl font-bold text-center font-halloween" style={{ fontSize: '200%' }}>
            HOW TO BUY <span className="text-[#B90000]">$HELL</span>?
          </h2>
          <p className="text-xl font-halloween">
            1. CLICK ON THE “BUY NOW” BUTTON ABOVE.<br/><br/>
            2. ENTER THE AMOUNT OF SOL TO SWAP FOR $HELL.<br/><br/>
            3. CLICK ‘BUY NOW’ AGAIN AND CONFIRM THE TRANSACTION.<br/><br/>
            * IF YOU CAN’T CONNECT YOUR WALLET, SEND SOL TO <span onClick={copyToClipboard} className="cursor-pointer text-blue-500 underline">CONTRACT ADDRESS</span>. TOKENS WILL BE AIRDROPPED TO THE SENDING WALLET.<br/><br/>
          </p>
          <p className="text-xl font-halloween text-center text-[#B90000]">
            NB: DON’T USE A CEX TO SEND SOL! USE YOUR OWN WALLET.
          </p>
        </div>
      </main>

      <footer className="p-4 bg-[#B90000] text-center">
        <p className="text-sm font-halloween">&copy; 2024 HELLCAT on Solana. All rights reserved.</p>
      </footer>
    </div>
  );
}