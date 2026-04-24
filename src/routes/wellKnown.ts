import { Router } from "express";

const router = Router();

/**
 * RFC 9727 API Catalog
 */
router.get("/api-catalog", (req, res) => {
  res.setHeader("Content-Type", "application/linkset+json");
  res.json({
    linkset: [
      {
        anchor: "https://giavang365.io.vn/v1/gold-prices",
        "service-desc": [
          {
            href: "https://giavang365.io.vn/docs-json",
            type: "application/openapi+json;version=3.1",
          },
        ],
        "service-doc": [
          {
            href: "https://giavang365.io.vn/docs",
            type: "text/html",
          },
        ],
        status: [
          {
            href: "https://giavang365.io.vn/health",
            type: "application/json",
          },
        ],
      },
    ],
  });
});

/**
 * OAuth Discovery
 */
router.get("/openid-configuration", (req, res) => {
  res.json({
    issuer: "https://giavang365.io.vn",
    authorization_endpoint: "https://giavang365.io.vn/oauth/authorize",
    token_endpoint: "https://giavang365.io.vn/oauth/token",
    jwks_uri: "https://giavang365.io.vn/.well-known/jwks.json",
    grant_types_supported: ["authorization_code", "refresh_token", "client_credentials"],
    response_types_supported: ["code"],
    scopes_supported: ["openid", "profile", "email", "api:read"],
  });
});

/**
 * OAuth Protected Resource Metadata
 */
router.get("/oauth-protected-resource", (req, res) => {
  res.json({
    resource: "https://giavang365.io.vn/v1/gold-prices",
    authorization_servers: ["https://giavang365.io.vn"],
    scopes_supported: ["api:read"],
  });
});

/**
 * MCP Server Card
 */
router.get("/mcp/server-card.json", (req, res) => {
  res.json({
    serverInfo: {
      name: "Vietnamese Gold Price API",
      version: "1.0.0",
    },
    transport: {
      type: "http",
      endpoint: "https://giavang365.io.vn/v1/gold-prices",
    },
    capabilities: {
      tools: true,
      resources: true,
    },
  });
});

/**
 * Agent Skills Index
 */
router.get("/agent-skills/index.json", (req, res) => {
  res.json({
    $schema: "https://agentskills.io/v0.2.0/schema.json",
    skills: [
      {
        name: "gold-price-lookup",
        type: "tool",
        description: "Fetch current and historical Vietnamese gold prices from DOJI",
        url: "https://giavang365.io.vn/v1/gold-prices",
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // Placeholder
      },
    ],
  });
});

export default router;
