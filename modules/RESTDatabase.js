/*
HYPERTOPIC - Infrastructure for community-driven knowledge organization systems

OFFICIAL WEB SITE
http://www.hypertopic.org/

Copyright (C) 2010 Chao ZHOU, Aurelien Benel.

LEGAL ISSUES
This library is free software; you can redistribute it and/or modify it under
the terms of the GNU Lesser General Public License as published by the Free 
Software Foundation, either version 3 of the license, or (at your option) any
later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details:
http://www.gnu.org/licenses/lgpl.html
*/
let EXPORTED_SYMBOLS = ["RESTDatabase"];

const Exception = Components.Exception;
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const include = Cu.import;

include("resource://lasuli/modules/log4moz.js");
include("resource://lasuli/modules/XMLHttpRequest.js");
include("resource://lasuli/modules/Services.js");
include("resource://lasuli/modules/Sync.js");

/*
* Recursively merge properties of two objects 
*/
function MergeRecursive(obj1, obj2) {
  for (var p in obj2)
    try 
    {
      // Property in destination object set; update its value.
      if ( obj2[p].constructor==Object )
        obj1[p] = MergeRecursive(obj1[p], obj2[p]);
      else
        obj1[p] = obj2[p];
    }
    catch(e) 
    {
      obj1[p] = obj2[p]; // Property in destination object not set; create it and set its value.
    }
  return obj1;
}

/**
 * Set a timer, simulating the API for the window.setTimeout call.
 * This only simulates the API for the version of the call that accepts
 * a function as its first argument and no additional parameters,
 * and it doesn't return the timeout ID.
 *
 * @param func {Function}
 *        the function to call after the delay
 * @param delay {Number}
 *        the number of milliseconds to wait
 */
function setTimeout(func, delay) {
  // Copy from Sync.js
  let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  let callback = {
    notify: function notify() {
      // This line actually just keeps a reference to timer (prevent GC)
      timer = null;

      // Call the function so that "this" is global
      func();
    }
  }
  timer.initWithCallback(callback, delay, Ci.nsITimer.TYPE_ONE_SHOT);
}

/**
 * @param baseURL The database URL.
 *                example: http://127.0.0.1:5984/test/
 */
