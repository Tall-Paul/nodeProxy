
var redis     = require("redis"),
    http      = require('http'),
    path = require('path'),
    httpProxy = require('http-proxy'),
    ProxyRouter = require('./proxyRouter.js'),
    connect = require('connect'),
    url = require('url'),
    fs = require('fs');

    var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"};

    //setup
    config = JSON.parse(fs.readFileSync("./config.json"));
    redis_host = config.redis_server;
    redisClient = redis.createClient({host:redis_host});
    for (var route in config.routes){
      console.log('adding '+route);
      redisClient.hset('routes',route,config.routes[route]);
    }
    proxy = httpProxy.createProxyServer({changeOrigin : true}),
    proxyRouter = new ProxyRouter.ProxyRouter({
      backend: redisClient,
      cache_ttl: 5
    });
    var app = connect();

    allow_frames = config.allow_frames;
    inject_files = config.inject_files;

    if (inject_files == true){
      console.log('file injection is enabled');
      var files = fs.readdirSync('./static/');
      var injection = '';
      for (var file in files){
        var ext = files[file].split(".")[1];
        var filepath = '/static/'+files[file];
        if (ext = 'css'){
          injection += '<link rel="stylesheet" type="text/css" href="'+filepath+'">';
          injection += '</link>';
        }
        if (ext = 'js'){
          injection += '<script src="'+filepath+'">';
          injection += '</script>';
        }
      }
      var selects = [];
      var simpleselect = {};

      simpleselect.query = 'head';
      simpleselect.func = function (node) {
      	var rs = node.createReadStream();
      	var ws = node.createWriteStream({outer: false});
      	rs.pipe(ws, {end: false});
      	rs.on('end', function(){
      		ws.end(injection);
      	});
      }
      selects.push(simpleselect);
      app.use(require("harmon")([], selects, true));
    } else {
      console.log('file injection is disabled');
    }

    if (allow_frames == true){
      console.log('frame security breaking is enabled');
      //remove frame deny headers
      proxy.on('proxyReq', function(proxyReq, req, res, options) {
        res.oldWriteHead = res.writeHead;
        res.writeHead = function(statusCode, headers) {
          res.removeHeader('X-Frame-Options');
          res.removeHeader('content-security-policy', '');
          res.oldWriteHead(statusCode, headers);
        }
      });
    } else {
      console.log('frame security breaking is not enabled');
    }

    app.use(function (req, res) {
      var hostname = req.headers.host.split(":")[0];
      var pathname = url.parse(req.url).pathname;
      var filename = path.join(process.cwd(), pathname);
      if (pathname.includes('/static/')){
        fs.exists(filename, function(exists) {
            if(!exists) {
                console.log("not exists: " + filename);
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.write('404 Not Found\n');
                res.end();
                return;
            }
            var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
            res.writeHead(200, mimeType);
            var fileStream = fs.createReadStream(filename);
            fileStream.pipe(res);
          }); //end path.exists
      } else {
        proxyRouter.lookup(hostname, function(route) {
            if (route) {
              proxy.web(req, res, { target: route});
            } else {
              try {
                res.writeHead(404);
                res.end("No route found");
              }
              catch (er) {
                console.error("res.writeHead/res.end error: %s", er.message);
              }
            }
        });
     }
    });




  var ProxyServer = function(port){
    http.createServer(app).listen(port);
  };

  ProxyServer.prototype.addRoute = function(source,target,testport){
    redisClient.hset('routes',source,target);
  };


exports.Server = ProxyServer;
