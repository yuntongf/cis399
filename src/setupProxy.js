const { createProxyMiddleware } = require("http-proxy-middleware");
module.exports = (app) => {
  app.use(
    createProxyMiddleware("/data/records", {
      target: "http://ext-server.com",
      changeOrigin: true,
    })
  );
};
