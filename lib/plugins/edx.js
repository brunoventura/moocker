'use strict';
const request = require('request');
const Promise = require('bluebird');
const Consumer = require('../Consumer');
const Course = require('../CourseModel');

class EdxConsumer extends Consumer {

    constructor() {
        super({
            name: 'edX',
            link: 'https://www.edx.org',
            id: 'edx'
        });
    }

    loadCourses() {
        const q = new Promise((resolve, reject) => {
            request('https://www.edx.org/search/api/all',
            (err, res, body) => {
                if (err || res.statusCode === 503) {
                    reject('Problem consuming');
                    return;
                }
                const data = JSON.parse(body);
                const find = language => language === 'Português';
                const filter = course => !!course.languages.find(find);
                resolve(data.filter(filter).map(course => new Course({
                    name: course.l,
                    type: course.pace ? 'self-paced' : 'time-lapse',
                    link: course.url,
                    image: this.source.link + course.image.src,
                    source: this.source.id,
                    sourceId: course.guid.toString()
                })));
            });
        });
        return q;
    }

}

module.exports = new EdxConsumer();
