import { lightTheme, darkTheme } from "../../common/theme";

const initialState = {
  theme: {
    mode: "light",
    ...lightTheme,
  },
};

const themeReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_MODE":
      return {
        ...state,
        theme: {
          ...state.theme,
          mode: action.payload,
          ...(action.payload === "light" ? lightTheme : darkTheme),
        },
      };
    default:
      return state;
  }
};

export default themeReducer;
