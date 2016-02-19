define(['testharness', 'request', 'db'],
    function (harness, request, db) {
        return {
            run: function () {
                "use strict";
                
                // SETUP FOR TESTS
                //
                // Create a Model
                var model = db.createDB('instructure'),
                    promise = request('http://canvas-api.herokuapp.com/api/v1/tokens', 'post');
                // Add tables & columns
                model.createTable('Users')('username', 'token');
                model.createTable('Courses')('id', 'name', 'code', 'description', 'start', 'end', 'created', 'updated');

                // TESTS
                harness.async_test(function (test) {
                    promise.then(function (xhr) {
                        var responseText = xhr.responseText;

                        test.step(function () {
                            harness.assert_true(responseText && JSON.parse(responseText) && xhr.statusText === "Created");
                            test.done();
                        });
                    });
                }, "Acquire access token from Canvas API");

                harness.async_test(function (test) {
                    promise.then(function (xhr) {
                        var token = JSON.parse(xhr.responseText).token,
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

                harness.async_test(function (test) {
                    promise.then(function (xhr) {
                        var token = JSON.parse(xhr.responseText).token;

                        request('http://canvas-api.herokuapp.com/api/v1/courses?access_token=' + token).then(function (xhr2) {
                            var courses = JSON.parse(xhr2.responseText),
                                links = xhr2.getResponseHeader('Link');

                            test.step(function (){
                                harness.assert_true(courses.length === 2 && courses[0].id === 1 && links.indexOf('http') !== -1);
                                test.done();
                            });
                        });
                    });
                }, "Retrieve 2 courses and pagination links from Canvas API");
                
                harness.async_test(function (test) {
                    promise.then(function (xhr) {
                        var token = JSON.parse(xhr.responseText).token;

                        request('http://canvas-api.herokuapp.com/api/v1/courses/1?access_token=' + token).then(function (xhr2) {
                            var course = JSON.parse(xhr2.responseText);

                            test.step(function (){
                                harness.assert_true(course.id === 1 && course.code === "ENGL 2100");
                                test.done();
                            });
                        });
                    });
                }, "Return specific course based on id");
            }
        };
    }
);
