// Run with: node --test tests/*.test.mjs
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

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

const ROOT = fileURLToPath(new URL("..", import.meta.url))

test("resolves the Skills directory from the module, not the working directory", () => {
  const expected = fileURLToPath(new URL("../skills", import.meta.url))
  assert.equal(SKILLS_DIR, expected)
  const entry = new URL("../opencode/index.mjs", import.meta.url).href
  const script = `const { SKILLS_DIR } = await import(${JSON.stringify(entry)}); process.stdout.write(SKILLS_DIR)`
  const elsewhere = path.join(ROOT, "tests")
  assert.equal(execFileSync(process.execPath, ["--input-type=module", "-e", script], { cwd: elsewhere, encoding: "utf8" }), expected)
})

test("the config hook registers into the object the host passes", async () => {
  const hooks = await plugin.server({ client: { app: { log: async () => assert.fail("no warning expected") } } })
  const config = { model: "anthropic/claude-sonnet" }
  await hooks.config(config)
  assert.deepEqual(config.mcp[SERVER_NAME], { type: "local", command: ["tx3-mcp"], enabled: true })
  assert.deepEqual(config.skills.paths, [SKILLS_DIR])
})

test("leaves nested objects shared with another config untouched", () => {
  // The host caches the global config and a deep merge may hand its nested objects
  // to every project config, so a project that loads the plugin must not leak into one that doesn't.
  const global = {
    mcp: { github: { type: "remote", url: "https://example.invalid/mcp" } },
    skills: { paths: ["./global-skills"] },
  }
  const snapshot = structuredClone(global)
  const withPlugin = { mcp: global.mcp, skills: global.skills }
  const withoutPlugin = { mcp: global.mcp, skills: global.skills }
  applyTx3Config(withPlugin)
  assert.deepEqual(global, snapshot)
  assert.deepEqual(withoutPlugin, snapshot)
  assert.deepEqual(withPlugin.skills.paths, ["./global-skills", SKILLS_DIR])
  assert.deepEqual(Object.keys(withPlugin.mcp), ["github", SERVER_NAME])
})

test("applies an enabled-only toggle to the server without warning", () => {
  for (const enabled of [true, false]) {
    const config = { mcp: { [SERVER_NAME]: { enabled } } }
    assert.equal(applyTx3Config(config), undefined)
    assert.deepEqual(config.mcp[SERVER_NAME], { type: "local", command: ["tx3-mcp"], enabled })
    const once = structuredClone(config)
    assert.equal(applyTx3Config(config), undefined)
    assert.deepEqual(config, once)
  }
})

test("the manifest points at the entry point and packs only the allowed files", () => {
  const manifest = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"))
  const entry = "./opencode/index.mjs"
  assert.equal(manifest.main, entry)
  assert.deepEqual(manifest.exports, { ".": entry, "./server": entry })
  assert.ok(existsSync(path.join(ROOT, entry)))
  for (const key of ["scripts", "workspaces", "publishConfig", "bundleDependencies", "bundledDependencies"]) {
    assert.equal(manifest[key], undefined, key)
  }

  const tracked = execFileSync("git", ["ls-files", "skills/tx3-language", "skills/tx3-project"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
  assert.ok(tracked.includes("skills/tx3-language/SKILL.md") && tracked.includes("skills/tx3-project/SKILL.md"))
  // npm always packs README.md; it becomes the package page.
  const allowed = ["LICENSE", "README.md", "package.json", "opencode/index.mjs", ...tracked].sort()
  const [pack] = JSON.parse(execFileSync("npm", ["pack", "--dry-run", "--json"], { cwd: ROOT, encoding: "utf8" }))
  assert.deepEqual(pack.files.map((f) => f.path).sort(), allowed)
})
