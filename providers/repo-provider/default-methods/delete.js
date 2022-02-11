module.exports = (Model) => {
    return (id) => {
        return Model.remove({ _id: id })
    }
}
