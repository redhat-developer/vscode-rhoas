# Red Hat OpenShift Application Services

Contributes `Red Hat OpenShift Streams For Apache Kafka` clusters to [vscode-kafka](https://marketplace.visualstudio.com/items?itemName=jeppeandersen.vscode-kafka).

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
- Go to [vscode-rhoas Gitlab pipelines page](https://gitlab.cee.redhat.com/beaverama/vscode-rhoas/-/pipelines?page=1&scope=all&status=success&ref=main), 
- download and unzip the latest artifact
- Install the vscode-rhoas-*.vsix file.