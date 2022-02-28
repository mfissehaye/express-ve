module.exports = (db, Model) => {
    return (data) => {
        return db.collection(Model).insertOne(data)
    }
}
