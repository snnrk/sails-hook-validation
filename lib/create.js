'use strict';

//dependencies
//import sails waterline Deferred
var Deferred = require('waterline/lib/waterline/query/deferred');
var WLValidationError = require('./WLValidationError');

/**
 * @description path sails `create()` method to allow
 *              custom error message definitions
 * @param  {Object} model          a valid sails model
 * @param  {Function} validateCustom a function to transform sails `invalidAttributes`
 *                                   to custome `Errors`
 */
module.exports = function(model, validateCustom) {
  //remember sails defined create
  //method
  //See https://github.com/balderdashy/waterline/blob/master/lib/waterline/query/dql/create.js
  var sailsCreate = model.create;

  //prepare new create method
  //which wrap sailsCreate
  //with custom error message checking
  function create(values, callback, meta) {

    // return Deferred
    // if no callback passed
    // See https://github.com/balderdashy/waterline/blob/master/lib/waterline/query/dql/create.js#L54
    if (typeof callback !== 'function') {
      //this refer to the
      //model context
      return new Deferred(model, model.create, {}, values);
    }

    //otherwise
    //call sails create
    var wrappedCb = function(error, result) {
      //any create error
      //found?
      if (error) {
        //process sails invalidAttributes and
        //attach Errors key in error object
        //as a place to lookup for our
        //custom errors messages
        if (error.invalidAttributes) {
          var customError = validateCustom(model, error.invalidAttributes);
          // will return and override with empty object
          // when using associations
          if (Object.keys(customError).length !== 0) {
            error.Errors = customError;
          }
        }
        callback(WLValidationError.patch(error));
      } else {
        //no error
        //return
        callback(null, result);
      }
    };
    return sailsCreate.call(model, values, wrappedCb, meta);
  }

  //bind our new create
  //to our models
  model.create = create;
};
