# Red Hat OpenShift Application Services

Contributes `Red Hat OpenShift Streams For Apache Kafka` clusters to the [Tools for Apache Kafka](https://marketplace.visualstudio.com/items?itemName=jeppeandersen.vscode-kafka) VS Code extension.

The Red Hat authentication is provided by [vscode-redhat-account](https://github.com/redhat-developer/vscode-redhat-account).

Requires 
- the latest [CI build](https://github.com/redhat-developer/vscode-redhat-account/actions?query=is%3Asuccess+branch%3Amain) of [vscode-redhat-account](https://github.com/redhat-developer/vscode-redhat-account/)
- the latest [CI build](https://github.com/jlandersen/vscode-kafka/actions/workflows/ci.yml) of [vscode-kafka](https://github.com/jlandersen/vscode-kafka/)

TODO more details...

## Build
In a terminal, run:
```
npm i
npx vsce package
```

Install the generated vscode-rhoas-*.vsix file.

## CI Builds
- Go to the [CI Workflow](https://github.com/redhat-developer/vscode-rhoas/actions?query=branch%3Amain+is%3Asuccess++) page, 
- Click on the latest successful build
- Download and unzip the latest vscode-rhoas artifact
- Install the vscode-rhoas-*.vsix file.

## License
Copyright (c) Red Hat, Inc. All rights reserved.

Licensed under the [MIT](LICENSE.txt) license.