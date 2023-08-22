import React, { useState, useEffect, useContext, useCallback } from "react";
import { LedgerContext } from "../contexts/LedgerProvider";
import LoadingAnimation from "../components/LoadingAnimation";
import { truncateStr } from "../utils";

function Home() {
  const { xummInstance, account, chainId, connected, connect, disconnect } =
    useContext(LedgerContext);

  useEffect(() => {
    (async () => {})();
  }, []);

  return (
    <>
      <div className="min-w-screen bg-gray-900">
        <div className="flex flex-col items-center p-5">
          <p className="text-6xl font-bold my-64 text-gray-300">
            XRP Multi-Sig
          </p>
          {!account ? (
            <button
              className="text-green-300 border border-green-300 rounded-xl px-5 py-2"
              onClick={signInWithXumm}
            >
              XUMM login
            </button>
          ) : (
            <div>Loading...</div>
          )}
        </div>
      </div>
    </>
  );
}

export default Home;
