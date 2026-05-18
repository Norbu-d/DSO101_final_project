# ─────────────────────────────────────────────────
# Stage 1 — Install dependencies
# ─────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first (better layer caching)
COPY package.json package-lock.json ./

# Clean install — matches package-lock.json exactly
RUN npm ci

# ─────────────────────────────────────────────────
# Stage 2 — Build the Next.js app
# ─────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Bring in installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the source code
COPY . .

# Supabase env vars are public (NEXT_PUBLIC_*) so they
# must be present at BUILD time for Next.js to embed them
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build — requires output: 'standalone' in next.config.ts
RUN npm run build

# ─────────────────────────────────────────────────
# Stage 3 — Lean production image
# ─────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy only what's needed to run the app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# next start is handled by the standalone server.js
CMD ["node", "server.js"]