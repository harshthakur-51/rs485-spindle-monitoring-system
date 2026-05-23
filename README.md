# RS-485 Spindle Monitoring System

A browser-based industrial monitoring simulation for a textile spindle floor:
`10,608` gear spindles distributed across `48` RS-485 nodes. It presents line
availability, breakage alarms, acknowledgement latency, segment status, and
downtime events in a compact operator interface.

This public implementation demonstrates the system architecture and monitoring
workflow without exposing client hardware files or production data.

## Open

Open `index.html` directly in a browser. No installation or build step is
required.

For a local HTTP preview:

```bash
python -m http.server 4173
```

## Simulation design

- 48 distributed controller nodes, each representing 221 spindles.
- Event stream generates spindle-break alerts and recovery acknowledgements.
- Latency values are modeled under a 300 ms alarm delivery target.
- Segment view surfaces node status and aggregate load.
- Trend view maintains a rolling operational history.

## Possible firmware integration

The UI event contract is designed for replacement with gateway data:

```json
{
  "node": "N-17",
  "event": "BREAK",
  "spindle": 3714,
  "latencyMs": 172,
  "timestamp": "2026-05-23T11:04:12Z"
}
```

An ESP32, Raspberry Pi, or industrial gateway can publish this shape over a
serial bridge or WebSocket transport.
