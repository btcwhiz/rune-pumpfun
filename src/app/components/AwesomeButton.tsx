import { ReactNode } from "react";
import {
  AwesomeButton,
  AwesomeButtonProgress,
  // AwesomeButtonSocial,
} from "react-awesome-button";

export const PumpButton = async ({
  type = "primary",
  children,
}: {
  type?: string;
  children: ReactNode;
}) => {
  return <AwesomeButton type={type}>{children}</AwesomeButton>;
};

export const PumpProgressButton = async ({
  type = "primary",
  size = "medium",
  children,
}: {
  type?: string;
  size?: string;
  children: ReactNode;
}) => {
  return (
    <AwesomeButtonProgress
      type={type}
      size={size}
      onPress={async (element, next) => {
        console.log("onpressed");
        // await for something then call
        next();
      }}
    >
      {children}
    </AwesomeButtonProgress>
  );
};
