# Agent Centric Prototyping Service

Barebones server to use for agent-centric app prototyping that will likely be
migrated to a decentralized infrastructure such as Holochain, SSB, IPFS,
Secure Scuttlebutt or whatever ends up being the most convenient.

## Responsibilities

- Be online and accessible from any website
- ✔ Optional authentication with a passphrase
- ✔ Store agents data
- ✔ Serve all agents data
- Serve agents data based on query
- Validate data storage according to agreements
- Store blobs on IPFS and serve them
- Enforce limit on agent records size
- Playground panel to explore the all the service functionalities

## Usage

Public URL: https://agent-centric-prototyping-service.zequez.space


### GET /participants

Returns the whole dataset as JSON

### GET /participants/:agentName

Returns whole agent data as JSON

### POST /participants/:agentName

Saves whole agent data from JSON-encoded body.
Can be used Authorization

### DELETE /participants/:agentName

Deletes agent
Can be used with Authorization

### Authorization

Authorization is not obligatory; by default anyone can save any agent data unless
that agent has set a passphrase; which is stored on the server as a SHA3-512 hashed string.

Use header `Authorization: Basic <B64_encoded_passphrase>` when submitting agent data
and it will save the passphrase. Next time that agent data is submitted, the same
authorization passphrase must be used or the request will be rejected.

### Security

This is intended for prototyping and is untested code without any security guarantees.
