// OpenCode plugin for Tx3: registers the local tx3-mcp server and the packaged
// tx3-language and tx3-project Skills through the v1 `config` hook.
import path from "node:path"
import { fileURLToPath } from "node:url"

export const SERVER_NAME = "tx3"
export const SKILLS_DIR = fileURLToPath(new URL("../skills", import.meta.url))

const SERVER = Object.freeze({ type: "local", command: ["tx3-mcp"], enabled: true })

function isTx3Mcp(entry) {
  return (
    entry?.type === "local" &&
    Array.isArray(entry.command) &&
    typeof entry.command[0] === "string" &&
    path.basename(entry.command[0]) === "tx3-mcp"
  )
}

/**
 * Add the tx3 MCP server and the Skills directory to an OpenCode config.
 * Nested objects are replaced, never changed in place, because the host may share
 * them with its cached global config. Existing entries are kept, a `{enabled}`-only
 * toggle is applied to the server, and repeated calls leave the config unchanged.
 * Returns a warning when another server already owns the `tx3` name, else undefined.
 */
export function applyTx3Config(config) {
  const paths = config.skills?.paths ?? []
  if (!paths.includes(SKILLS_DIR)) config.skills = { ...config.skills, paths: [...paths, SKILLS_DIR] }

  const existing = config.mcp?.[SERVER_NAME]
  if (existing?.type === undefined) {
    const server = { ...SERVER, command: [...SERVER.command], ...existing }
    config.mcp = { ...config.mcp, [SERVER_NAME]: server }
    return
  }
  if (isTx3Mcp(existing)) return
  return (
    `opencode-tx3: MCP server "${SERVER_NAME}" is already configured and does not run tx3-mcp, ` +
    `so the Tx3 tools were not registered. Remove or rename "mcp.${SERVER_NAME}" in your ` +
    `opencode config, or point it at {"type":"local","command":["tx3-mcp"]}.`
  )
}

async function warn(client, message) {
  try {
    await client.app.log({ body: { service: "opencode-tx3", level: "warn", message } })
  } catch {
    console.warn(message)
  }
}

export default {
  id: "opencode-tx3",
  server: async ({ client }) => ({
    config: async (config) => {
      const message = applyTx3Config(config)
      if (message) await warn(client, message)
    },
  }),
}
