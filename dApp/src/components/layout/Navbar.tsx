import React, { useState, useEffect, useContext, useCallback } from "react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Link,
  Routes,
} from "react-router-dom";
import { LedgerContext } from "../../contexts/LedgerProvider";
import { truncateStr } from "../../utils";
import Home from "../../pages/Home";
import Dashboard from "../../pages/Dashboard";

const Navbar = () => {
  const {
    xummInstance,
    account,
    chainId,
    connected,
    connect,
    disconnect,
    getData,
  } = useContext(LedgerContext);

  useEffect(() => {
    (async () => {
      // console.log(xummInstance);
      // console.log(account);
    })();
  }, []);

  const signInWithXumm = async () => {
    const res = await connect();
    // console.log(res);
    // console.log(await xummInstance);
    // console.log(account);
  };

  return (
    <div>
      <nav
        className="flex justify-between px-16 py-2 bg-[#0f0e0e]
            backdrop-blur-md shadow-md w-full
            fixed top-0 left-0 right-0 z-10 overflow-hidden"
      >
        <div className="flex items-center">
          <a className="cursor-pointer">
            {/* <h3 className="text-2xl font-medium text-green-300">XRP Safe</h3> */}
            <img src="/Removal-39.png" alt="" className="w-14 h-14" />
          </a>
        </div>

        <div className="flex items-center space-x-5">
          <a
            className="flex
                    cursor-pointer transition-colors duration-300
                    font-semibold text-green-300"
          >
            <ArrowRightOnRectangleIcon className="fill-current h-5 w-5 mr-2 mt-0.5 text-green-300" />
            {!account ? (
              <div onClick={() => signInWithXumm()}>XUMM login</div>
            ) : (
              <div onClick={() => disconnect()}>{truncateStr(account)}</div>
            )}
          </a>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </div>
  );
};

export default Navbar;
