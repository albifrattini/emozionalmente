"use strict";var precacheConfig=[["/index.html","a058cb27bcfd2feb4d6e7f8e30576e7c"],["/static/css/main.53bd5c40.css","27f21f414eda8bf78c97157b3ca3a8ab"],["/static/js/main.bc7e6cd2.js","6c7c2fa7b98fb44bf10fff3b59055cc4"],["/static/media/anger.16413f34.png","16413f347c3ebab5f9cc5409d0863cff"],["/static/media/disgust.43df42b1.png","43df42b1c6ab4958ac07a38963bea2af"],["/static/media/fear.f0030822.png","f0030822768ac1ae5fab84778297b2a3"],["/static/media/first.eecb2991.png","eecb299171a21a55ecc28499e9fcc139"],["/static/media/happiness.51702b7a.png","51702b7a20211d746a50667a5682b8ce"],["/static/media/logo.f927d4f6.png","f927d4f66ccf4151c8840219b8f519bc"],["/static/media/polimi-logo.d18148ee.png","d18148ee4ff35ded54a70c3c67c576dc"],["/static/media/prova.8269eaeb.png","8269eaeb13b9fde033de4691f1a6dae8"],["/static/media/sadness.965d75f2.png","965d75f29e7453bb64739bdd19707545"],["/static/media/second.601e1ca3.png","601e1ca3d9823e9caefa1723e0d30ad7"],["/static/media/surprise.b24a1c8f.png","b24a1c8fa63633627d0064532ae3592c"],["/static/media/third.2023be19.png","2023be19cdc3c7c77d84414954c48e75"]],cacheName="sw-precache-v3-sw-precache-webpack-plugin-"+(self.registration?self.registration.scope:""),ignoreUrlParametersMatching=[/^utm_/],addDirectoryIndex=function(e,t){var n=new URL(e);return"/"===n.pathname.slice(-1)&&(n.pathname+=t),n.toString()},cleanResponse=function(t){return t.redirected?("body"in t?Promise.resolve(t.body):t.blob()).then(function(e){return new Response(e,{headers:t.headers,status:t.status,statusText:t.statusText})}):Promise.resolve(t)},createCacheKey=function(e,t,n,a){var r=new URL(e);return a&&r.pathname.match(a)||(r.search+=(r.search?"&":"")+encodeURIComponent(t)+"="+encodeURIComponent(n)),r.toString()},isPathWhitelisted=function(e,t){if(0===e.length)return!0;var n=new URL(t).pathname;return e.some(function(e){return n.match(e)})},stripIgnoredUrlParameters=function(e,n){var t=new URL(e);return t.hash="",t.search=t.search.slice(1).split("&").map(function(e){return e.split("=")}).filter(function(t){return n.every(function(e){return!e.test(t[0])})}).map(function(e){return e.join("=")}).join("&"),t.toString()},hashParamName="_sw-precache",urlsToCacheKeys=new Map(precacheConfig.map(function(e){var t=e[0],n=e[1],a=new URL(t,self.location),r=createCacheKey(a,hashParamName,n,/\.\w{8}\./);return[a.toString(),r]}));function setOfCachedUrls(e){return e.keys().then(function(e){return e.map(function(e){return e.url})}).then(function(e){return new Set(e)})}self.addEventListener("install",function(e){e.waitUntil(caches.open(cacheName).then(function(a){return setOfCachedUrls(a).then(function(n){return Promise.all(Array.from(urlsToCacheKeys.values()).map(function(t){if(!n.has(t)){var e=new Request(t,{credentials:"same-origin"});return fetch(e).then(function(e){if(!e.ok)throw new Error("Request for "+t+" returned a response with status "+e.status);return cleanResponse(e).then(function(e){return a.put(t,e)})})}}))})}).then(function(){return self.skipWaiting()}))}),self.addEventListener("activate",function(e){var n=new Set(urlsToCacheKeys.values());e.waitUntil(caches.open(cacheName).then(function(t){return t.keys().then(function(e){return Promise.all(e.map(function(e){if(!n.has(e.url))return t.delete(e)}))})}).then(function(){return self.clients.claim()}))}),self.addEventListener("fetch",function(t){if("GET"===t.request.method){var e,n=stripIgnoredUrlParameters(t.request.url,ignoreUrlParametersMatching),a="index.html";(e=urlsToCacheKeys.has(n))||(n=addDirectoryIndex(n,a),e=urlsToCacheKeys.has(n));var r="/index.html";!e&&"navigate"===t.request.mode&&isPathWhitelisted(["^(?!\\/__).*"],t.request.url)&&(n=new URL(r,self.location).toString(),e=urlsToCacheKeys.has(n)),e&&t.respondWith(caches.open(cacheName).then(function(e){return e.match(urlsToCacheKeys.get(n)).then(function(e){if(e)return e;throw Error("The cached response that was expected is missing.")})}).catch(function(e){return console.warn('Couldn\'t serve response for "%s" from cache: %O',t.request.url,e),fetch(t.request)}))}});