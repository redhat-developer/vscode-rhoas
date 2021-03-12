# Red Hat OpenShift Application Services

Contributes `Red Hat OpenShift Streams For Apache Kafka` clusters to [vscode-kafka](https://marketplace.visualstudio.com/items?itemName=jeppeandersen.vscode-kafka).

The Red Hat authentication is provided by [vscode-redhat-account](https://github.com/redhat-developer/vscode-redhat-account).

Requires 
- the latest build of https://github.com/redhat-developer/vscode-redhat-account/
- the latest [CI build](https://github.com/jlandersen/vscode-kafka/actions/workflows/ci.yml) from https://github.com/jlandersen/vscode-kafka/pull/124

TODO more details...

## Build
In a terminal, run:
```
npm i
npx vsce package
```

Install the generated vscode-rhoas-*.vsix file.