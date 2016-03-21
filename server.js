
var ProxyServer = require("./proxyServer.js");

var proxy = new ProxyServer.Server(8000);

//Test routes and servers
console.log('adding test routes');
console.log('adding test1.nodeploy.it');
proxy.addRoute('test1.nodeploy.it','127.0.0.1:9001','9001');

console.log('adding test2.nodeploy.it');
proxy.addRoute('test2.nodeploy.it','127.0.0.1:9002','9002');
