let db;

module.exports.setupDataDb = function (database) {

    db = database;
    let initSentences = require('./init/sentences.json');

    return db.schema.hasTable('sentences').then(exists => {

        if (!exists) {
            return db.schema.createTable('sentences', table => {
                table.increments('id');
                table.text('language');
                table.text('sentence');
            })
            .then(() => {
                return db('sentences').insert(initSentences);
            })
            .then(() => {
                return db.schema.createTable('samples', table => {
                    table.increments('id');
                    table.text('speaker');
                    table.text('language');
                    table.integer('sentenceid');
                    table.text('timestamp');
                    table.enum('emotion', ['hp', 'sd', 'fr', 
                                            'an', 'sr', 'ds', 'nt']);
                });
            })
            .then(() => {
                return db.schema.createTable('evaluated', table => {
                    table.increments('id');
                    table.integer('sampleid');
                    table.text('evaluator');
                    table.text('language');
                    table.text('timestamp');
                    table.boolean('correct');
                    table.enum('quality', ['bad', 'good']);
                    table.enum('emotion', ['hp', 'sd', 'fr', 
                                            'an', 'sr', 'ds', 'nt']);
                });
            });
        }
    });
}

module.exports.getSentencesToRecord = function (quantity, currentuser, language) {
    // Returns a fixed amount of random sentences, excluding the ones already sampled
    // TODO: we can return the same sentences as long as the user records another emotion
    return db.select('*').from('sentences')
        .where('language', language)
        .whereNotIn('id', db.select('sentenceid').from('samples').where('speaker', currentuser))
        .orderBy(db.raw('RANDOM()'))
        .limit(quantity);
}

module.exports.getSamplesToEvaluate = function (quantity, currentuser, language) {
    // Returns a fixed amount of random samples, excluding the ones recorded by the user
    // itself and the ones already evaluated by the user.
    // return db.select('samples.id', 'sentenceid', 'emotion', 'timestamp', 'sentence')
    return db.select('samples.id', 'emotion', 'sentence')
        .from('samples')
        .where('samples.language', language)
        .whereNot('samples.speaker', currentuser)
        .whereNotIn('samples.id', db.select('sampleid').from('evaluated').where('evaluator', currentuser))
        .join('sentences', 'samples.sentenceid', '=', 'sentences.id')
        .orderBy(db.raw('RANDOM()'))
        .limit(quantity);
}

module.exports.findSample = function (id) {
    return db('samples').where('id', id).first();
}

module.exports.insertSample = function (sample) {
    return db('samples').insert(sample);
}

module.exports.insertEvaluation = function (evaluation) {
    return db('evaluated').insert(evaluation);
} 

module.exports.getUserSamples = function (user) {
    return db('samples').where('samples.speaker', user);
}

module.exports.getUserEvaluations = function (user) {
    return db('evaluated').where('evaluated.evaluator', user);
}

module.exports.getTotalSamples = function () {
    return db('samples').count('id as value').first();
}

module.exports.getTotalEvaluations = function () {
    return db('evaluated').count('id as value').first();
}

module.exports.getSamplesOfLanguage = function (language) {
    return db('samples').where('language', language).count('id as value').first();
}

module.exports.getAccuracy = async function () {
    const corr = await db('evaluated').where('correct', true).count('id').first(); 
    const tot = await db('evaluated').count('id').first();
    const res = corr.count / tot.count;
    return { value : res };
}

module.exports.getSamplesEmotionRecognizedAs = async function (mainEmotion, recognizedEmotion) {
    const tot = await db('samples').where('samples.emotion', mainEmotion)
                        .join('evaluated', 'samples.id', '=', 'evaluated.sampleid')
                        .count('evaluated.id').first();
    const rec = await db('samples').where('samples.emotion', mainEmotion)
                        .join('evaluated', 'samples.id', '=', 'evaluated.sampleid')
                        .where('evaluated.emotion', recognizedEmotion).count('evaluated.id').first();
    const res = (rec.count / tot.count) * 100;
    return { value: res };
}


/********************** 
 **** CRUD section
***********************/

/**** SENTENCES ****/

// POST
module.exports.postSentences = function (sentences) {
    return db('sentences')
        .insert(sentences);
}
// DELETE
module.exports.deleteSentence = function (id) {
    return db('sentences')
        .where('id', id)
        .del();
}
// GET
module.exports.getSentence = function (id) {
    return db('sentences')
        .where('id', id);
}
// GET ALL
module.exports.getAllSentences = function () {
    return db('sentences');
}
// UPDATE
module.exports.updateSentence = function (id, updates) {
    return db('sentences')
        .where('id', id)
        .update(updates);
}

/**** SAMPLES ****/

// GET
module.exports.getAllSamples = function () {
    return db('samples');
}

// GET USER SAMPLES
module.exports.getSamplesOfUser = function (username) {
    return db('samples')
        .where('speaker', username);
}

// UPDATE
module.exports.updateSample = function (id, updates) {
    return db('samples')
        .where('id', id)
        .update(updates);
}

// DELETE
module.exports.deleteSample = function (id) {
    return db('samples')
        .where('id', id)
        .del();
}

/**** EVALUATED ****/

// GET
module.exports.getAllEvaluations = function () {
    return db('evaluated');
}

// GET USER EVALUATIONS
module.exports.getEvaluationsOfUser = function (username) {
    return db('evaluated')
        .where('evaluator', username);
}

// UPDATE
module.exports.updateEvaluation = function (id, updates) {
    return db('evaluated')
        .where('id', id)
        .update(updates);
}

// DELETE
module.exports.deleteEvaluation = function (id) {
    return db('evaluated')
        .where('id', id)
        .del();
}