import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalProps,
  Button,
  useDisclosure,
  RadioGroup,
  Radio,
  Checkbox,
} from "@nextui-org/react";

export default function News() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isSelected, setIsSelected] = useState<boolean>(false);
  useEffect(() => {
    onOpen();
  }, []);
  const Runedcom = () => {
    return <span className="text-pink"> Runed.com</span>;
  };
  return (
    <div className="flex flex-col gap-2">
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        scrollBehavior={"inside"}
        isDismissable={false}
        size="2xl"
      >
        <ModalContent className="bg-black bg-opacity-90 backdrop-blur-[57px]">
          {(onClose) => (
            <>
              <ModalHeader className="flex gap-1">
                <Runedcom />
                <span>Terms of Service (TOS)</span>
              </ModalHeader>
              <ModalBody>
                <p className="text-lg font-bold text-pink">
                  WARNING: HIGH-RISK PLATFORM IN BETA
                </p>
                <p className="font-bold">
                  Please Read Carefully Before Proceeding
                </p>

                <p>
                  <Runedcom /> is currently in a beta testing phase. This
                  platform should be considered high risk due to its
                  developmental nature. Users may experience unexpected bugs,
                  technical errors, or interface malfunctions, which could
                  result in loss of funds or assets. By interacting with
                  <Runedcom />, you acknowledge and accept the risk of potential
                  financial losses or other negative consequences.
                </p>

                <p>
                  We are not responsible or liable for any losses or damages
                  incurred. Users should only participate if they are fully
                  prepared to lose all funds used on the platform. This platform
                  has not undergone any audits or third-party testing, and as
                  such, may contain multiple vulnerabilities, errors, or
                  operational issues.
                </p>

                <p className="font-bold text-xl">Terms of Service (TOS)</p>
                <p>
                  <span className="text-pink">1.</span> Acceptance of Risk By
                  accessing or using <Runedcom />, you acknowledge that the
                  platform is in a beta phase and subject to frequent changes,
                  errors, and disruptions. You accept full responsibility for
                  any loss, damage, or adverse effects resulting from your use
                  of the platform.
                </p>

                <p>
                  <span className="text-pink">2.</span> No Warranties
                  <Runedcom /> is provided on an &quote;as-is&quote; basis
                  without warranties of any kind, whether express or implied.
                  There is no guarantee that the platform will function
                  error-free or that its use will be safe. <Runedcom /> is
                  currently untested by third parties, and we offer no
                  assurances regarding the security, reliability, or accuracy of
                  any transactions made on the platform.
                </p>

                <p>
                  <span className="text-pink">3.</span> No Liability for
                  Losses We disclaim all liability for any financial or
                  asset-related losses incurred through the use of
                  <Runedcom />, including but not limited to losses resulting
                  from bugs, platform failures, unauthorized access, or any
                  other operational issues. By using <Runedcom />, you agree not
                  to hold us liable for any issues arising from your
                  interactions.
                </p>

                <p>
                  <span className="text-pink">4.</span> Suspension of
                  Activities <Runedcom /> reserves the right to suspend or
                  discontinue any activities or services at any time, for any
                  reason, without prior notice. This may include, but is not
                  limited to, changes to features, access, or availability of
                  the platform.
                </p>

                <p>
                  <span className="text-pink">5.</span> Beta Testing
                  Environment and Testnet Availability
                  <Runedcom /> is an evolving platform subject to ongoing
                  development. Users may encounter operational errors, limited
                  functionality, and frequent changes to the user experience.
                  Certain functions or features may be added, removed, enabled,
                  or disabled at our discretion. We also offer a testnet
                  environment with paper wallets for those wishing to explore
                  features without real asset risk.
                </p>

                <p>
                  <span className="text-pink">6.</span> Assumption of
                  Financial Loss Due to the platform’s beta status, we advise
                  that users should expect financial losses. Proceed only if you
                  are fully prepared to accept these risks.
                </p>

                <p>
                  By using <Runedcom />, you agree to these Terms of Service and
                  fully understand the associated risks.
                </p>

                <p>
                  <Checkbox
                    // color="warning"
                    className="text-pink"
                    onChange={(e) => setIsSelected(e.target.checked)}
                  >
                    <span className="text-pink">
                      Accept these terms of service
                    </span>
                  </Checkbox>
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  // color="warning"
                  onClick={onClose}
                  className={`rounded-md ${
                    isSelected ? "text-white" : "text-bgColor-stroke"
                  }`}
                  variant="flat"
                  disabled={!isSelected}
                >
                  Accept
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
