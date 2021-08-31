# Agent Centric Prototyping Service

Barebones server to use for agent-centric app prototyping that after maturation
can be progressively adapted to use more advanced protocols such as Holochain,
Secure Scuttlebutt, IPFS, etc.

## Characteristics

- **Agent-Centric:** This means that each participant has their own Document, that holds
  all their data. This also means that if you wish to participate *as a group* with other
  people, you would also have your own group-Document. Identify with a simple secret passphrase.
- **Public:** This means that all the data stored is open to be seen by anyone;
  there are no secret information silos. Encrypt it yourself if you want. It also means that
  it's a public utility, like a park or a beach; maintained by individuals, enjoyed by everyone.
- **Mutable:** This means that the data stored is mutable and we don't maintain a copy. Treat
  the data as ephemeral. Back it up yourself if you want.
- **:** All the resources are available for everyone to use, so we don't need
  to rely on Firebase or some other SASS service, we can all use a single server. This encurages to collaborate with other pilot projects.

## Responsibilities

- ✔ Be online and accessible from any website
- ✔ Optional authentication with a passphrase
- ✔ Store agents data
- ✔ Serve all agents data
- Serve agents data based on query
- Validate data storage according to agreements
- Store blobs on IPFS and serve them or use a pinning service
- Enforce limit on agent records size
- ✔ Playground panel to explore the all the service functionalities

## Usage

Public URL: https://agent-centric-prototyping-service.zequez.space

That is running on a Digital Ocean US$ 5 / month droplet.

All the deployment and everything is all handmade.

The server does not have any security policies to prevent abuse yet; so it's likely you could easily break it; if you figure out how to break it, create an issue.

So far there is no database, every participant data is stored on the filesystem as
an independent file.

### Start development server

The app build for [Deno](https://deno.land/). Follow instructions there to have it installed.

We use [Denon](https://deno.land/x/denon) for running scripts. Follow instructions there to install it.

```bash
denon dev
```

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
