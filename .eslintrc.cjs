module.exports = {
    env: {
        browser: true,
        es2021: true,
        jest: true,
    },
    extends: [
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
        "plugin:prettier/recommended",
        "plugin:import/recommended",
    ],
    ignorePatterns: ["node_modules/*", "dist/*", "dist-ssr/*"],
    overrides: [],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 12,
        sourceType: "module",
    },
    plugins: ["react", "@typescript-eslint", "react-hooks"],
    rules: {
        "no-use-before-define": "off",
        "@typescript-eslint/no-use-before-define": ["error"],
        "react/jsx-filename-extension": ["warn", { extensions: [".tsx"] }],
        "import/extensions": ["error", "ignorePackages", { ts: "never", tsx: "never" }],
        "no-shadow": "off",
        "@typescript-eslint/no-shadow": ["error"],
        "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
        "import/prefer-default-export": "off",
        "react/prop-types": "off",
        "prettier/prettier": ["error", { endOfLine: "auto" }],
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-unused-vars": "warn",
        "react/react-in-jsx-scope": "off",
        "@typescript-eslint/no-explicit-any": "warn",
        "prefer-const": "off",
        "import/no-unresolved": "warn",
        "@typescript-eslint/no-shadow": "warn",
        "import/extensions": "off",
        "no-use-before-define": "warn",
        "@typescript-eslint/no-use-before-define": "warn",
        "react/no-unescaped-entities": "warn",
        "@typescript-eslint/ban-types": "warn",
        "react/display-name": "warn",
        "@typescript-eslint/no-unnecessary-type-constraint": "warn",
        "@typescript-eslint/no-this-alias": "warn",
        "import/export": "warn",
        "react/no-deprecated": "warn",
        "react/jsx-key": "warn",
        "react/no-children-prop": "warn",
        "@typescript-eslint/ban-ts-comment": "warn",
        "react-hooks/rules-of-hooks": "warn",
        "max-len": "off",
    },
    settings: {
        "import/resolver": {
            typescript: {},
        },
        react: {
            version: "detect",
        },
    },
};
