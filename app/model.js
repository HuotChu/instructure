define(['db', 'eventHub', 'request'], function (db, eventHub, request) {
    'use strict';
    
    /*
     * The model will attempt to retrieve the 2 courses for a given page.
     * If not found ask the server for the new data, store it, return it in the Promise.
     */
    var api = 'http://canvas-api.herokuapp.com/api/v1/',
        getPage = function (count) {
            var currentPage = this.select('current_page').from('State').go()[0].current_page,
                newPage = currentPage + count,
                max = this.select('max_pages').from('State').go()[0].max_pages,
                courses,
                model = this;
                
            if (newPage > max) {
                newPage = 1;
            } else if (newPage === 0) {
                newPage = max;
            }

            courses = this.select('*').from('Courses').where('page', '===', newPage).go();
    
            return new Promise(function (resolve) {
                var token = model.select('token').from('State').go()[0].token,
                    syncState = function () {
                        model.update('State').set('current_page', newPage).where('max_pages', '===', max).go();
                    };
                
                if (courses.length !== 2) {
                    // get the missing page
                    request(api + 'courses?access_token=' + token + '&page=' + newPage + '&per_page=2').then(function (xhr) {
                        var data = JSON.parse(xhr.responseText),
                            d1, d2;
                        if (data.length === 2) {
                            d1 = data[0];
                            d2 = data[1];
                            model.insertInto('Courses')('code', 'created_at', 'description', 'end_at', 'id', 'json_class', 'name', 'page', 'start_at', 'updated_at')
                                .values(d1.code, d1.created_at, d1.description, d1.end_at, d1.id, d1.json_class, d1.name, newPage, d1.start_at, d1.updated_at)
                                (d2.code, d2.created_at, d2.description, d2.end_at, d2.id, d2.json_class, d2.name, newPage, d2.start_at, d2.updated_at);
                            syncState();
                        }
                        resolve(data);
                    });
                } else {
                    syncState();
                    resolve(courses);
                }
            });
        };

    return new Promise(function (resolve, reject) {
        var model = db.createDB('Canvas');
        
        // enable model events
        model = eventHub.connect(model);
        // add tables to put stuff in
        model.createTable('State')('token', 'current_page', 'max_pages');
        model.createTable('Courses')('page');
        // hook in the getPage method
        model.getPage = getPage.bind(model);
        
        // get a token
        request(api + 'tokens', 'post').then(function (xhr) {
            var responseText = xhr.responseText,
                token, courses;

            if (responseText.length && xhr.statusText === 'Created') {
                responseText = JSON.parse(responseText);
                token = responseText.token;
                // token acquired. get initial course data
                request(api + 'courses?access_token=' + token).then(function (xhr2) {
                    var link = xhr2.getResponseHeader('Link');
                    
                    courses = JSON.parse(xhr2.responseText);
                    if (courses.length === 2 && courses[0].id === 1 && link.indexOf('http') !== -1) {
                        courses[0].page = 1;
                        courses[1].page = 1;
                        model.insertJsonInto('Courses')(courses);
                        link.replace(/rel="next",[^\?]+\?page=(\d+)/, function (m, p1) {
                            model.insertInto('State')('token', 'current_page', 'max_pages').values(token, 1, +p1);
                        });
                        
                        resolve(model);
                    }
                });
            } else {
                reject(xhr.statusText);
            }
        });
    });
});
