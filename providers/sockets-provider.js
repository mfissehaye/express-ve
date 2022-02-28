const {Server} = require("socket.io")
const {createAdapter} = require("@socket.io/mongo-adapter")
const hash = require('object-hash')
const _isEmpty = require('lodash/isEmpty')
module.exports = async (c) => {
    const SOCKET_ADAPTER_COLLECTION = "socket.io_adapter_events"
    const FILTERED_ROOMS_COLLECTION = "filtered_rooms"
    let socketAdapterCollection
    try {
        await Promise.all([
            c.db.createCollection(SOCKET_ADAPTER_COLLECTION, {capped: true, size: 4096, max: 1000})
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
        // allCollections.forEach(collection => {
        //     if (collection.name === SOCKET_ADAPTER_COLLECTION) return
        //     const collectionName = collection.name
        //     /*watchers[collectionName] = */
        //     c.db.collection(collectionName).watch().on('change', async (change) => {
        //         console.log('Sending updates to room: ', collectionName)
        //         if (change.operationType === 'insert') {
        //             io.to(collectionName).emit(`changes:${collectionName}`, {
        //                 type: 'insert',
        //                 path: collectionName,
        //                 documents: [change.fullDocument]
        //             })
        //         } else if (change.operationType === 'delete') {
        //             io.to(collectionName).emit(`changes:${collectionName}`, {
        //                 type: 'delete',
        //                 path: collectionName,
        //                 documents: [change.documentKey._id]
        //             })
        //         }
        //     })
        // })

        const watchers = {}
        io.of('/').adapter.on('join-room', async (room, id) => {
            const changeCallback = async (change) => {
                if (change.operationType === 'insert') {
                    io.to(room).emit(`changes:${room}`, {
                        type: 'insert',
                        path: room,
                        documents: [change.fullDocument]
                    })
                } else if (change.operationType === 'delete') {
                    io.to(room).emit(`changes:${room}`, {
                        type: 'delete',
                        path: room,
                        documents: [change.documentKey._id]
                    })
                }
            }

            // check if room is a collection in the database and that watcher is not registered
            if (await c.db.listCollections({name: room}).hasNext()) {
                if (!watchers[room])
                    watchers[room] = c.db.collection(room)
                        .watch().on('change', changeCallback)
            } else {
                // check if it's in the filtered rooms collection
                const roomDoc = await c.db.collection(FILTERED_ROOMS_COLLECTION).findOne({room})
                if (roomDoc && roomDoc.path && !watchers[room]) {
                    watchers[room] = c.db.collection(roomDoc.path)
                        .watch([{$match: roomDoc.filters}]).on('change', changeCallback)
                }
            }
        })

        io.of('/').adapter.on('leave-room', (room, id) => {
            const listenersCount = io.sockets.adapter.rooms.get(room).size
            if (listenersCount === 0 && watchers[room]) {
                // close the watcher to avoid save resources
                watchers[room].close()
                // Make sure you delete the watcher so it can be created when a room is joined
                delete (watchers[room])
                c.db.collection(FILTERED_ROOMS_COLLECTION).deleteOne({room})
            }
        })

        io.on('connection', socket => {
            console.log(`Socket ${socket.id} just connected`)
            socket.on('disconnect', async () => {
                console.log(`Socket ${socket.id} disconnected`)
            })

            socket.on('subscribe', ({path, filters, limit}) => {
                if (!path) return

                // register socket.id as a watcher for path if path is valid
                // create a watcher for the collection as long as there are subscribers
                try {
                    const c = _c.db.collection(path)
                    // first return the list of products here
                    c.find(filters).limit(limit || 0).toArray()
                        .then(documents => socket.emit(`changes:${path}`, {
                            type: 'insert',
                            path,
                            documents
                        }))

                    // insert the socket id to the subscriptions collection
                    if (!_isEmpty(filters)) {
                        const roomId = hash(filters)
                        _c.db.collection(FILTERED_ROOMS_COLLECTION).insertOne({
                            room: `${path}:${roomId}`,
                            path,
                            filters
                        }).then(() => {
                            console.log(`Joining socket: ${path}:${roomId}`)
                            socket.join(`${path}:${roomId}`)
                        })
                    } else {
                        socket.join(path)
                    }
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
