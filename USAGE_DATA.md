# Data collection

`Red Hat OpenShift Application Services` has opt-in telemetry collection, provided by [`Red Hat Commons`](https://github.com/redhat-developer/vscode-commons).

## What's included in the `Red Hat OpenShift Application Services` telemetry data

 * A telemetry event is sent every time new Kafka clusters have been added
    - includes the number of added clusters
 * A telemetry event is sent every time the "Red Hat OpenShift Streams for Apache Kafka" dashboard is opened, via the command palette or clicking on a button
    - includes the reason why it was opened
 * A telemetry event is sent every time an error occurred while fetching Kafka clusters.

## What's included in the general telemetry data

Please see the
[`Red Hat Commons` data collection information](https://github.com/redhat-developer/vscode-commons/blob/master/USAGE_DATA.md#other-extensions)
for information on what data it collects.

## How to opt in or out

Use the `redhat.telemetry.enabled` setting in order to enable or disable telemetry collection.