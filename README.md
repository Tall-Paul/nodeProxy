Node.js dynamic proxy server.

Store routes in a redis hash, change them on the fly and the proxy server routes traffic accordingly.  

Also features:

store routes in a config.json file for initial population on bootup

inject any js or css file into proxied sites

strip X-Frame-Content headers so proxied sites will load in iframes

uses node clustering for multi-processor systems
