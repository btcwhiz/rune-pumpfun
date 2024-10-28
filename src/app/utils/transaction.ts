import {
  BitcoinNetworkType,
  signTransaction,
  SignTransactionOptions,
} from "sats-connect";
import { TEST_MODE } from "../config";
import { Psbt } from "bitcoinjs-lib";
import toast from "react-hot-toast";

export const XverseSignPsbt = async (psbtHex: string, inputsToSign: any) => {
  const psbt = Psbt.fromHex(psbtHex);
  // console.log("psbt :>> ", psbt);
  // console.log("inputsToSign :>> ", inputsToSign);
  let signedPSBT = "";
  let txId = "";
  const signPsbtOptions: SignTransactionOptions = {
    payload: {
      network: {
        type: TEST_MODE
          ? BitcoinNetworkType.Testnet
          : BitcoinNetworkType.Mainnet,
      },
      message: "Sign Transaction",
      psbtBase64: psbt.toBase64(),
      broadcast: false,
      inputsToSign,
    },
    onFinish: (response: any) => {
      const psbt = Psbt.fromBase64(response.psbtBase64);
      signedPSBT = psbt.toHex();
      txId = response.txId;
    },
    onCancel: () => {},
  };

  await signTransaction(signPsbtOptions);

  return {
    signedPSBT,
    txId,
  };
};
