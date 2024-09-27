"use client";

import { useContext, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Accordion, AccordionItem, Button, Input } from "@nextui-org/react";
import toast from "react-hot-toast";
import { etchingRuneFunc, preEtchingRuneFunc } from "../api/requests";
import { MainContext } from "../contexts/MainContext";
import { unisatSignPsbt } from "../utils/pump";

export default function CreateRune() {
  const itemClasses = {
    base: "py-0 w-full",
    title: "text-white",
    // trigger:
    //   "px-2 py-0 data-[hover=true]:bg-default-100 rounded-lg h-14 flex items-center",
    // indicator: "text-medium",
    // content: "text-small px-2",
  };

  const { ordinalAddress, userInfo } = useContext(MainContext);

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
    <main className="p-3 min-h-screen">
      <div className="flex flex-col gap-3">
        <div className="flex justify-center">
          <Link className="p-3 border rounded-xl" href={"/"}>
            Go Back
          </Link>
        </div>
        <div className="flex justify-center">
          {/* Etching */}
          <div className="w-[420px]">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {imageData && (
                  <Image
                    alt="rune meme"
                    // @ts-ignore
                    src={URL.createObjectURL(imageData)}
                    width={50}
                    height={50}
                  ></Image>
                )}
                <div>
                  <Button
                    color="success"
                    onClick={handleUploadImage}
                    isLoading={loading}
                  >
                    Upload Image
                  </Button>
                </div>
                <div>Max file Size: 50mb</div>
                <input
                  type="file"
                  className="hidden opacity-0 min-w-full min-h-full"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              <Input
                type="text"
                label="Rune Symbol (optional)"
                value={ticker}
                className="bg-transparent"
                color="primary"
                onChange={(e) => setTicker(e.target.value)}
              />
              <Input
                type="text"
                label="Rune Name"
                value={name}
                color="primary"
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                type="textarea"
                label="Rune Description"
                value={description}
                color="primary"
                onChange={(e) => setDescription(e.target.value)}
              />
              <Input
                type="number"
                label="Dex Percentage(min: 20, max: 50)"
                value={`${dexPercentage}`}
                color="primary"
                onChange={(e) => setDexPercentage(Number(e.target.value))}
              />
              <Input
                type="text"
                label="First buy rune amount(optional)"
                value={initialBuyAmount}
                color="primary"
                onChange={(e) => setInitialBuyAmount(e.target.value)}
              />
              <Accordion itemClasses={itemClasses}>
                <AccordionItem
                  key="1"
                  aria-label="Show more options"
                  title="Show more options"
                >
                  <div className="flex flex-col gap-3 !text-primary-50">
                    <Input
                      type="text"
                      label="twitter link"
                      placeholder="(optional)"
                      value={twitter}
                      color="primary"
                      onChange={(e) => setTwitter(e.target.value)}
                    />
                    <Input
                      type="text"
                      label="telegram link"
                      placeholder="(optional)"
                      value={telegram}
                      color="primary"
                      onChange={(e) => setTelegram(e.target.value)}
                    />
                    <Input
                      type="text"
                      label="website"
                      placeholder="(optional)"
                      value={website}
                      color="primary"
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </AccordionItem>
              </Accordion>
              {etchingFeeRate && (
                <div>{`You should pay ${etchingFeeRate} for etching`}</div>
              )}
              <Button
                color="success"
                onClick={() => handleEtchingRune()}
                isLoading={loading}
              >
                Etching
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
