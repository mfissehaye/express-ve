module.exports = (mongoose) => {
    const PermissionSchema = new mongoose.Schema({
        model: String,
        read: Boolean,
        write: Boolean,
        delete: Boolean,
    }, { _id: false })

    const RoleSchema = new mongoose.Schema({
        name: String,
        permissions: [PermissionSchema]
    })

    mongoose.model('Role', RoleSchema)
}
