
var redis_host = 'REDISHOST'; //TODO: move to config file

var redis     = require("redis"),
    http      = require('http'),
    httpProxy = require('http-proxy');
    ProxyRouter = require('./proxyRouter.js');
    proxy = httpProxy.createProxyServer({}),
    url = require('url');



var proxyRouter = new ProxyRouter.ProxyRouter({
  backend: redis.createClient({host:redis_host}),
  cache_ttl: 5
});


//Test routes and servers
console.log('adding test routes');
var redisClient = redis.createClient({host:redis_host});
console.log('adding test1.nodeploy.it');
redisClient.hset('routes','test1.nodeploy.it','127.0.0.1:9001');
http.createServer(function(req, res) {
    res.end("Hello world from test1 running on 127.0.0.1:9001");
}).listen(9001);

console.log('adding test2.nodeploy.it');
redisClient.hset('routes','test2.nodeploy.it','127.0.0.1:9002');
http.createServer(function(req, res) {
    res.end("Hello world from test2 running on 127.0.0.1:9002");
}).listen(9002);


//proxy server
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
}).listen(8000, function() {
    console.log('proxy listening on port 8000');
});
