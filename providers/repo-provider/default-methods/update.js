module.exports = (Model) => {
    return (id, data) => {
        return Model.findOneAndUpdate({ _id: id }, data)
    }
}
