
var redis     = require("redis"),
    http      = require('http'),
    httpProxy = require('http-proxy');
    ProxyRouter = require('./proxyRouter.js');
    proxy = httpProxy.createProxyServer({}),
    url = require('url'),
    fs = require('fs');


  var ProxyServer = function(port){
    var config = JSON.parse(fs.readFileSync("./config.json"));
    this.redis_host = config.redis_server;
    this.redisClient = redis.createClient({host:this.redis_host});

    var proxyRouter = new ProxyRouter.ProxyRouter({
      backend: this.redisClient,
      cache_ttl: 5
    });

    http.createServer(function(req, res) {
        var hostname = req.headers.host.split(":")[0];
        var pathname = url.parse(req.url).pathname;

        console.log(hostname);
        console.log(pathname);

        proxyRouter.lookup(hostname, function(route) {
            if (route) {
              console.log('routing '+hostname+' to ' + 'http://'+route.host+':'+route.port);
              proxy.web(req, res, { target: 'http://'+route.host+':'+route.port });
            } else {
              console.log('no route');
              try {
                res.writeHead(404);
                res.end("No route found");
              }
              catch (er) {
                console.error("res.writeHead/res.end error: %s", er.message);
              }
            }
        });
    }).listen(port, function() {
        console.log('proxy listening on port '+port);
    });
  };

  ProxyServer.prototype.addRoute = function(source,target,testport){
    this.redisClient.hset('routes',source,target);
    if (testport != false){
      http.createServer(function(req, res) {
          res.end("Hello world from test1 running on "+testport);
      }).listen(testport);
    }
  };


exports.Server = ProxyServer;
