module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: ["eslint:recommended"],
  rules: {
    quotes: ["off"],
    "prefer-arrow-callback": "off",
    "no-restricted-globals": "off",

    // REMOVE annoying rules:
    "linebreak-style": "off",
    "max-len": "off",
    indent: "off",
    "comma-dangle": "off",
    "object-curly-spacing": "off",
    "no-unused-vars": "off",
  },
};
