import {
  BitcoinNetworkType,
  signTransaction,
  SignTransactionOptions,
} from "sats-connect";
import { TEST_MODE } from "../config";
import { Psbt } from "bitcoinjs-lib";
import toast from "react-hot-toast";

export const XverseSignPsbt = async (
  paymentAddress: string,
  psbtHex: string
) => {
  const psbt = Psbt.fromHex(psbtHex);
  let signingIndexes: number[] = [];
  for (let i = 0; i < psbt.inputCount; i++) {
    signingIndexes.push(i);
  }
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
      inputsToSign: [
        {
          address: paymentAddress,
          signingIndexes,
        },
      ],
    },
    onFinish: (response: any) => {
      const psbt = Psbt.fromBase64(response.psbtBase64);
      signedPSBT = psbt.toHex();
      txId = response.txId;
    },
    onCancel: () => toast.error("Canceled"),
  };

  await signTransaction(signPsbtOptions);

  return {
    signedPSBT,
    txId,
  };
};
