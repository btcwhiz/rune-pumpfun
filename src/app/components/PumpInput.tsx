import { Input } from "@nextui-org/react";
import { ReactNode } from "react";

export const InputStyles = {
  input: [
    "bg-bgColor-white",
    "hover:border-pink",
    "!placeholder:text-placeHolder",
  ],
  inputWrapper: [
    "!bg-bgColor-white",
    "!hover:bg-bgColor-stroke",
    "border-2",
    "border-bgColor-stroke",
    "hover:border-bgColor-stroke",
  ],
};

const PumpInput = ({
  type = "text",
  label = "",
  value,
  color = "secondary",
  placeholder = "",
  className = "text-pink",
  classNames = InputStyles,
  onChange,
  disabled = false,
  endContent,
}: {
  type?: string;
  label?: string | ReactNode;
  value: string;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | undefined;
  placeholder?: string;
  className?: string;
  classNames?: object;
  onChange?: (value: string | any) => void;
  disabled?: boolean;
  endContent?: ReactNode;
}) => {
  return (
    <Input
      type={type}
      label={label}
      value={value}
      color={color}
      className={className}
      classNames={classNames}
      onChange={(e) => {
        if (onChange) {
          if (type === "number") {
            onChange(Number(e.target.value));
          } else {
            onChange(e.target.value);
          }
        }
      }}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
};

export default PumpInput;
