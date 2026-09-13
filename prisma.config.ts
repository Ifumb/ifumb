import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

config({ path: ['.env.local', '.env'], quiet: true })

// reason: prisma's `env()` helper throws when the variable is missing, which breaks
// `prisma generate` (postinstall) on machines without secrets such as CI or a fresh clone.
// Only CLI commands that reach the database need the URL, and they fail explicitly without it.
const directUrl = process.env.DIRECT_URL

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  ...(directUrl ? { datasource: { url: directUrl } } : {}),
})
