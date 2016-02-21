define(['db', 'eventHub', 'request'], function (db, eventHub, request) {
    'use strict';

    return new Promise(function (resolve) {
        var model = db.createDB('Canvas'),
            api = 'http://canvas-api.herokuapp.com/api/v1/';
        
        // enable model events
        model = eventHub.connect(model);
        // add tables to put stuff in
        model.createTable('Token')('token');
        model.createTable('Courses')('page');
        model.createTable('Pages')('current', 'last');
        
        // get a token
        request(api + 'tokens', 'post').then(function (xhr) {
            var responseText = xhr.responseText,
                token, courses;

            if (responseText.length && xhr.statusText === 'Created') {
                responseText = JSON.parse(responseText);
                token = responseText.token;
                model.insertInto('Token')('token').values(token);
                // token acquired. get initial course data
                request(api + 'courses?access_token=' + token).then(function (xhr2) {
                    var link = xhr2.getResponseHeader('Link');
                    
                    courses = JSON.parse(xhr2.responseText);
                    if (courses.length === 2 && courses[0].id === 1 && link.indexOf('http') !== -1) {
                        model.insertJsonInto('Courses')(courses);
                        model.update('Courses').set('page', 1).where('page', '==', 'undefined');
                        link.replace(/rel="next",[^\?]+\?page=(\d+)/, function (m, p1) {
                            model.insertInto('Pages')('current', 'last').values(1, +p1);
                        });
                        
                        resolve(model);
                    }
                });
            } else {
                resolve(model);
            }
        });
    });
});
