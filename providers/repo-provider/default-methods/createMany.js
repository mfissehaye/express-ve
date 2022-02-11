module.exports = (Model) => {
    return (entries) => {
        return Model.insertMany(entries)
    }
}
