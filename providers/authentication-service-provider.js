// const { ExtractJwt: extractJwt, JwtStrategy } = require('passport-jwt');
// const passport = require('passport');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')

module.exports = (c) => {
  c.service('authentication', (_c) => {
    // const privateKeyFilePath = path.resolve(_c.config.OPENSSH_KEYS_BASE_PATH || '', 'private-key.pem')
    // const publicKeyFilePath = path.resolve(_c.config.OPENSSH_KEYS_BASE_PATH || '', 'public-key.pem')

    let algorithm = 'HS256' // , privateKey, publicKey
    // if(!fs.existsSync(privateKeyFilePath) || !fs.existsSync(publicKeyFilePath)) {
    //   algorithm = 'none'
    // } else {
    //   privateKey = fs.readFileSync(privateKeyFilePath, 'utf8')
    //   publicKey = fs.readFileSync(publicKeyFilePath, 'utf8')
    // }

    const i = 'jwt-node'
    const s = 'jwt-node'
    const a = 'jwt-node'

    const verifyOptions = {
      issuer: i,
      subject: s,
      audience: a,
      expiresIn: '1m',
      algorithm,
    }

    const saltRounds = 10

    const salt = bcrypt.genSaltSync(saltRounds)

    const secret = _c.config.JWT_SECRET || 'mysecret'
    const generateJWT = (payload) => {
      const options = {
        issuer: i,
        subject: s,
        audience: a,
        expiresIn: '8784h',
        algorithm,
      }

      if(payload && payload.exp) delete options.expiresIn

      return jwt.sign(payload, secret, options)
    }

    const verifyJWT = (payload) => {
      return jwt.verify(payload, secret, verifyOptions)
    }

    const hashPassword = (password) => {
      return bcrypt.hashSync(password, salt)
    }

    const authMiddleware = (req, res, next) => {
      let token = req.headers['x-access-token'] || req.headers.authorization || req.body.token
      if(!token) {
        return res.status(401).json({ message: 'No token provided' })
      }

      if(token.startsWith('Bearer ')) {
        token = token.slice(7, token.length)
        if(!token || token === '') res.status(401).json({ message: 'No token provided' })
      }

      const decoded = verifyJWT(token)
      if(!decoded) res.status(403).json({ message: 'invalid signature' })
      if(decoded) res.user = decoded

      res.token = token
      return next()
    }

    const comparePassword = (password1, password2) => {
      return new Promise((resolve, reject) => {
        bcrypt.compare(password1, password2, (err, isValid) => {
          if(err) return reject(err)
          resolve(isValid)
        })
      })
    }

    return {
      hash: hashPassword,
      verify: verifyJWT,
      generateToken: generateJWT,
      middleware: authMiddleware,
      comparePassword
    }
  });
};
