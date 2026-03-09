import React from "react";
import MaskedInput, { conformToMask } from "react-text-mask";
import createNumberMask from "text-mask-addons/dist/createNumberMask";

const defaultMaskOptions = {
  prefix: "",
  suffix: "",
  includeThousandsSeparator: false,
  allowDecimal: true,
  decimalSymbol: ".",
  decimalLimit: 2, // how many digits allowed after the decimal
  integerLimit: 10, // limit length of integer numbers
  allowNegative: false,
  allowLeadingZeroes: false,
};

const DonationInput = ({ onChange, ...inputProps }) => {
  const currencyMask = createNumberMask(defaultMaskOptions);

  const handleChange = (e) => {
    const value = conformToMask(e.target.value, currencyMask).conformedValue;
    onChange(value === "_" ? 0 : value);
  };

  return (
    <MaskedInput onChange={handleChange} mask={currencyMask} {...inputProps} />
  );
};

export default DonationInput;
