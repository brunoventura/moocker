'use strict';
const request = require('request');
const _ = require('lodash');
const Promise = require('bluebird');

const Consumer = require('../Consumer');
const Course = require('../CourseModel');
const baseUrl = 'https://www.coursera.org/api/';

const courseConsts = {
    'v2.ondemand': {
        type: 'self-paced',
        url: 'learn'
    },
    'v2.capstone': {
        type: 'self-paced',
        url: 'learn'
    },
    'v1.session': {
        type: 'time-lapse',
        url: 'course'
    }
};

class CourseraConsumer extends Consumer {

    constructor() {
        super({
            name: 'Coursera',
            link: 'http://www.coursera.org',
            id: 'coursera'
        });
    }

    loadCourses() {
        const q = new Promise(resolve => {
            const url = `${baseUrl}catalogResults.v2?q=search&query=&languages=pt`;
            request(url, (err, res, body) => {
                const data = JSON.parse(body);

                return resolve(data);
            });
        });
        return q.then(data => {
            const groups = _.groupBy(data.elements[0].entries, 'resourceName');
            return Promise.map([groups['courses.v1']], this.loadGroup)
                .then(courses => _.flatten(courses).map(course => {
                    const courseEntity = {
                        name: course.name,
                        type: courseConsts[course.courseType].type,
                        link: `https://www.coursera.org/${courseConsts[course.courseType].url}/${course.slug}`,
                        image: course.photoUrl,
                        source: 'coursera',
                        sourceId: course.id
                    };

                    if (course.upcomingSessionStartDate) {
                        courseEntity.startDate = course.upcomingSessionStartDate;
                    }

                    return new Course(courseEntity);
                }));
        });
    }

    loadGroup(group) {
        if (group.length === 0) {
            Promise.reject();
        }

        const q = new Promise((resolve, reject) => {
            const resource = group[0].resourceName;
            const ids = group.map(_group => _group.id).join(',');
            const fields = 'photoUrl,slug,upcomingSessionStartDate';
            const url = `${baseUrl}${resource}/?ids=${ids}&fields=${fields}`;
            request(url, (err, res, body) => {
                if (err) reject(err);
                const data = JSON.parse(body);
                resolve(data.elements);
            });
        });
        return q;
    }

}

module.exports = new CourseraConsumer();
