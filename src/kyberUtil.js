import kyberAbi from "./kyberAbi";
import promisify from "tiny-promisify";

const KPROXY = "0x7e6b8b9510D71BF8EF0f893902EbB9C865eEF4Df";
const ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

const OMG = "0x8870946B0018E2996a7175e8380eb0d43dD09EFE";
const SALT = "0xCd43d7410295E54922a2C3CF6F2Dd1BD7D18AbD1";
const SNT = "0x0fA1727EE15Cc6afAB7305e03E06237de66B5EC4";

class KyberUtil {
  constructor(web3) {
    this.web3 = web3;
    const KProxy = web3.eth.contract(kyberAbi);
    this.kproxy = KProxy.at(KPROXY);
  }

  async getExpectedEtherRate(token, amt) {
    const res = await promisify(this.kproxy.getExpectedRate.call)(
      ETH,
      token,
      amt
    );
    return {
      expectedRate: res[0],
      minRate: res[1]
    };
  }

  async findPrices(amt) {
    const omg = await this.getExpectedEtherRate(OMG, amt);
    const salt = await this.getExpectedEtherRate(SALT, amt);
    const snt = await this.getExpectedEtherRate(SNT, amt);
    return { omg, salt, snt };
  }

  async swapEtherToToken(token, minRate, value) {
    return await promisify(this.kproxy.swapEtherToToken.value)(token, minRate, {
      value: value
    });
  }
}

export default KyberUtil;
