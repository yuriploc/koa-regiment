const cluster = require('cluster');

function gracefullyDie(server, reason) {
  process.send({
    cmd: 'need_replacement',
    workerId: cluster.worker.id,
    reason
  });
}

module.exports = {
  RequestCount: function(maxRequests) {
    let requestCount = 0;
    let dying = false;

    return function(ctx, next) {
      requestCount = requestCount + 1;

      if (!dying && requestCount >= maxRequests) {
        dying = true;
        gracefullyDie(ctx.socket.server, `Request count limit of ${maxRequests} reached!`);
      }

      next();
    };
  },

  MemoryFootprint: function(maxRssMb) {
    let dying = false;

    return async function memoryFootprint(ctx, next) {
      const currentRss = process.memoryUsage().rss / (1024 * 1024);

      if (!dying && currentRss >= maxRssMb) {
        dying = true;
        gracefullyDie(ctx.socket.server, `Memory footprimit limit of ${maxRssMb} reached!`);
      }

      await next();
    }
  }
}
