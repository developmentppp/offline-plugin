'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var path = require('path');
var fs = require('fs');

var modules = ['async-waituntil.js'];

module.exports = function () {};
module.exports.pitch = function pitch(remainingRequest, precedingRequest, data) {
  var _this = this;

  this.cacheable && this.cacheable();

  var callback = this.async();
  var templatePath = path.join(__dirname, 'sw-template.js');
  // var query = loaderUtils.parseQuery(this.query);
  // var params = JSON.parse(query.json);
  var query = new URLSearchParams(this.query.slice(1));
  var params = JSON.parse(query.get("json"));

  // var request = loaderUtils.stringifyRequest(this, remainingRequest);
  var request = JSON.stringify(this.utils.contextify(this.context, remainingRequest));
  var source = 'module.exports = require(' + request + ')';

  var loaders = (params.loaders || []).map(function (loader) {
    var loaderPath = path.join(__dirname, '../loaders', loader + '.js');
    // var loaderRequest = loaderUtils.stringifyRequest(_this, '!!' + loaderPath);
    var loaderRequest = JSON.stringify(_this.utils.contextify(_this.context, '!!' + loaderPath));

    _this.addDependency(loaderPath);

    return JSON.stringify(loader) + ': require(' + loaderRequest + ')';
  });

  var cacheMaps = (params.cacheMaps || []).map(function (map) {
    return '{\n      match: ' + map.match + ',\n      to: ' + map.to + ',\n      requestTypes: ' + JSON.stringify(map.requestTypes) + ',\n    }';
  });

  this.addDependency(templatePath);

  var loadersCode = '{}';

  if (loaders.length) {
    loadersCode = '{\n      ' + loaders.join(',\n') + '\n    }';
  }

  var cacheMapsCode = '[]';

  if (cacheMaps.length) {
    cacheMapsCode = '[\n      ' + cacheMaps.join(',\n') + '\n    ]';
  }

  var navigationPreloadCode = params.navigationPreload;

  var helpersCode = [', {', 'loaders: ' + loadersCode + ',', 'cacheMaps: ' + cacheMapsCode + ',', 'navigationPreload: ' + navigationPreloadCode + ',', '}'];

  Promise.all([].concat(_toConsumableArray(modules.map(function (mod) {
    return readFile(path.join(__dirname, mod));
  })), [readFile(templatePath).then(function (template) {
    template = '\n        ' + template + '\n        WebpackServiceWorker(' + params.data_var_name + helpersCode.join('\n') + ');\n        ' + source + '\n      ';

    return template;
  })])).then(function (all) {
    callback(null, all.join(';'));
  })['catch'](function (err) {
    return callback(err);
  });
};

function readFile(path) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, 'utf-8', function (err, file) {
      if (err) {
        reject(err);
        return;
      }

      resolve(file);
    });
  });
}