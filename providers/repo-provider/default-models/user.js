module.exports = (mongoose) => {
    const UserSchema = new mongoose.Schema({
        name: String,
        email: {
            type: String,
            unique: true
        },
        password: String,
        role: {
            type: mongoose.Types.ObjectId,
            ref: 'Role',
            required: true,
        }
    }, {
        timestamps: true
    })

    mongoose.model('User', UserSchema)
}
