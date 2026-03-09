const INITIAL_STATE = {
  networks: process.env.NODE_ENV === "development" ? [54211] : [54211],
};

const reducer = (state = INITIAL_STATE, { type }) => {
  switch (type) {
    default:
      return state;
  }
};

export default reducer;
