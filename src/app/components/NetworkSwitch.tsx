import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Link,
} from "@nextui-org/react";
import BitcoinIcon from "./icons/BitcoinIcon";
import { TEST_MODE } from "../config";
import { useState } from "react";
import { BETA_LINK, TEST_LINK } from "../config/config";
import { FaChevronDown } from "react-icons/fa";

export default function NetworkSwitch() {
  const [testnet, setTestnet] = useState<boolean>(TEST_MODE);
  return (
    <Dropdown
      className="w-30"
      classNames={{ content: "min-w-30 bg-[rgba(234,234,234,0.1)]" }}
    >
      <DropdownTrigger>
        <Button
          variant="bordered"
          className={`text-white ${
            testnet ? "border-bgColor-lime" : "border-orange"
          }`}
        >
          <BitcoinIcon test={testnet} />
          {`${testnet ? "Testnet" : "Mainnet"}`}
          <FaChevronDown />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        variant="bordered"
        aria-label="Network"
        className="w-30"
        classNames={{ base: "w-30" }}
      >
        <DropdownItem
          key="main"
          className="w-30 text-orange"
          startContent={<BitcoinIcon test={false} />}
          onPress={() => setTestnet(false)}
          as={Link}
          href={BETA_LINK}
        >
          Mainnet
        </DropdownItem>
        <DropdownItem
          key="test"
          className="w-30 text-bgColor-lime"
          startContent={<BitcoinIcon />}
          onPress={() => setTestnet(true)}
          as={Link}
          href={TEST_LINK}
        >
          Testnet
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
