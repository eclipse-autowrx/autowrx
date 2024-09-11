# How to create your own autowrx instance

## Principle
1. Create a submodule to autowrx project, instead of clone and modify code so that you can get utilize the last features contribute by community.
2. Modify /instance.ts and /src/config/configs.ts to custom your own look and feel and connect to your services


## Folder structure for a custom instance

- @autowrx   # submodule to https://gitlab.eclipse.org/eclipse/autowrx/autowrx
- .gitsubmodules
- .gitignore
- build.sh
- config
    - instance.ts
    - public
        - imgs
            - favicon.ico
            - logo-wide.png
    - src
        - configs.ts
        - index.css


