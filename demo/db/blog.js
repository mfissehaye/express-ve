module.exports = (mongoose) => {
    const BlogSchema = new mongoose.Schema({
        title: {type: String, required: true},
        content: {type: String, required: true},
    }, { timestamps: true })

    mongoose.model('Blog', BlogSchema)
}