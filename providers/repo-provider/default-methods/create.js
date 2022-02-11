module.exports = (Model) => {
    return (data) => {
        return Model.create(data)
    }
}
