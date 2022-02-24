const _get = require('lodash/get')

/** @var permissionType is one of 'read', 'write', 'delete' */
module.exports = (container, repo, permissionType) => async (req, res, next) => {
    const { verify } = container.authentication
    const db = await container.db
    if(_get(container, `config.permissions.${repo}.${permissionType}`, false))
        return next()

    // const UserModel = model('User')
    if(req.headers && req.headers.authorization) {
        let authorization = req.headers.authorization, decoded;
        try {
            decoded = verify(authorization)
            const user = await db.find(decoded.id) // .populate('role')
            console.log(user)
            const modelPermissions = user.role.permissions.find(p => new RegExp(repo, 'ig').test(p))
            if(!modelPermissions) return res.sendStatus(401)
            if(modelPermissions[permissionType]) return next()
        } catch(ex) {
            console.error(ex)
            return res.sendStatus(401)
        }
    }
    return res.sendStatus(401)
}