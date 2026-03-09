import React from "react";
import { useSelector } from "react-redux";

const ThemeProvider = ({ children }) => {
  const { theme } = useSelector((state) => state.theme);

  document.body.style.background = theme.background;
  document.body.style.backgroundColor = theme.backgroundColor;

  return <>{children}</>;
};

export default ThemeProvider;
