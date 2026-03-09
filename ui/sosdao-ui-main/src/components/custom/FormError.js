import React from "react";

function FormError({ errors, handle }) {
  return <div>{errors[handle] && errors[handle].message}</div>;
}

export default FormError;
