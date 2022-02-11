const HttpError = require('../../../exceptions/http-error')

module.exports = (Model, modelName) => {
    return async (id) => {
        const item = await Model.findOne({ _id: id })
        if(item === null) throw new HttpError(404, `${modelName} with id ${id} not found`)
        return item
    }
}
