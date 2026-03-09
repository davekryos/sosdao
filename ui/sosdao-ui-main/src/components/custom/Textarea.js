import React from "react";

import FormError from "./FormError";

function Textarea({ errors, handle, lang, register }) {
  return (
    <>
      <label>{lang[handle]}</label>
      <textarea {...register(handle)} />
      <FormError errors={errors} handle={handle} />
    </>
  );
}

export default Textarea;
