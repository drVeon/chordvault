const express = require('express');
const helmet = require('helmet');
const { errorHandler } = require('./errors');
const { LIMITS } = require('./constants');

/** The request pipeline shared by the server and the route tests; `mount` adds the routes. */
function createApp(mount) {
  const app = express();
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        connectSrc: ["'self'"],
        frameSrc: ["'self'", "https://challenges.cloudflare.com"],
      }
    }
  }));
  // Number of reverse proxies in front of the app, so req.ip (used for rate
  // limiting) is the real client and not the innermost proxy.
  // e.g. 2 for Cloudflare Tunnel -> Traefik -> app.
  const trustProxy = Number.parseInt(process.env.TRUST_PROXY ?? '1', 10);
  app.set('trust proxy', Number.isNaN(trustProxy) ? 1 : trustProxy);
  app.use(express.json({ limit: LIMITS.MAX_BODY_JSON }));
  mount(app);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
