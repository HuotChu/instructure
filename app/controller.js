define(['box', 'model'], function(Box, modelPromise) {
    'use strict';
    
    var formatDate = function (dateStr) {
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
                course;
            
            for (i; i < 2; ++i) {
                course = data[i];
                returnArray[i] = {
                    position: i + 1,
                    id: course.id,
                    courseName: course.name,
                    description: course.description,
                    startDate: formatDate(course.start_at)
                }
            }
            
            return returnArray;
        };

    modelPromise.then(function (model) {
        var courseData = model.select('*').from('Courses').go(),
            config = {
                model: model,
    
                data: {
                    courses: transformer(courseData)
                },
    
                target: document.querySelector('#dynamic-content'),
    
                template: 'app/course-view.html',
    
                domEvents: [],
    
                modelEvents: []
            },
            courseView = new Box(config).view;
        
        
    });
});
