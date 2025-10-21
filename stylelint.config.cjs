module.exports = {
  extends: [
    "stylelint-config-standard-scss",
    "stylelint-config-recess-order",
    "stylelint-config-html",
    "stylelint-prettier/recommended",
  ],
  rules: {
    "rule-empty-line-before": [
      "always",
      {
        except: ["first-nested", "after-single-line-comment"],
      },
    ],
    "no-descending-specificity": true,
    "no-duplicate-selectors": true,
    "block-no-empty": true,
  },
};
