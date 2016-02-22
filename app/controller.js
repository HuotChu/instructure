define(['box', 'model'], function(Box, modelPromise) {
    'use strict';
    
    var containerDOM = document.querySelector('#dynamic-content'),
        formatDate = function (dateStr) {
            var date = dateStr.substr(0, dateStr.indexOf('+') - 1),
                months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            date = new Date(date).toLocaleString();
            date = date.split(/\s/);
            date = date[0].split('/');
            
            return months[date[0] - 1] + ' ' + date[1] + ', 2016';
        },
    transformer = function (data) {
        var i = 0,
            returnArray = [],
            date,
            course;
        
        for (i; i < 2; ++i) {
            course = data[i];
            date = course.start_at ? formatDate(course.start_at) : 'TBA';
            returnArray[i] = {
                position: i + 1,
                id: course.id,
                courseName: course.name,
                description: course.description,
                startDate: date
            }
        }
        
        return returnArray;
    };

    modelPromise.then(function (model) {
        var courseData = model.select('*').from('Courses').go(),
            fixDate = function (d) {
                d = d.substr(0, d.indexOf('+') - 1);
                d = new Date(d).toLocaleString();
                d = d.replace(/(\d{1,2}:\d\d):\d{1,2}/, function (m, p) {
                    return p;
                });
                
                return d;
            },
            doEnroll = {
                event: 'click',
                id: '_enrollButton_',
                callback: function (id) {
                    var targetCourse = model.select('*').from('Courses').where('id', '==', id).go()[0],
                        start = targetCourse.start_at,
                        end = targetCourse.end_at,
                        created = targetCourse.created_at,
                        updated = targetCourse.updated_at,
                        formConfig;

                    if (!start) {
                        start = 'TBA';
                    } else {
                        start = start.replace(/201\d/, 2016);
                        start = fixDate(start);
                    }
                    
                    if (!end) {
                        end = 'TBA';
                    } else {
                        end = fixDate(end);
                    }
                    
                    if (!created) {
                        created = 'Unknown'
                    } else {
                        created = fixDate(created);
                    }
                    
                    if (!updated) {
                        updated = created;
                    } else {
                        updated = fixDate(updated);
                    }

                    targetCourse.start_at = start;
                    targetCourse.end_at = end;
                    targetCourse.created_at = created;
                    targetCourse.updated_at = updated;
                    
                    formConfig = {
                        model: model,
                        data: targetCourse,
                        target: document.querySelector('#form_attach'),
                        template: 'app/form.html',
                        domEvents: [
                            {
                                event: 'click',
                                id: 'confirm-button',
                                callback: function (id) {
                                    model.enroll(id).then(function (statusText) {
                                        var title = document.querySelector('.winHeader'),
                                            body = document.querySelector('.winDetails');
                                        
                                        title.innerHTML = 'Success!';
                                        body.innerHTML = '<div class=\"details-description\" style=\"font-size\: 1.5em\">You are now enrolled.<br>This window will close in 5 seconds.<\/div>';
                                        setTimeout(function () {
                                            formConfig.target.innerHTML = '';
                                        }, 5000);
                                        console.log('statusText');
                                    });
                                }
                            },
                            {
                                event: 'click',
                                id: 'cancel-button',
                                callback: function () {
                                    formConfig.target.innerHTML = '';
                                }
                            }
                        ]
                    };

                    formConfig.target.innerHTML = '';
                    new Box(formConfig);
                }
            },
            config = {
                model: model,
    
                data: {
                    courses: transformer(courseData)
                },
    
                target: containerDOM,
    
                template: 'app/course-view.html',
    
                domEvents: [
                    doEnroll,
                    {
                        event: 'click',
                        id: 'backButton',
                        callback: function () {
                            // previous page
                            model.getPage(-1);
                        }
                    },
                    {
                        event: 'click',
                        id: 'nextButton',
                        callback: function () {
                            // next page
                            model.getPage(1);
                        }
                    }
                ],
    
                modelEvents: [
                    {
                        event: 'Canvas.State.current_page.update',
                        id: 'page',
                        callback: function (e) {
                            var pageNumber = e.detail.value;

                            containerDOM.innerHTML = '';
                            config.target = containerDOM;
                            config.data = {
                                courses: transformer(model.select('*').from('Courses').where('page', '===', pageNumber).go())
                            };
                            config.modelEvents = [];

                            courseView = new Box(config);
                        }
                    }            
                ]
            },
            courseView = new Box(config);
    });
});
