import { combineReducers } from "redux";

import language from "./reducers/languageReducer";
import contracts from "./reducers/contractsReducer";
import data from "./reducers/dataReducer";
import ui from "./reducers/uiReducer";
import network from "./reducers/network";
import configuration from "./reducers/configurationReducer";
import account from "./reducers/accountReducer";
import providers from "./reducers/providerReducer";
import theme from "./reducers/themeReducer";

const reducers = combineReducers({
  providers,
  account,
  configuration,
  network,
  language,
  contracts,
  data,
  ui,
  theme,
});

export default reducers;
