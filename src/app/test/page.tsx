"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

function TestPage() {
  const [tokensToBuy, setTokensToBuy] = useState(0);
  const [tokensToSell, setTokensToSell] = useState(0);
  const [tokensToBurn, setTokensToBurn] = useState(0);
  const [log, setLog] = useState<any>({});
  const [stage, setStage] = useState(1);

  useEffect(() => {
    fetchLog();
  }, []);

  const fetchLog = async () => {
    try {
      const response = await axios.get("http://localhost:5000/log");
      setLog(response.data);
      setStage(response.data.stage);
    } catch (error: any) {
      console.error("Error fetching log:", error);
    }
  };

  const handleBuy = async () => {
    try {
      await axios.post("http://localhost:5000/buy", { tokensToBuy });
      fetchLog(); // Update the log and balances
    } catch (error: any) {
      console.error("Error buying tokens:", error);
      alert(
        error.response
          ? error.response.data
          : "Error occurred while buying tokens."
      );
    }
  };

  const handleSell = async () => {
    try {
      await axios.post("http://localhost:5000/sell", { tokensToSell });
      fetchLog(); // Update the log and balances
    } catch (error: any) {
      console.error("Error selling tokens:", error);
      alert(
        error.response
          ? error.response.data
          : "Error occurred while selling tokens."
      );
    }
  };

  const handleBurnToBuyStage2 = async () => {
    try {
      await axios.post("http://localhost:5000/burn-to-buy-stage2", {
        tokensToBurn,
      });
      fetchLog(); // Update the log and balances
    } catch (error: any) {
      console.error("Error burning tokens to buy in Stage 2:", error);
      alert(
        error.response
          ? error.response.data
          : "Error occurred while burning tokens."
      );
    }
  };

  return (
    <div className="container">
      <h1>Bonding Curve Token Sale</h1>

      <div className="status-bar">
        <div>
          <strong>Stage:</strong> {stage}
        </div>
        <div>
          <strong>Token Balance:</strong> {log.tokenBalance}
        </div>
        <div>
          <strong>USD Balance:</strong> ${log.remainingBalance?.toFixed(2)}
        </div>
      </div>

      <div className="funds-raised">
        <div>
          <strong>Total Funds Raised (Stage 1):</strong> $
          {log.stage1FundsRaised?.toFixed(2)}
        </div>
        <div>
          <strong>Total Funds Raised (Stage 2):</strong> $
          {log.stage2FundsRaised?.toFixed(2)}
        </div>
      </div>

      <div className="remaining-tokens">
        <div>
          <strong>Tokens Remaining (Stage 1):</strong>{" "}
          {log.stage1RemainingTokens}
        </div>
        <div>
          <strong>Tokens Remaining (Stage 2):</strong>{" "}
          {log.stage2RemainingTokens}
        </div>
        <div>
          <strong>Available Tokens to Burn (Stage 1):</strong>{" "}
          {log.stage1TokenBalance}
        </div>
      </div>

      <div className="trading-panel">
        {stage === 1 && (
          <div className="trade-box">
            <h2>Stage 1 - Buy Tokens</h2>
            <input
              type="number"
              value={tokensToBuy}
              onChange={(e: any) => setTokensToBuy(e.target.value)}
              placeholder="Number of tokens to buy"
              className="input-box"
            />
            <button onClick={handleBuy} className="buy-button">
              Buy Tokens
            </button>
          </div>
        )}

        {stage === 2 && (
          <div className="trade-box">
            <h2>Stage 2 - Buy or Burn to Buy Tokens</h2>
            <input
              type="number"
              value={tokensToBuy}
              onChange={(e: any) => setTokensToBuy(e.target.value)}
              placeholder="Number of tokens to buy"
              className="input-box"
            />
            <button onClick={handleBuy} className="buy-button">
              Buy Tokens
            </button>

            <h3>Burn Tokens to Buy in Stage 2</h3>
            <input
              type="number"
              value={tokensToBurn}
              onChange={(e: any) => setTokensToBurn(e.target.value)}
              placeholder="Number of tokens to burn"
              className="input-box"
            />
            <button onClick={handleBurnToBuyStage2} className="burn-button">
              Burn to Buy Tokens
            </button>
          </div>
        )}

        <div className="trade-box">
          <h2>Sell Tokens</h2>
          <input
            type="number"
            value={tokensToSell}
            onChange={(e: any) => setTokensToSell(e.target.value)}
            placeholder="Number of tokens to sell"
            className="input-box"
          />
          <button onClick={handleSell} className="sell-button">
            Sell Tokens
          </button>
        </div>
      </div>

      <h2>Transaction Log</h2>
      <div className="transaction-log">
        <ul>
          {log.transactionLog?.map((entry: any, index: any) => (
            <li key={index} className="log-entry">
              {entry.type === "burn-to-buy"
                ? `Burned ${entry.tokensBurned} tokens and bought ${
                    entry.tokensBought
                  } tokens, Balance: $${entry.balance?.toFixed(2)}, Tokens: ${
                    entry.tokenBalance
                  }`
                : `${
                    entry.type.charAt(0).toUpperCase() + entry.type.slice(1)
                  } - ${entry.tokens} tokens for $${
                    entry.cost?.toFixed(2) || entry.refund?.toFixed(2)
                  }, Balance: $${entry.balance?.toFixed(2)}, Tokens: ${
                    entry.tokenBalance
                  }`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TestPage;
