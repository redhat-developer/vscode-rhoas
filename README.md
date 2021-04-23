# Red Hat OpenShift Application Services

This is the gateway Visual Studio Code extension for accessing `Red Hat OpenShift Application Services`.

## Red Hat OpenShift Streams For Apache Kafka
Contributes `Red Hat OpenShift Streams For Apache Kafka` clusters to the [Tools for Apache Kafka](https://marketplace.visualstudio.com/items?itemName=jeppeandersen.vscode-kafka) VS Code extension.

Learn more about `Red Hat OpenShift Streams For Apache Kafka` support in the [detailed documentation](doc/kafkaSupport.md).

## Telemetry

With your approval, the `Red Hat OpenShift Application Services` extension collects anonymous [usage data](USAGE_DATA.md) and sends it to Red Hat servers to help improve our products and services.
Read our [privacy statement](https://developers.redhat.com/article/tool-data-collection) to learn more.
This extension respects the `redhat.telemetry.enabled` setting, which you can learn more about at https://github.com/redhat-developer/vscode-commons#how-to-disable-telemetry-reporting

## Build
In a terminal, run:
```
npm install
npx vsce package
```

Install the generated vscode-rhoas-*.vsix file.

## CI Builds
- Go to the [CI Workflow](https://github.com/redhat-developer/vscode-rhoas/actions/workflows/CI.yml?query=branch%3Amain+is%3Asuccess++) page, 
- Click on the latest successful build
- Download and unzip the latest vscode-rhoas artifact
- Install the vscode-rhoas-*.vsix file.

## License
Copyright (c) Red Hat, Inc. All rights reserved.

Licensed under the [MIT](LICENSE.txt) license.