var RESTDatabase = {
  cache : null,
  baseUrl : null,
  xhr : null,
  
  init : function(baseUrl)
  {
    let logger = Log4Moz.repository.getLogger("RESTDatabase");
    this.cache = {};
    let regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    if(!baseUrl || baseUrl === "" || !regexp.test(baseUrl))
    {
      logger.fatal("BaseUrl is not validate:" + baseUrl);
      throw URIError('baseUrl is not vaildate!');
    }
    baseUrl = (baseUrl.substr(-1) == "/") ? baseUrl : baseUrl + "/";
    logger.info("BaseUrl is:" + baseUrl);
    this.baseUrl = baseUrl;
    this.xhr = new XMLHttpRequest();
    this.xhr.overrideMimeType('application/json');
    //setTimeout(CouchDBListen, 2000);
  },
  
  /**
   * @param object null if method is GET or DELETE
   * @return response body
   */
  _send : function(httpAction, httpUrl, httpBody)
  {
    let logger = Log4Moz.repository.getLogger("RESTDatabase._send");
    httpAction = (httpAction) ? httpAction : "GET";
    httpUrl = (httpUrl) ? httpUrl : this.baseUrl;
  
    httpBody = (!httpBody) ? "" : ((typeof(httpBody) == "object") ? JSON.stringify(httpBody) : httpBody);
    let result = null;
  
    try{
      this.xhr.open(httpAction, httpUrl, false);
      if(httpBody && httpBody != '')
        this.xhr.setRequestHeader('Content-Type', 'application/json');

      if(typeof(httpBody) != 'string')
        httpBody = JSON.stringify(httpBody);

      this.xhr.send(httpBody);
      
      if((this.xhr.status + "").substr(0,1) != '2')
      {
        logger.info(this.xhr.status);
        throw Exception('error');
      }
      result = this.xhr.responseText;
    }
    catch(e)
    {
      logger.error("Ajax Error, xhr.status: " + this.xhr.status + " " + this.xhr.statusText + ". \nRequest:\n" + httpAction + " " + httpUrl + "\n" + httpBody);
      throw Exception('Error! ' + httpAction + ' ' + httpUrl);
    }
    return JSON.parse(result);
  },
  
  
  /**
   * @param object The object to create on the server.
   *               It is updated with an _id (and a _rev if the server features
   *               conflict management).
   */
  httpPost : function(object) {
    let logger = Log4Moz.repository.getLogger("RESTDatabase.post");
    let body;
    try{
      body = this._send("POST", this.baseUrl, object);
      if(!body || !body.ok)
        throw Exception(JSON.stringify(body));
    }
    catch(e)
    {
      logger.error(object);
      logger.error(e);
      throw e;
    }
    
    object._id = body.id;
    if (body.rev)
      object._rev = body.rev;
    return object;
  },

  /**
   * Notice: In-memory parser not suited to long payload.
   * @param query the path to get the view from the baseURL 
   * @return if the queried object was like
   * {rows:[ {key:[key0, key1], value:{attribute0:value0}},
   * {key:[key0, key1], value:{attribute0:value1}}]}
   * then the returned object is
   * {key0:{key1:{attribute0:[value0, value1...]}}}
   * otherwise the original object is returned.
   */
  httpGet : function(query) {
    let logger = Log4Moz.repository.getLogger("RESTDatabase.get");
    query = (query) ? query : '';
    if(this.cache[query])
    {
      logger.info("load from cache");
      return this.cache[query];
    }
    logger.info("load from server" + query);
    let body;
    try{
      body = this._send("GET", this.baseUrl + query, null);
      if(!body)
        throw Exception(JSON.stringify(body));
    }catch(e)
    {
      logger.error(query);
      logger.error(e);
      throw e;
    }
    
    //TODO, need to rewrite this part of algorithm
    if(body.rows && body.rows.length > 0)  
    {
      let rows = {};
      //Combine the array according to the index key.
      for(let i=0, row; row = body.rows[i]; i++)
      {
        let _key = JSON.stringify(row.key);
        if(!rows[_key])
          rows[_key] = new Array();
        rows[_key].push(row.value);
      }
      //log(rows);
      //Combine the value according to the value name.
      for(let _key in rows)
      {
        let obj = {};
        for(let i=0, val; val = rows[_key][i] ; i++)
        {
          for(let n in val)
          {
            if(!obj[n])
              obj[n] = new Array();
            obj[n].push(val[n]);
          }
        }
        rows[_key] = obj;
      }
      //log(rows);
      let result = {};
          
      for(let _key in rows)
      {
        let keys = JSON.parse(_key);
        let obj = null,tmp,key;
        if(typeof(keys) == "object")
          for(let i=keys.length-1; i >= 0; i--)
          {
            key = keys[i];
            //print(i);
            if(obj == null)
            {
              //print('not obj');
              obj = {};
              obj[key] = rows[_key];
              tmp = JSON.parse(JSON.stringify(obj));
              //p(obj);
            }
            else
            {
              //print('obj');
              //p(tmp);
              obj = {};
              obj[key] = tmp;
              tmp = JSON.parse(JSON.stringify(obj));
              //p(obj);
            }
          }
        else
        {
          obj = {};
          obj[keys] = rows[_key];
        }
        //p(obj);
        //print(key);
        result = MergeRecursive(result, obj);
        //result[key] = obj[key];
      }
      //p(result);
      body = result;
    }
    this.cache[query] = body;
    return body;
  },

  /**
   * @param object the object to update on the server
   * (_id is mandatory, the server may need _rev for conflict management)
   * if the server features conflict management, the object is updated with _rev
   */
  httpPut : function(object) {
    let logger = Log4Moz.repository.getLogger("RESTDatabase.put");
    let url = this.baseUrl + object._id;
    let body;
    try{
      body = this._send("PUT", url, object);
      if(!body)
        throw Exception(JSON.stringify(body));
    }catch(e)
    {
      logger.error(url);
      logger.error(object);
      logger.error(e);
      throw e;
    }
    if(body.rev)
      object._rev = body.rev;
    return object;
  },

  /**
   * @param object the object to delete on the server
   * (_id is mandatory, the server may need _rev for conflict management)
   */
  httpDelete : function(object) {
    let logger = Log4Moz.repository.getLogger("RESTDatabase.delete");
    let url = this.baseUrl + object._id;
    if(object._rev)
      url += "?rev=" + object._rev;
    let body;
    try{
      body = this._send("DELETE", url, null);
      if(!body)
        throw Exception(JSON.stringify(body));
    }catch(e)
    {
      logger.error(url);
      logger.error(e);
      throw e;
    }
    return true;
  },
  
  /**
   * Clear the cache
   */
  purge : function()
  {
    let logger = Log4Moz.repository.getLogger("RESTDatabase.purge");
    logger.info("purge the cache");
    this.cache = {};
  }  
}

function CouchDBListen()
{
  let logger = Log4Moz.repository.getLogger("CouchDBListen");
  var result = RESTDatabase.httpGet("_changes");
  var changeUrl = RESTDatabase.baseUrl + "_changes?feed=continuous&heartbeat=5000&since=" + result.last_seq;
  
  logger.info("listen on " + changeUrl);
  //RESTDatabase.purge();
  /*var channel = Services.io.newChannel(changeUrl, null, null);
  var aInputStream = channel.open();
  logger.info(typeof(aInputStream));
  var scriptableInputStream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
  scriptableInputStream.init(aInputStream);
  while(1)
  {
    var str = scriptableInputStream.read(aInputStream.available());
    if(str.length == 0)
    {
      logger.error("empty!");
      break;
    }
    //Change happens
    if(str.indexOf("}") > 0)
      RESTDatabase.purge();
    Sync.sleep(1000);
  }
  logger.info("close");
  aInputStream.close();
  scriptableInputStream.close();*/
}