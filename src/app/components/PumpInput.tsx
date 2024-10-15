import { Input } from "@nextui-org/react";
import { ReactNode } from "react";

export const InputStyles = {
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

const PumpInput = ({
  type = "text",
  label = "",
  value,
  color = "warning",
  placeholder = "",
  className = "",
  classNames = InputStyles,
  onChange,
  disabled = false,
  endContent,
}: {
  type?: string;
  label?: string;
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
