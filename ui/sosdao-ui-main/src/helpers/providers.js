const URLs = {
  11235: process.env.REACT_APP_HAQQ_NODE,
  31337: process.env.REACT_APP_LOCAL_NODE,
  43113: process.env.REACT_APP_FUJI_NODE,
  43114: process.env.REACT_APP_AVALANCHE_NODE,
  54211: process.env.REACT_APP_HAQQT_NODE,
};

export function getRPCProvider(chainId) {
  return URLs[chainId];
}
