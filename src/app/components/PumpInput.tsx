import { Input } from "@nextui-org/react"

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
    label,
    value,
    color = "warning",
    classNames = InputStyles,
    onChange,
}: {
    type?: string,
    label: string,
    value: string,
    color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | undefined,
    classNames?: object,
    onChange: (value: string) => void,
}) => {
    return (
        <Input
            type={type}
            label={label}
            value={value}
            color={color}
            classNames={classNames}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}

export default PumpInput;