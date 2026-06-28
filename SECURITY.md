# Security Policy

## Supported versions

Node.js 22.12 or newer (see `package.json` `engines`). Only the latest published release line receives security fixes.

## Reporting a vulnerability

Please report suspected security vulnerabilities **privately**. Do **not** open a public GitHub issue for security reports.

Email: security@signalsafe.software

Include a description, reproduction steps, affected versions, and impact if known. We aim to acknowledge reports within five business days.


## Security boundaries

This package provides **React simulator UI and session utilities**. It does not provide routing, backend APIs, or authentication.

- Simulator payloads are treated as **authored/trusted content** unless the host validates them (see shallow validation helpers exported by this package).
- The host application is responsible for validating payloads, controlling learner access, and deciding what error detail is shown to end users.
- Do not expose internal exception details or stack traces to learners unless the host intentionally configures that behavior.
