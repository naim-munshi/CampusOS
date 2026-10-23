# Security policy

## Scope

CampusOS is a static, local-first application without accounts or servers. Data is stored unencrypted in the browser and can be exported to JSON. This application is **not** suitable for sensitive, regulated or confidential data.

## Reporting

To report a security issue, use GitHub's private vulnerability reporting feature if available. Otherwise contact the repository maintainer privately. Please do not post proof-of-concept exploits or private data in public issues.

When reporting, include affected code paths, steps to reproduce, expected and actual behavior and the browser version.

## Supported versions

The latest version on the `main` branch is the only version intended to receive security corrections. No security response time or formal SLA is promised.

## Security controls

The UI uses safe text rendering, bounded schema normalization, a restrictive CSP and a calculator parser that never executes dynamic code. Import validation and confirmation reduce accidental overwrite risk. These measures **do not** encrypt localStorage or protect an unlocked browser profile.
