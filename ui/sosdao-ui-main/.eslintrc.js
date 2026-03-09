module.exports = {
  env: {
    browser: true,
  },
  extends: ["eslint:recommended", "plugin:react/recommended"],
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },

    ecmaVersion: "latest",
  },
  plugins: ["react"],
  rules: {
    "no-unused-vars": "off",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "no-extra-boolean-cast": "off",
    "no-empty": "off",
    "no-case-declarations": "off",
    "no-anonymous-default-export": "off",
    "import/no-anonymous-default-export": "off",
  },
};
