define(['testharness', 'request', 'db'],
    function (harness, request, db) {
        return {
            run: function () {
                "use strict";
                
                // SETUP FOR TESTS
                //
                // Create a Model
                var model = db.createDB('instructure');
                // Add tables & columns
                model.createTable('Users')('username', 'token');
                model.createTable('Courses')('id', 'name', 'code', 'description', 'start', 'end', 'created', 'updated');

                harness.async_test(function (test) {
                    request('http://canvas-api.herokuapp.com/api/v1/tokens', 'post').then(function (xhr) {
                        var responseText = xhr.responseText;

                        test.step(function () {
                            harness.assert_true(responseText && JSON.parse(responseText) && xhr.statusText === "Created");
                            test.done();
                        });
                    });
                }, "Acquire access token from Canvas API");

                harness.async_test(function (test) {
                    request('http://canvas-api.herokuapp.com/api/v1/tokens', 'post').then(function (xhr) {
                        var tokenObj = JSON.parse(xhr.responseText),
                            token = tokenObj['token'],
                            returnToken;
                        
                        // store token in the model
                        model.insertInto('Users')('token', 'username').values(token, 'scottB');
                        // pull token out of model
                        returnToken = model.select('token').from('Users').where('username', '===', 'scottB').go() || [{token: ''}];
                        returnToken = returnToken[0]['token'];
                        
                        test.step(function () {
                            harness.assert_true(returnToken === token && /[a-z0-9]{32}/.test(returnToken));
                            test.done();
                        });
                    });
                }, "Save and retrieve the access token");
                
            }
        };
    }
);
