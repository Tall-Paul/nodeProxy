
var ProxyRouter = function(options) {



  if (!options.backend) {
    throw "ProxyRouter backend required. Please provide options.backend parameter!";
  }

  this.backend   = options.backend;
  this.cache_ttl = (options.cache_ttl || 10) * 1000;
  this.cache     = {};

  console.log("ProxyRouter cache TTL is set to " + this.cache_ttl + " ms.");
};

ProxyRouter.prototype.lookup = function(hostname, callback) {
  hostname = hostname.split('.')[0];
  console.log(hostname);
  var self = this;
  if (!this.cache[hostname]) {
    this.backend.hget('routes', hostname, function(err, data) {
      if (data) {
        // Lookup route
        var target = data;
        self.cache[hostname] = target;
        self.expire_route(hostname, self.cache_ttl);

        // Return target
        callback(target);
      }
      else {
        callback(null);
      }
    });
  }
  else {
    callback(this.cache[hostname]);
  }
};

ProxyRouter.prototype.flush = function() {
  this.cache = {};
};

ProxyRouter.prototype.flush_route = function(hostname) {
  delete(this.cache[hostname]);
};

ProxyRouter.prototype.expire_route = function(hostname, ttl) {
  var self = this;
  setTimeout(function() {
    self.flush_route(hostname);
  }, ttl);
};

exports.ProxyRouter = ProxyRouter;
