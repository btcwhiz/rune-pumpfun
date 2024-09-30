"use client";

import { useContext, useRef, useState } from "react";
import Image from "next/image";
import { Accordion, AccordionItem, Button, Input } from "@nextui-org/react";
import toast from "react-hot-toast";
import { LuUpload } from "react-icons/lu";
import { etchingRuneFunc, preEtchingRuneFunc } from "../api/requests";
import { MainContext } from "../contexts/MainContext";
import { unisatSignPsbt } from "../utils/pump";
import PumpInput, { InputStyles } from "../components/PumpInput";

const styles = {
  input: [
    "bg-bgColor-dark",
    "hover:border-warning",
    "!placeholder:text-placeHolder",
  ],
  inputWrapper: [
    "!bg-bgColor-dark",
    "!hover:bg-bgColor-stroke",
    "border-2",
    "border-bgColor-stroke",
    "hover:border-bgColor-stroke",
  ],
};

export default function CreateRune() {
  const itemClasses = {
    base: "py-0 w-full",
    title: "text-white",
  };

  const { userInfo } = useContext(MainContext);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  // Etching
  const [imageData, setImageData] = useState(null);
  const [imageContent, setImageContent] = useState<string>("");
  const [ticker, setTicker] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [dexPercentage, setDexPercentage] = useState<number>(20);
  const [initialBuyAmount, setInitialBuyAmount] = useState<string>("");
  const [twitter, setTwitter] = useState<string>("");
  const [telegram, setTelegram] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [etchingFeeRate, setEtchingFeeRate] = useState<string>("");

  const handleUploadImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const base64ToHex = (base64String: string) => {
    const raw = atob(base64String);
    let result = "";
    for (let i = 0; i < raw.length; i++) {
      const hex = raw.charCodeAt(i).toString(16);
      result += hex.length === 2 ? hex : "0" + hex;
    }
    return result;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    let file: any = event.target?.files;
    if (file && file?.length) {
      if (file && file[0]) {
        file = file[0];
        setImageData(file);

        const reader = new FileReader();

        reader.onload = (e) => {
          // setImagePreview(e.target?.result as string);
          console.log(e.target?.result as string);
        };
        if (file) {
          const reader = new FileReader();

          reader.onload = function () {
            // The result attribute contains the data URL, which is a Base64 string
            const base64String = reader.result as string;
            // Display the Base64 string in a textarea
            const hexString = base64ToHex(base64String.split(",")[1]);
            console.log(hexString);
            setImageContent(hexString);
          };

          // Read the file as a Data URL (Base64 string)
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleEtchingRune = async () => {
    try {
      let rTicker: any = ticker;
      if (!rTicker) rTicker = "$";
      if (!imageContent || !name) {
        return toast.error("Invalid parameters");
      }
      if (initialBuyAmount) {
        if (
          !Number(initialBuyAmount) ||
          !Math.round(Number(initialBuyAmount)) ||
          Math.round(Number(initialBuyAmount)) > 1000000
        ) {
          return toast.error("Invalid initial rune amount");
        }
      }
      if (dexPercentage < 20 || dexPercentage > 50) {
        return toast.error("Dex Percentage range should be from 20 to 50!");
      }

      setLoading(true);

      const saveData = {
        name,
        ticker: rTicker,
        description,
        dexPercentage,
        initialBuyAmount,
        twitter,
        telegram,
        website,
      };

      const { status, etchingPsbt, etchingFee, waitEtchingData }: any =
        await preEtchingRuneFunc(userInfo.userId, imageContent, saveData);
      if (status) {
        setEtchingFeeRate(etchingFee);

        const signedPsbt = await unisatSignPsbt(etchingPsbt.psbt);
        const { status, msg } = await etchingRuneFunc(
          userInfo.userId,
          signedPsbt,
          waitEtchingData.waitEtchingId,
          etchingPsbt.requestId
        );

        if (status) {
          toast.success(msg);
        }
      }
      setImageData(null);
      setImageContent("");
      setTicker("");
      setName("");
      setDescription("");
      setInitialBuyAmount("");
      setTwitter("");
      setTelegram("");
      setWebsite("");
      setLoading(false);
      setEtchingFeeRate("");
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center p-3 md:pt-20">
      <div className="flex flex-col gap-3 border-2 bg-bgColor-ghost p-6 border-bgColor-stroke rounded-2xl w-[420px]">
        <div className="py-3 font-bold text-2xl text-center">Etching</div>
        <div className="flex items-center">
          <div className="flex justify-center w-full">
            <Button
              onClick={handleUploadImage}
              isLoading={loading}
              className="bg-bgColor-stroke px-0 w-[140px] h-[140px] outline-2 outline-bgColor-stroke outline-dashed outline-offset-2"
            >
              {imageData ? (
                <Image
                  alt="rune meme"
                  // @ts-ignore
                  src={URL.createObjectURL(imageData)}
                  width={140}
                  height={140}
                ></Image>
              ) : (
                <div className="flex flex-col items-center gap-2 text-white">
                  <LuUpload size={20} />
                  <div>Upload</div>
                  <div>Max Size: 50mb</div>
                </div>
              )}
            </Button>
          </div>
          <input
            type="file"
            className="hidden opacity-0 min-w-full min-h-full"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>
        <PumpInput
          label="Rune Symbol (optional)"
          value={ticker}
          onChange={setTicker}
        ></PumpInput>
        <PumpInput
          label="Rune Name"
          value={name}
          onChange={setName}
        ></PumpInput>
        <PumpInput
          type="textarea"
          label="Rune Description"
          value={description}
          onChange={setDescription}
        ></PumpInput>
        <Input
          type="number"
          label="Dex Percentage(min: 20, max: 50)"
          value={`${dexPercentage}`}
          color="warning"
          classNames={InputStyles}
          onChange={(e) => setDexPercentage(Number(e.target.value))}
        />
        <PumpInput
          label="First buy rune amount(optional)"
          value={initialBuyAmount}
          onChange={setInitialBuyAmount}
        ></PumpInput>
        <Accordion itemClasses={itemClasses}>
          <AccordionItem
            key="1"
            aria-label="Show more options"
            title="Show more options"
          >
            <div className="flex flex-col gap-3 !text-primary-50">
              <PumpInput
                label="Twitter Link (Optional)"
                value={twitter}
                onChange={setTwitter}
              ></PumpInput>
              <PumpInput
                label="Telegram Link (Optional)"
                value={telegram}
                onChange={setTelegram}
              ></PumpInput>
              <PumpInput
                label="Website (Optional)"
                value={website}
                onChange={setWebsite}
              ></PumpInput>
            </div>
          </AccordionItem>
        </Accordion>
        {etchingFeeRate && (
          <div>{`You should pay ${etchingFeeRate} for etching`}</div>
        )}
        <Button
          color="warning"
          onClick={() => handleEtchingRune()}
          isLoading={loading}
          className="text-white"
        >
          Etching
        </Button>
      </div>
    </div>
  );
}
