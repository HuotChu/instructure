define(['testharness', 'request'],
    function (harness, request) {
        return {
            run: function () {
                "use strict";

                harness.async_test(function (test) {
                    request('http://canvas-api.herokuapp.com/api/v1/tokens', 'post').then(function (xhr) {
                        var responseText = xhr.responseText;

                        test.step(function () {
                            harness.assert_true(responseText && JSON.parse(responseText) && xhr.statusText === "Created");
                            test.done();
                        });
                    });
                }, "Acquire access token from Canvas API");
                
            }
        };
    }
);
