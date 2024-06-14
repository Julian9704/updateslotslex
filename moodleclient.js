const https = require ('https');

module.exports = {
    /**
     * Realize a HTTPS GET request to moodle.
     * 
     * @param {object} ctx - Context with the base URL and the token.
     * @param {string} functionName - Name of the function.
     * @param {object} params - Aditionals parameters to the request.
     * @param {function} onEnd - Callback function executed after finish the request.
     */
    request: function (ctx, functionName, params, onEnd) {
        var url = new URL(ctx.api.url + '/webservice/rest/server.php');
        url.searchParams.append('wstoken', ctx.api.token);
        url.searchParams.append('wsfunction', functionName);
        url.searchParams.append('moodlewsrestformat', 'json');

        if (params) {
            for (var key in params) {
                var value = params[key];
                url.searchParams.append(key, value);
            }
        }

        https.get(url, (res) => {

            if (res.statusCode == 200) {
                let data = [];
                
                res.on('data', chunk => {
                    data.push(chunk);
                });
                  
                res.on('end', () => {
                    var response = JSON.parse(Buffer.concat(data).toString());

                    onEnd(response);
                });
                
            } else {
                throw new Error(bbclib.s('serviceerror'));
            }
            
        }).on('error', (e) => {
            throw new Error(e);
        });
    },
    /**
     * Get the courses from moodle.
     * 
     * @param {object} ctx - Context with the base URL and the token.
     * @param {function} onEnd - Callback function executed after finish the request.
     */
    getCourses: function (ctx, courseName = '', onEnd = null) {
        return new Promise((resolve) => {
            this.request(ctx, 'core_course_get_courses', null, (response) => {
                if (onEnd) {
                    onEnd(response);
                }

                resolve(response);
            });
        });
    }
    
};
