var ProxyServer = require("./proxyServer.js");
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('death', function(worker) {
    console.log('worker ' + worker.pid + ' died');
  });
} else {
  var proxy = new ProxyServer.Server(8000);
  //proxy.addRoute('missguided.nodeploy.it','www.missguided.co.uk');
  //proxy.addRoute('boohoo.nodeploy.it','www.boohoo.com');
}
