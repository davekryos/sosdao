import { getLanguage } from "../../common/language";

export default (state, action) => {
  return {
    ...state,
    ...getLanguage(action.language),
  };
};
