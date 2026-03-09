import React from "react";

import FormError from "./FormError";

function Input({ errors, handle, lang, register }) {
  return (
    <>
      <label>{lang[handle]}</label>
      <input {...register(handle)} />
      <FormError errors={errors} handle={handle} />
    </>
  );
}

export default Input;
