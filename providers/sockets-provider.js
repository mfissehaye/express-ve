const {Server} = require("socket.io");
const {createAdapter} = require("@socket.io/mongo-adapter");
module.exports = async (c) => {
    const SOCKET_ADAPTER_COLLECTION = "socket.io-adapter-events"
    let socketAdapterCollection
    try {
        await Promise.all([
            c.db.createCollection(SOCKET_ADAPTER_COLLECTION, {capped: true, size: 1000})
        ])
    } catch (e) {
        // Collection already exists
    }

    socketAdapterCollection = c.db.collection(SOCKET_ADAPTER_COLLECTION)
    const allCollections = (await c.db.listCollections().toArray())

    c.service('sockets', (_c) => {
        const io = new Server(_c.app.server, {
            path: '/ws/',
            serveClient: false,
            transports: ['websocket'],
            cors: {origin: '*', methods: ['GET', 'POST']}
        })

        if (socketAdapterCollection) {
            io.adapter(createAdapter(socketAdapterCollection))
        }

        // create watchers for a collection whenever there are subscriptions or un-subscriptions
        allCollections.forEach(collection => {
            if (collection.name === SOCKET_ADAPTER_COLLECTION) return
            const collectionName = collection.name
            /*watchers[collectionName] = */
            c.db.collection(collectionName).watch().on('change', async (change) => {
                console.log('Sending updates to room: ', collectionName)
                if (change.operationType === 'insert') {
                    io.to(collectionName).emit(`changes:${collectionName}`, {
                        type: 'insert',
                        path: collectionName,
                        documents: [change.fullDocument]
                    })
                } else if (change.operationType === 'delete') {
                    io.to(collectionName).emit(`changes:${collectionName}`, {
                        type: 'delete',
                        path: collectionName,
                        documents: [change.documentKey._id]
                    })
                }
            })
        })

        io.on('connection', socket => {
            console.log(`Socket ${socket.id} just connected`)
            socket.on('disconnect', async () => {
                console.log(`Socket ${socket.id} disconnected`)
            })

            socket.on('subscribe', path => {
                // register socket.id as a watcher for path if path is valid
                // create a watcher for the collection as long as there are subscribers
                try {
                    const c = _c.db.collection(path)
                    // first return the list of products here
                    c.find({}).toArray()
                        .then(documents => socket.emit(`changes:${path}`, {
                            type: 'insert',
                            path,
                            documents
                        }))

                    // insert the socket id to the subscriptions collection
                    socket.join(path)
                    // subscriptionsCollection.insertOne({path, clientId: socket.id})
                } catch (ex) {
                    console.error(ex)
                    console.error('Something went wrong trying to subscribe to collection ', path)
                }
            })

            socket.on('error', (err) => {
                console.error('Connect error: ', err)
            })
        })
    })
}
