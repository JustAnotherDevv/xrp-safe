import React, { useState, useEffect, useContext, useCallback } from "react";
import { UserPlusIcon, CreditCard } from "@heroicons/react/24/solid";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Link,
  Routes,
} from "react-router-dom";
import { LedgerContext } from "../contexts/LedgerProvider";
import LoadingAnimation from "../components/LoadingAnimation";
import { truncateStr } from "../utils";
import {
  Client,
  getBalanceChanges,
  rippleTimeToISOTime,
  rippleTimeToUnixTime,
  Wallet,
  decode,
} from "xrpl";

function Dashboard() {
  const [userAddress, setUserAddress] = useState(null);
  const [accData, setAccData] = useState(null);
  const [accObjects, setAccObjects] = useState(null);
  const [namespaceData, setNamespaceData] = useState(null);
  const [openPayloadUrl, setOpenPayloadUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { xummInstance, account, chainId, connected, connect, disconnect } =
    useContext(LedgerContext);
  const [multiSigAddres, setMultiSigAddres] = useState(
    "rgAJ7dkxRef9QDVeGetAG5U1G8XrDtFt4"
  );
  const [multiSigTxs, setmultiSigTxs] = useState(null);
  const [accNfts, setAccNfts] = useState([]);

  useEffect(() => {
    (async () => {
      // if (!account) return;
      const notary_wallet = await Wallet.fromSeed(
        "snphgBKX1E4R2rcXZzWzjTUHEW9vJ" //"spuxuNyv4eq9DqUzgt9ESLrRXfi8k"
      );
      console.log(notary_wallet);
      setUserAddress(notary_wallet);
      await getBatchAccountData();
    })();
  }, [xummInstance]);

  async function getBatchNFTokens(address) {
    try {
      const client = new Client("wss://hooks-testnet-v3.xrpl-labs.com");
      await client.connect();
      let nfts = await client.request({
        method: "account_nfts",
        account: address,
      });
      let accountNfts = nfts.result.account_nfts;
      //console.log("Found ", accountNfts.length, " NFTs in account ", address);
      while (true) {
        if (nfts["result"]["marker"] === undefined) {
          break;
        } else {
          nfts = await client.request({
            method: "account_nfts",
            account: address,
            marker: nfts["result"]["marker"],
          });
          accountNfts = accountNfts.concat(nfts.result.account_nfts);
        }
      }
      client.disconnect();
      return accountNfts;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  async function getBatchAccountTx(address) {
    try {
      if (!address || address.length == 0)
        throw new Error(
          `You need to provide proper XRPL address to use this function`
        );
      const client = new Client("wss://hooks-testnet-v3.xrpl-labs.com");
      await client.connect();
      let txs = await client.request({
        method: "account_tx",
        account: address,
      });
      let accountTxs = txs.result.transactions;
      for (;;) {
        console.log(accountTxs.length);
        if (txs["result"]["marker"] === undefined) {
          break;
        } else {
          txs = await client.request({
            method: "account_tx",
            account: address,
            marker: txs["result"]["marker"],
          });
          accountTxs = accountTxs.concat(txs.result.transactions);
        }
      }
      client.disconnect();
      console.log(accountTxs);
      return accountTxs;
    } catch (error) {
      console.error(error);
      // return error;
      return [];
    }
  }

  async function getBatchAccountData() {
    setIsLoading(true);
    try {
      const client = new Client("wss://hooks-testnet-v3.xrpl-labs.com");
      await client.connect();
      let account_data = await client.request({
        command: "account_info",
        account: userAddress.classicAddress,
      });
      console.log(account_data);
      let account_objects = await client.request({
        command: "account_objects",
        account: userAddress.classicAddress,
      });
      const namespace_data = await client.request({
        command: "account_namespace",
        account: userAddress.classicAddress,
        namespace_id:
          "A0800997EB2FED3F3B33D86DE629F548449450ECF40530106224132D616061BE",
        // account_data.result.account_data.HookNamespaces[0],
      });
      const multisig_txs = await getBatchAccountTx(userAddress.classicAddress);
      const batch_nfts = await getBatchNFTokens(userAddress.classicAddress);
      console.log(
        userAddress,
        account_data,
        account_objects,
        namespace_data,
        multisig_txs,
        batch_nfts
      );
      client.disconnect();
      setAccNfts(batch_nfts);
      setAccData(account_data);
      setAccObjects(account_objects);
      setNamespaceData(namespace_data);
      setmultiSigTxs(multisig_txs);
      let signers = account_objects.result?.account_objects?.filter(
        (obj) => obj.LedgerEntryType === "SignerList"
      );
      console.log(signers);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      return false;
    }
  }

  const ListItem = ({ item, i }) => {
    return (
      <div className="w-full h-12 flex flex-row justify-between items-center px-4 py-8 rounded-md hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1 my-4 bg-[#191919] border border-[#12FF80]">
        <div>{i}</div>
        <div>{truncateStr(item.tx.hash, 8)}</div>
        <div className="my-2">
          <a
            href={`https://hooks-testnet-v3-explorer.xrpl-labs.com/${userAddress.classicAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#12FF80] text-white font-bold px-4 py-2 rounded-md hover:bg-[#63e5a0] transition duration-300 no-underline"
          >
            View on Explorer
          </a>
        </div>
      </div>
    );
  };

  const TxToSign = ({ item, i }) => {
    if (item.HookStateData.length < 5) return <></>;

    let decodedTx = decode(item.HookStateData);

    console.log(decodedTx);

    return (
      <div className="w-full h-48 flex flex-row  justify-evenly items-start px-4 py-8 rounded-md hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1 my-4 bg-[#191919] border border-[#12FF80]">
        <div className="w-full h-full flex flex-col justify-evenly items-start center align-middle divide-y-2 mr-8 gap-2">
          {/* <div>{i}</div> */}
          <div className="w-full">From: {decodedTx.Account}</div>
          <div className="w-full">To: {decodedTx.Destination}</div>
          <div className="w-full">
            TransactionType: {decodedTx.TransactionType}
          </div>
          <div className="w-full">Amount: {decodedTx.Amount}</div>
          <div className="w-full">
            DestinationTag: {decodedTx.DestinationTag}
          </div>
        </div>
        <div className="my-2">
          <a
            // href={`https://hooks-testnet-v3-explorer.xrpl-labs.com/${userAddress.classicAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#12FF80] text-white font-bold px-4 py-2 rounded-md hover:bg-[#63e5a0] transition duration-300 no-underline"
            // onClick={}
          >
            Sign
          </a>
        </div>
      </div>
    );
  };

  function SafeContainer() {
    return (
      <>
        {!isLoading ? (
          <div className="p-4 text-gray-300 mt-24"></div>
        ) : (
          <div className="mt-24">
            <LoadingAnimation />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="min-w-screen bg-[#080808] flex flex-col justify-center center align-middle min-h-screen text-white">
        <div className="flex flex-col items-center p-5 w-full h-full min-w-screen min-h-screen justify-center center align-middle">
          <p className="text-6xl font-extrabold mt-40 text-[#12FF80]">
            XRP multi-sig
          </p>
          <div className="container mt-24 center w-full h-full mx-auto center items-center flex justify-center">
            <input
              type="text"
              placeholder="Add new multi-sig safe"
              className="input input-bordered w-full max-w-sm mx-4 bg-[#191919] py-2 px-4 rounded-md"
              value={multiSigAddres}
              onChange={(event) => setMultiSigAddres(event.target.value)}
            />

            <button
              className="bg-[#12FF80] text-white font-bold px-4 py-2 rounded-md hover:bg-[#63e5a0] transition duration-300 no-underline"
              onClick={() => getBatchAccountData()}
            >
              Inspect
            </button>
          </div>
          {userAddress && accObjects && accData && multiSigTxs && !isLoading ? (
            <div className="w-full flex flex-col  min-h-screen">
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-8 w-full mt-20">
                <div className=" w-full sm:w-1/2">
                  <div className="text-lg font-medium flex mt-2 mb-4 mx-8">
                    Overview
                  </div>
                  <div className="flex flex-col gap-4 items-start justify-between mx-8 divide-y-2 bg-[#191919] border border-[#12FF80] rounded-md h-48 p-6">
                    <div className="flex sm:flex-row flex-col sm-start sm:items-center gap-2 sm:gap-8 w-full">
                      <div className="mb-4">
                        <h2 className="text-xl font-semibold">
                          Wallet Address
                        </h2>
                        <p className="text-gray-200">
                          {userAddress.classicAddress}
                        </p>
                      </div>
                      <div className="my-2 sm:my-4 w-full">
                        <a
                          href={`https://hooks-testnet-v3-explorer.xrpl-labs.com/${userAddress.classicAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#12FF80] text-white font-bold px-4 py-2 rounded-md hover:bg-[#63e5a0] transition duration-300 no-underline"
                        >
                          View on Explorer
                        </a>
                      </div>
                    </div>
                    <div className="py-4 h-full w-full">
                      <p className="text-gray-200">
                        Number of Signers:{" "}
                        {
                          accObjects.result?.account_objects?.filter(
                            (obj) => obj.LedgerEntryType === "SignerList"
                          )[0].SignerEntries.length
                        }
                      </p>
                      <p className="text-gray-200">
                        Number of Transactions:{" "}
                        {JSON.stringify(multiSigTxs.length)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className=" w-full sm:w-1/2">
                  <div className="text-lg font-medium flex mt-2 mb-4 mx-8">
                    Assets
                  </div>
                  <div className="flex flex-col gap-4 items-center justify-around mx-8 divide-y-2 bg-[#191919] border border-[#12FF80] rounded-md h-48 p-6">
                    <div className="py-4 h-full w-full items-start flex flex-col justify-evenly">
                      <p className="text-gray-200">
                        XRP Balance: {accData.result.account_data.Balance}
                      </p>
                      <p className="text-gray-200">
                        NFTs: {JSON.stringify(accNfts.length)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-8 w-full mt-20">
                <div className="w-full sm:w-1/2">
                  <div className="text-lg font-medium flex mt-2 mb-4 mx-8">
                    Proposed Transactions
                  </div>
                  {namespaceData?.result?.namespace_entries.map((row, i) => (
                    <>
                      <TxToSign item={row} i={i} />
                    </>
                  ))}
                </div>
                <div className="w-full sm:w-1/2">
                  <div className="text-lg font-medium flex mt-2 mb-4 mx-8">
                    Completed Transactions
                  </div>
                  {multiSigTxs.map((row, i) => (
                    <>
                      <ListItem item={row} i={i} />
                    </>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <SafeContainer />
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
