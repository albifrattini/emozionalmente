const sendEmail = require('./utilities/emailsend');
const emailTemplates = require('./utilities/emailtemplates');
const errors = require('./utilities/responses');
const descriptionsdb = require('./database/descriptions');
const userdb = require('./database/users');
const datadb = require('./database/data');
const contactdb = require('./database/contact');
const contributedb = require('./database/contribute');
const loggerdb = require('./database/logger');

const emotions = require('./database/init/emotions.json');
const languages = require('./database/init/languages.json');

const path = require('path');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'api/database/samples')
    },
    filename: function (req, file, cb) {
        cb(null, /*req.query.sentenceid + '_' + */req.requestTime + '.wav');
    }
});
const upload = multer({ storage: storage });
let samplesCombinations = {
    "it": [],
    "en": []
};





module.exports = function (app) {





    /***************
     **** OTHER
     ******************/

    app.get('/api/data/emotions', (req, res) => {

        res.send(emotions[req.session.lang]);

    });

    app.get('/api/language/set', (req, res) => {

        req.session.lang = req.query.lang;
        res.send({ message: `Language changed to ${req.session.lang}` });
        
    });

    app.get('/api/availablelanguages', (req, res) => {

        res.send({
            curr: req.session.lang,
            available: languages
        });

    });

    app.post('/api/logger', (req, res) => {

        const log = {
            info: req.body.info,
            username: req.session.user ? req.session.user.username : 'unknown',
            timestamp: req.requestTime
        };

        loggerdb.insertLog(log)
            .then(_ => {
                res.status(200).send('ok');
            });

    }); 




    /***************
     **** DATABASE
     ******************/
    
    /***************
     **** DESCRIPTIONS
     ******************/

    app.get('/api/descriptions/:page', function (req, res) {

        const page = req.params.page;
        const language = req.session.lang;

        descriptionsdb.getDescriptions(language, page)
            .then(result => {
                res.send(result);
            });

    });










    /***************
     **** SENTENCES
     ******************/

    app.get('/api/sentences', (req, res) => {
        
        const quantity = req.query.quantity ? req.query.quantity : 14;
        const language = req.session.lang;

        datadb.getSentencesToRecord(quantity, language)
            .then(result => {
                res.send(result);
            });

    });









    /***************
     **** SAMPLES
     ******************/

    // POST new sample inside database
    app.post('/api/data/samples', upload.single('audio'), (req, res, next) => {

        const user = req.session.user ? req.session.user.username : 'unknown';
        const sentenceid = req.query.sentenceid;
        const emotion = req.query.emotion;
        const language = req.session.lang;
        const sample = {
            speaker: user,
            sentenceid: sentenceid,
            language: language,
            timestamp: req.requestTime,
            emotion: emotion
        }

        datadb.insertSample(sample)
            .then(() => {
                res.status(200).send({
                    message: 'Upload successful!'
                });
            })
            .catch(error => {
                console.error(error);
            });

    });










    /***************
     **** EVALUATIONS
     ******************/

    // GET sentences of samples to evaluate
    app.get('/api/data/samples', (req, res) => {
        
        const quantity = req.query.quantity ? req.query.quantity : 10;
        const curruser = req.session.user ? req.session.user.username : null;
        const language = req.session.lang;

        datadb.getSamplesToEvaluate(quantity, curruser, language)
            .then(result => {
                res.send(result);
            });

    });

    app.get('/api/data/download/:id', (req, res) => {

        datadb.findSample(req.params.id)
            .then(result => {
                let filePath = path.join(req.samplesUrl, result.timestamp + ".wav");
                res.download(filePath);
            });

    });

    app.post('/api/data/evaluations', async (req, res, next) => {

        const evaluator = req.session.user ? req.session.user.username : null;
        const language = req.session.lang;
        
        const evaluation = {
            sampleid: req.body.sampleid,
            correct: req.body.correct,
            quality: req.body.quality,
            emotion: req.body.emotion,
            evaluator: evaluator,
            language: language,
            timestamp: req.requestTime
        }

        datadb.insertEvaluation(evaluation)
            .then(async function () {
                let otherEvaluations = 
                    await datadb.getOtherEvaluationsOfSample(evaluation.sampleid, evaluation.evaluator);
                res.status(200).send({
                    otherEvaluations: otherEvaluations
                });
            })
            .catch(error => {
                console.error(error);
            });

    });









    app.get('/api/data/database/samples', function (req, res) {

        const minAge = req.query.min;
        const maxAge = req.query.max;
        const lang = req.query.l;
        const sex = req.query.s ? req.query.s : '';
        const nationality = req.query.n ? req.query.n : '';

        datadb.getAllSamples(minAge, maxAge, sex, nationality, lang)
            .then(result => {
                let samples = []
                const dates = {}
                const day = {}
                emotions[req.session.lang].map(e => {
                    return day[e.name] = 0
                });
                result.map(e => {
                    const date = new Date(parseInt(e.timestamp)).toString();
                    const strDate = date.substring(13,15) + '-' + date.substring(4,7) + '-' + date.substring(8,10);
                    if (!dates[strDate]) {
                        dates[strDate] = {...day}
                    }
                    return dates[strDate][e.emotion] += 1
                });
                samples = [...Object.keys(dates)].map(e => {
                    return {date: e, ...dates[e]};
                });
                res.send(samples);
            })
            .catch(error => {   
                console.log(error);
            });

    });

    app.get('/api/data/database/users', function (req, res) {

        
        const minAge = req.query.min;
        const maxAge = req.query.max;
        const lang = req.query.l;
        const sex = req.query.s ? req.query.s : '';
        const nationality = req.query.n ? req.query.n : '';

        userdb.getAllUsers(minAge, maxAge, sex, nationality, lang)
            .then(result => {
                res.send(result);
            })
            .catch(error => {
                console.log(error);
                res.send([]);
            });
    });

    app.get('/api/data/database/evaluations', function (req, res) {

        const minAge = req.query.min;
        const maxAge = req.query.max;
        const lang = req.query.l;
        const sex = req.query.s ? req.query.s : '';
        const nationality = req.query.n ? req.query.n : '';
        const values = {
            quantity: [],
            scatter: []
        }

        datadb.getEvaluationsPerQuantity(minAge, maxAge, sex, nationality, lang)
            .then(quantity => {

                values.quantity = [...quantity];
                datadb.getAllEvaluations(minAge, maxAge, sex, nationality, lang)
                    .then(result => {
                        let scatter = []
                        const dates = {}
                        result.map(e => {
                            const date = new Date(parseInt(e.timestamp)).toString();
                            const strDate = date.substring(13,15) + '-' + date.substring(4,7) + '-' + date.substring(8,10);
                            if (!dates[strDate]) {
                                dates[strDate] = { value: 0 }
                            }
                            return dates[strDate]['value'] += 1
                        });
                        scatter = [...Object.keys(dates)].map(e => {
                            return {date: e, value: dates[e]['value']};
                        });
                        values.scatter = [...scatter];
                        res.send(values);
                    })
                    .catch(error => {
                        console.log(error);
                        res.send(values);
                    });
            })
            .catch(error => {
                console.log(error);
                res.send([]);
            });

    });

    app.get('/api/data/database/comparison', function (req, res) {

        const emotion = req.query.e;
        const user = req.query.u;
        const v = req.query.v;
        let minAge = 0;
        let maxAge = 100;
        let lang = req.query.l;
        let sex = '';
        let nationality = '';
        if (!user) {
            minAge = parseInt(req.query.min);
            maxAge = parseInt(req.query.max);
            sex = req.query.s ? req.query.s : '';
            nationality = req.query.n ? req.query.n : '';
        }

        datadb.getSamplesEmotionRecognizedAs(user, v, minAge, maxAge, sex, nationality, emotion, lang)
            .then(result => {
                res.send(result);
            })
            .catch(error => {
                console.error(error);
            });

    }); 

    app.get('/api/data/database/accuracy', function (req, res) {

        const minAge = req.query.min;
        const maxAge = req.query.max;
        const lang = req.query.l;
        const sex = req.query.s ? req.query.s : '';
        const nationality = req.query.n ? req.query.n : '';

        datadb.getAllEvaluations(minAge, maxAge, sex, nationality, lang)
            .then(result => {
                const dates = {}
                const day = {}
                emotions[req.session.lang].map(e => {
                    day[e.name + '_correct'] = 0;
                    return day[e.name + '_wrong'] = 0;
                });
                let previous = {...day};
                result.map(e => {
                    const date = new Date(parseInt(e.timestamp)).toString();
                    const strDate = date.substring(13,15) + '-' + date.substring(4,7) + '-' + date.substring(8,10);
                    if (!dates[strDate]) {
                        dates[strDate] = {...previous};
                    }
                    if (e.recognized === e.real) dates[strDate][e.real + '_correct'] += 1;
                    else dates[strDate][e.real + '_wrong'] += 1;
                    return previous = {...dates[strDate]};
                });
                const evaluations = [...Object.keys(dates)].map(e => {
                    const perc = {}
                    emotions[req.session.lang].forEach(e1 => {
                        const total = dates[e][e1.name + '_correct'] + dates[e][e1.name + '_wrong'];
                        if (total === 0) return perc[e1.name] = 0;
                        return perc[e1.name] = Math.round((dates[e][e1.name + '_correct'] / total) * 100);
                    });
                    return {date: e, ...perc};
                });
                res.send(evaluations);
            })
            .catch(error => {
                console.log(error);
                res.send([]);
            });

    }); 

    app.get('/api/data/database/user/accuracy', function (req, res) {

        const user = req.query.u;
        const lang = req.query.l;

        datadb.getUserComparisonWithAll(user, emotions[req.session.lang], lang)
            .then(result => {
                res.send(result);
            })
            .catch(error => {
                console.log(error);
            })

    }); 

    app.get('/api/data/database/user/listencomparison', function (req, res) {

        const user = req.query.u;
        const lang = req.query.l;

        datadb.getUserListenComparisonWithOthers(lang)
            .then(result => {
                res.send({
                    uid: user,
                    ...result
                });
            })
            .catch(error => {
                console.log(error);
            })

    });
    
    app.get('/api/data/database/user/speakcomparison', function (req, res) {

        const user = req.query.u;
        const lang = req.query.l;

        datadb.getUserSpeakComparisonWithOthers(lang)
            .then(result => {
                res.send({
                    uid: user,
                    ...result
                });
            })
            .catch(error => {
                console.log(error);
            })

    });

    app.get('/api/data/database/user/actor', function (req, res) {

        const user = req.query.u;
        const lang = req.query.l;

        datadb.getUserSampleAccuracy(user, lang)
            .then(result => {
                res.send(result);
            })
            .catch(error => {
                console.log(error);
            })

    }); 











    /***************
     **** USERS
     ******************/

    app.post('/api/users/signup', async function (req, res) {

        let user = req.body;

        const { error } = validateUser(user, req);
        if (error) return res.status(400).send({ message: error.details[0].message });

        const mailRegistered = await userdb.findUserByEmail(user.email);
        if (mailRegistered) 
        return res.status(400).send({ message: errors.responses[req.session.lang]['signupEmailError'] });

        const usernameRegistered = await userdb.findUserByUsername(user.username);
        if (usernameRegistered) 
        return res.status(400).send({ message: errors.responses[req.session.lang]['signupUsernameError'] });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);

        userdb.signup(user)
            .then(() => {
                sendEmail(user.email, emailTemplates.confirm(user.username));
            })
            .then(() => {
                res.status(200).send({
                    message: errors.responses[req.session.lang]['signupSuccessful']
                });
            }).catch(error => {
                res.status(400).send({
                    message: 'Something went wrong...'
                });
            });

    });

    app.get('/api/users/confirmation/:username', async function (req, res) {

        const username = req.params.username;

        const user = await userdb.findUserByUsername(username);
        if (!user) return res.status(400).send('You are not allowed to complete this operation!');

        const confirmation = { confirmed: true };

        userdb.confirmUser(username, confirmation)
            .then(_ => {
                res.status(200).send({
                    message: 'Confirmation successful!'
                });
            })
            .catch(error => {
                console.log(error);
                res.status(400).send({
                    message: 'Something went wrong...'
                });
            });

    });

    app.post('/api/users/login', async function (req, res) {

        const credentials = req.body;

        const { error } = validateCredentials(credentials, req);
        if (error) return res.status(400).send(error.details[0].message);

        const user = await userdb.findUserByEmail(credentials.email);
        if (!user) return res.status(400).send({ message: errors.responses[req.session.lang]['loginError'] });

        if (!user.confirmed) return res.status(400).send({ message: errors.responses[req.session.lang]['loginUnconfirmedError'] });

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return res.status(400).send({ message: errors.responses[req.session.lang]['loginError'] });

        res.status(200).send(
            {
                message: 'Login successful!',
                user: {
                    username: user.username,
                    email: user.email
                }
            }
        );

        
        req.session.user = {
            username: user.username,
            email: user.email,
            sex: user.sex,
            nationality: user.nationality,
            age: user.age
        };
        req.session.admin = user.admin;
        req.session.loggedin = true;
        req.session.save();

    });

    app.get('/api/users/logout', (req, res) => {

        req.session.destroy();

        res.status(200).send({
            message: 'Logout successful!'
        });

    });

    app.get('/api/users/loggedin', (req, res) => {

        if (req.session.loggedin) {
            res.status(200).send({
                message: 'The user currently logged in is ...',
                user: req.session.user
            });
        } else {
            res.status(200).send({
                message: 'No user is logged in...',
                user: {
                    username: null,
                    email: null
                }
            });
        }

    });

    app.get('/api/users/isAuthorized', (req, res) => {

        if (req.session.admin) {
            res.status(200).send({ authorized: true });
        } else {
            res.status(403).send({ authorized: false });
        }

    });

    app.get('/api/users/hassamples', async (req, res) => {

        let allCombinations = [];

        if (!samplesCombinations[req.session.lang].length > 0) {
            const allSentences = await datadb.getSentencesToRecord(100, req.session.lang);
            const allEmotions = emotions[req.session.lang];
            for (var i in allSentences) {
                for (var j in allEmotions) {
                    allCombinations.push({
                        "sentenceid": allSentences[i].id,
                        "emotion": allEmotions[j].name
                    });
                }
            }
            samplesCombinations[req.session.lang] = allCombinations;
        }

        if (!req.session.user) 
            return res.send({ newUser: true, samples: samplesCombinations[req.session.lang] });

        datadb.getUserSamples(req.session.user.username)
            .then(result => {
                if (result.length > 0) {
                    const toSend = samplesCombinations[req.session.lang].filter(x => {
                        return !result.filter(y => {
                            return x.sentenceid === y.sentenceid && x.emotion === y.emotion;
                        }).length > 0;
                    });
                    res.send({ 
                        newUser: false,
                        samples: toSend
                    });
                } else {
                    res.send({ 
                        newUser: true,
                        samples: samplesCombinations[req.session.lang]
                    });
                }
            });

    });

    app.get('/api/users/hasevaluations', (req, res) => {

        if (!req.session.user) return res.send({ newUser: true });

        datadb.getUserEvaluations(req.session.user.username)
            .then(result => {
                if (result.length > 0) {
                    res.send({ newUser: false });
                } else {
                    res.send({ newUser: true });
                }
            });

    });







    app.post('/api/contact/contact', (req, res) => {

        const element = req.body;

        contactdb.insert(element)
            .then(() => sendEmail(process.env.MAIL_USER, emailTemplates.mycontact(element)))
            .then(() => sendEmail(element.email, emailTemplates.contact()))
            .then(() => {
                res.status(200).send({
                    message: 'Contact successful!'
                });
            })
            .catch(error => {
                console.log(error);
            });
    });

    app.post('/api/contact/contribute', (req, res) => {

        const element = req.body;

        contributedb.insert(element)
            .then(() => sendEmail(process.env.MAIL_USER, emailTemplates.mycontribute(element)))
            .then(() => sendEmail(element.email, emailTemplates.contribute()))
            .then(() => {
                res.status(200).send({
                    message: 'Contribution successful!'
                });
            })
            .catch(error => {
                console.log(error);
            });
    });








    return app;

}







function validateUser(user, req) {
    const schema = {
        username: Joi.string().min(5).max(255).required().error(() => {
            return {
              message: errors.responses[req.session.lang]['joi']['signupUsername'],
            };
          }),
        email: Joi.string().min(5).max(255).required().email().error(() => {
            return {
              message: errors.responses[req.session.lang]['joi']['signupEmail'],
            };
          }),
        password: Joi.string().min(5).max(255).required().error(() => {
            return {
              message: errors.responses[req.session.lang]['joi']['signupPassword'],
            };
          }),
        nationality: Joi.string().required(),
        age: Joi.string().required(),
        sex: Joi.string().required()
    };
    return Joi.validate(user, schema);
}

function validateCredentials(credentials, req) {
    const schema = {
        email: Joi.string().min(5).max(255).required().email().error(() => {
            return {
              message: errors.responses[req.session.lang]['joi']['loginEmail'],
            };
          }),
        password: Joi.string().min(5).max(255).required().error(() => {
            return {
              message: errors.responses[req.session.lang]['joi']['loginPassword'],
            };
          })
    };
    return Joi.validate(credentials, schema);
}