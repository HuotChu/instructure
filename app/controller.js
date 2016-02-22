define(['box', 'model'], function(Box, modelPromise) {
    'use strict';
    
    var containerDOM = document.querySelector('#dynamic-content'),
        formatDate = function (dateStr) {
        var date = new Date(dateStr).toString();

        date = date.replace(/\w{3,4}\s(\w{3})\s(\d{1,2}).*/, function (m, p1, p2) {
            var regX = new RegExp(p1, 'i'),
                months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                fullName = '';
            
            months.some(function (month) {
                if (regX.test(month)) {
                    fullName = month;
                    return true;
                }
            });
            
            return fullName + ' ' + p2 + ', 2016';
        });
    
        return date;
    }, 
    transformer = function (data) {
        var i = 0,
            returnArray = [],
            date,
            course;
        
        for (i; i < 2; ++i) {
            course = data[i];
            date = course.start_at ? course.start_at.split(/\s/) : 'TBA';
            date = date instanceof Array ? formatDate(date[0]) : date;
            returnArray[i] = {
                position: i + 1,
                id: course.id,
                courseName: course.name,
                description: course.description,
                startDate: date
            }
        }
        
        return returnArray;
    },
    doEnroll = {
        event: 'click',
        id: '_enrollButton_',
        callback: function (id) {
            console.log('Enroll button ' + id + ' clicked.');
        }
    };

    modelPromise.then(function (model) {
        var courseData = model.select('*').from('Courses').go(),
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
                        callback: function (e, el, box) {
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
