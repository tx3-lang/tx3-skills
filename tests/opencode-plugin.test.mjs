// Run with: node --test tests/*.test.mjs
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import path from "node:path"
import { test } from "node:test"

import plugin, { applyTx3Config, SERVER_NAME, SKILLS_DIR } from "../opencode/index.mjs"

test("registers the local server and the packaged Skills directory", () => {
  const config = {}
  assert.equal(applyTx3Config(config), undefined)
  assert.deepEqual(config.mcp[SERVER_NAME], { type: "local", command: ["tx3-mcp"], enabled: true })
  assert.deepEqual(config.skills.paths, [SKILLS_DIR])
  assert.ok(path.isAbsolute(SKILLS_DIR))
  for (const skill of ["tx3-language", "tx3-project"]) {
    assert.ok(existsSync(path.join(SKILLS_DIR, skill, "SKILL.md")), skill)
  }
})

test("preserves existing config and is stable across repeated loads", () => {
  const config = {
    model: "anthropic/claude-sonnet",
    mcp: { other: { type: "remote", url: "https://example.invalid/mcp" } },
    skills: { paths: ["./my-skills"], urls: ["https://example.invalid/skills"] },
  }
  applyTx3Config(config)
  const once = structuredClone(config)
  applyTx3Config(config)
  applyTx3Config(config)
  assert.deepEqual(config, once)
  assert.equal(config.model, "anthropic/claude-sonnet")
  assert.deepEqual(config.mcp.other, { type: "remote", url: "https://example.invalid/mcp" })
  assert.deepEqual(config.skills.paths, ["./my-skills", SKILLS_DIR])
  assert.deepEqual(config.skills.urls, ["https://example.invalid/skills"])
})

test("keeps a user's own tx3-mcp entry without warning", () => {
  const own = { type: "local", command: ["/opt/tx3/bin/tx3-mcp"], environment: { RUST_LOG: "info" } }
  const config = { mcp: { [SERVER_NAME]: own } }
  assert.equal(applyTx3Config(config), undefined)
  assert.equal(config.mcp[SERVER_NAME], own)
})

test("reports an actionable conflict when another server owns the name", () => {
  const foreign = { type: "remote", url: "https://example.invalid/tx3" }
  const config = { mcp: { [SERVER_NAME]: foreign } }
  const message = applyTx3Config(config)
  assert.match(message, /already configured/)
  assert.match(message, /mcp\.tx3/)
  assert.equal(config.mcp[SERVER_NAME], foreign)
  assert.deepEqual(config.skills.paths, [SKILLS_DIR])
})

test("exposes a v1 server plugin whose config hook logs conflicts", async () => {
  assert.equal(plugin.id, "opencode-tx3")
  const logged = []
  const client = { app: { log: async ({ body }) => logged.push(body) } }
  const hooks = await plugin.server({ client })
  await hooks.config({ mcp: { [SERVER_NAME]: { type: "local", command: ["other-server"] } } })
  assert.equal(logged.length, 1)
  assert.equal(logged[0].level, "warn")
  assert.equal(logged[0].service, "opencode-tx3")
})
