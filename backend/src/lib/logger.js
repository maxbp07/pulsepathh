/**
 * Logging estructurado ligero (JSON a stdout).
 */
export function log(level, message, fields = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const logger = {
  info: (message, fields) => log('info', message, fields),
  warn: (message, fields) => log('warn', message, fields),
  error: (message, fields) => log('error', message, fields),
};

export function requestIdMiddleware(req, res, next) {
  req.requestId = req.headers['x-request-id'] ?? crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
