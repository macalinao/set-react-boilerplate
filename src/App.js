import React, { Component } from "react";
import "./App.css";
import withHyperMask from "hypermask";
import * as Web3 from "web3";
import KyberUtil from "./kyberUtil";

import SetProtocol from "setprotocol.js";
import BigNumber from "bignumber.js";

// Kovan configuration
const config = {
  coreAddress: "0xdd7d1deb82a64af0a6265951895faf48fc78ddfc",
  setTokenFactoryAddress: "0x7497d12488ee035f5d30ec716bbf41735554e3b1",
  transferProxyAddress: "0xa0929aba843ff1a1af4451e52d26f7dde3d40f82",
  vaultAddress: "0x76aae6f20658f763bd58f5af028f925e7c5319af"
};

const Prices = ({ prices }) => (
  <div>
    {Object.keys(prices).map(tok => (
      <div key={tok}>
        <h3>
          {tok}
          /ETH
        </h3>
        <p>
          Rate:{" "}
          {prices[tok].minRate
            .div(new BigNumber("1000000000000000000"))
            .toString()}
        </p>
      </div>
    ))}
  </div>
);

class App extends Component {
  constructor() {
    super();
    let injectedWeb3 = window.web3 || undefined;
    let setProtocol;
    try {
      // Use MetaMask/Mist provider
      const provider = injectedWeb3
        ? injectedWeb3.currentProvider
        : withHyperMask(
            new Web3.providers.HttpProvider("https://kovan.infura.io/")
          );
      if (!injectedWeb3) injectedWeb3 = new Web3(provider);

      setProtocol = new SetProtocol(provider, config);
    } catch (err) {
      // Throws when user doesn't have MetaMask/Mist running
      throw new Error(
        `No injected web3 found when initializing setProtocol: ${err}`
      );
    }

    this.state = {
      setProtocol,
      web3: injectedWeb3,
      // Etherscan Links
      createdSetLink: "",
      prices: {}
    };
    this.createSet = this.createSet.bind(this);
    this.getAccount = this.getAccount.bind(this);

    this.initPrices();
  }

  async initPrices() {
    const prices = await new KyberUtil(this.state.web3).findPrices(
      1000000000000000000
    );
    this.setState({
      prices
    });
  }

  async createSet() {
    const { setProtocol } = this.state;

    /**
     * Steps to create your own Set Token
     * ----------------------------------
     *
     * 1. Fund your MetaMask wallet with Kovan ETH: https://gitter.im/kovan-testnet/faucet
     * 2. Modify your Set details below to your liking
     * 3. Click `Create My Set`
     */
    const trueUsdAddress = "0xadb015d61f4beb2a712d237d9d4c5b75bafefd7b";
    const daiAddress = "0x1d82471142f0aeeec9fc375fc975629056c26cee";

    const componentAddresses = [trueUsdAddress, daiAddress];
    const componentUnits = [new BigNumber(5), new BigNumber(5)];
    const naturalUnit = new BigNumber(10);
    const name = "My Set";
    const symbol = "MS";
    const account = await this.getAccount();
    const txOpts = {
      from: account,
      gas: 4000000,
      gasPrice: 8000000000
    };

    const txHash = await setProtocol.createSetAsync(
      componentAddresses,
      componentUnits,
      naturalUnit,
      name,
      symbol,
      txOpts
    );
    const setAddress = await setProtocol.getSetAddressFromCreateTxHashAsync(
      txHash
    );
    this.setState({
      createdSetLink: `https://kovan.etherscan.io/address/${setAddress}`
    });
  }

  async issueSet() {
    /**
     * Steps to Issue your Set Token
     * -----------------------------
     *
     * 1. Get TestNet TrueUSD and Dai
     *   - Navigate to the links below:
     *     - TrueUSD: https://kovan.etherscan.io/address/0xadb015d61f4beb2a712d237d9d4c5b75bafefd7b#writeContract
     *     - Dai:     https://kovan.etherscan.io/address/0x1d82471142f0aeeec9fc375fc975629056c26cee#writeContract
     *   - Click `Connect with MetaMask` link in the `Write Contract` tab. Click `OK` in the modal that shows up.
     *   - In the `greedIsGood` function, put in:
     *     - _to: Your MetaMask address
     *     - _value: 100000000000000000000000
     *   - Click the `Write` button
     *   - Confirm your MetaMask transaction
     *   - You now have TestNet tokens for TrueUSD/Dai.
     *   - Be sure to repeat the process for the other remaining TrueUSD/Dai token.
     */
    // Tutorial Link: https://docs.setprotocol.com/tutorials#issuing-a-set

    // Grab the setAddress after creating our Set
    const stableSetAddress = this.createSet();
    const { setProtocol } = this.state;

    const issueStableSet = async function() {
      // Issue 1x StableSet which equals 10 ** 18 base units.
      const issueQuantity = new BigNumber(10 ** 18);

      // Check that our issue quantity is divisible by the natural unit.
      const isMultipleOfNaturalUnit = await setProtocol.setToken.isMultipleOfNaturalUnitAsync(
        stableSetAddress,
        issueQuantity
      );

      if (isMultipleOfNaturalUnit) {
        try {
          return await setProtocol.issueAsync(stableSetAddress, issueQuantity, {
            from: "0xYourMetaMaskAddress",
            gas: 4000000,
            gasPrice: 8000000000
          });
        } catch (err) {
          throw new Error(`Error when issuing a new Set token: ${err}`);
        }
      }
      throw new Error(
        `Issue quantity is not multiple of natural unit. Confirm that your issue quantity is divisible by the natural unit.`
      );
    };

    const issueTxHash = await issueStableSet();
  }

  getAccount() {
    const { web3 } = this.state;
    return new Promise((resolve, reject) => {
      web3.eth.getAccounts((err, res) => {
        if (err) reject(err);
        if (res[0]) resolve(res[0]);
        reject(Error("Your MetaMask is locked. Unlock it to continue."));
      });
    });
  }

  renderEtherScanLink(link, content) {
    return (
      <div className="App-button-container">
        <a target="_blank" rel="noopener" href={link}>
          {content}
        </a>
      </div>
    );
  }

  render() {
    const { createdSetLink } = this.state;
    return (
      <div className="App">
        <header>
          <h1>Exchange One Cryptocurrency For Multiple</h1>
          <p>Hypershift is a free tool powered by HyperMask and Set.</p>
        </header>
        <div>
          <button onClick={this.createSet}>Create My Set</button>
          {createdSetLink
            ? this.renderEtherScanLink(createdSetLink, "Link to your new Set")
            : null}
        </div>
        <Prices prices={this.state.prices} />
        <button
          onClick={async () => {
            console.log(
              await new KyberUtil(this.state.web3).findPrices(
                1000000000000000000
              )
            );
          }}
        >
          show kyber
        </button>
      </div>
    );
  }
}

export default App;
