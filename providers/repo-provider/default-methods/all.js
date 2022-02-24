const _omit = require('lodash/omit')
const _pick = require('lodash/pick')

module.exports = (db, Model) => {
    return async (params) => {
        let cursor
        try {
            const modelCollection = db.collection(Model)
            cursor = await modelCollection.find()
            return await cursor.toArray()
        } finally {
            if (cursor) cursor.close()
        }

        const modelFields = Object.keys(_omit(Model.schema.paths, ['_id', '__v']))

        const limit = parseInt(params.limit)
        const sortBy = params.sortBy || 'createdAt'
        const sortOrder = params.sortOrder ? 1 : -1
        const page = parseInt(params.page) || 1
        const populates = params.populate ? params.populate.split(',') : null;
        const queryFields = _pick(params, modelFields)

        let dbQuery = Model.find(queryFields);

        if (params.page) {
            dbQuery = dbQuery.sort({createdAt: -1})
                .skip((page - 1) * limit)

            if (limit) dbQuery = dbQuery.limit(limit)

            if (populates) {
                populates.forEach(p => {
                    dbQuery.populate(p)
                })
            }
            const [results, total] = await Promise.all([dbQuery, await Model.countDocuments({})])
            return {results, page, total}
        }

        dbQuery = dbQuery
            .sort({createdAt: -1})

        if (limit) dbQuery = dbQuery.limit(limit)

        if (populates) {
            populates.forEach(p => {
                dbQuery.populate(p)
            })
        }

        return dbQuery
    }
}
