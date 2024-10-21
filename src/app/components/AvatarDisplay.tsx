import { Avatar } from "@nextui-org/react";
import { useEffect, useState } from "react";

const AvatarDisplay = ({
  runeName = "avatar",
  src,
  className = "w-52 h-52",
}: {
  runeName?: string;
  src: string;
  className?: string;
}) => {
  const [imgUrl, setImgUrl] = useState<string>("");

  const hexToBase64 = async (hexString: string) => {
    let binary = "";
    for (let i = 0; i < hexString.length; i += 2) {
      binary += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
    }
    return window.btoa(binary);
  };

  const initImage = async () => {
    const base64String = await hexToBase64(src);
    const dataUrl = `data:image/png;base64,${base64String}`;
    setImgUrl(dataUrl);
  };

  useEffect(() => {
    src && initImage();
    // eslint-disable-next-line
  }, [src]);

  return (
    <div className="flex justify-center items-center">
      <div className="rounded-lg overflow-hidden">
        {/* eslint-disable-next-line */}
        {imgUrl && (
          <Avatar
            alt={runeName}
            className="flex-shrink-0"
            size="sm"
            src={imgUrl}
          />
        )}
      </div>
    </div>
  );
};

export default AvatarDisplay;
