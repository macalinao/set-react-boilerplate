import kyberAbi from "./kyberAbi";
import promisify from "tiny-promisify";

const KPROXY = "0x7e6b8b9510D71BF8EF0f893902EbB9C865eEF4Df";
const ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

class KyberUtil {
  constructor(web3) {
    this.web3 = web3;
    const KProxy = web3.eth.contract(kyberAbi);
    this.kproxy = KProxy.at(KPROXY);
  }

  getExpectedRate(token, amt) {
    return promisify(this.kproxy.getExpectedRate.call)(ETH, token, amt);
  }
}

export default KyberUtil;
