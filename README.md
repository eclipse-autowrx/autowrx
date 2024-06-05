# NVM setup

Setup nvm to automatically change to compatible node version

- If you use `bash`, add this to the end of ~/.bashrc

```
_nvmrc_hook() {
  if [[ $PWD == $PREV_PWD ]]; then
    return
  fi

  PREV_PWD=$PWD
  [[ -f ".nvmrc" ]] && nvm use
}

if ! [[ "${PROMPT_COMMAND:-}" =~ _nvmrc_hook ]]; then
  PROMPT_COMMAND="_nvmrc_hook${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
fi
```

- If you use `nvm`, add this to the end of ~/.nvmrc

```
autoload -U add-zsh-hook
load-nvmrc() {
  local node_version="$(nvm version)"
  local nvmrc_path="$(nvm_find_nvmrc)"

  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$node_version" ]; then
      nvm use
    fi
  elif [ "$node_version" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

> **Close your terminal and open again to apply changes**

# How to use

- To local dev: `yarn dev`
- To check for typescript: `yarn tsc`
- To build: `yarn build`

# Module missing error

In case you get this error when run `yarn tsc` or `yarn build`:

`Could not find a declaration file for module '<some_package_here>'.`

Try steps below.

1. Check if you already installed package `some_package_here` or not
2. If already installed the package but still error, try to install types of it: `yarn add -D @types/some_package_here`
3. If still get error, go to `src/types/index.d.ts`, add this:

```javascript
declare module 'some_package_here' {
  const content: any
  export default content
}
```

# Atom design

https://blog.logicwind.com/implement-atomic-design-component-in-react/

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
