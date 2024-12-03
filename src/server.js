import sqlite3 from 'sqlite3'
import express from 'express'
import jwt from 'jsonwebtoken'

const HOST = 'http://127.0.0.1'
const PORT = 6969

const db = new (sqlite3.verbose()).Database('pampas.db')

const server = express()

server.use(express.json())

server.get('/files/:id', async (req, res) => {
    const token = (req.headers.authorization || '').split(' ').pop()

    db.run(`
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                secret TEXT NOT NULL,
                token TEXT NOT NULL,
                createdAt TEXT NOT NULL
            );
        `, () => {
            const fileId = Number(req.params.id)

            db.get('SELECT * FROM files WHERE token = ? AND id = ?', [token, fileId], (error, result) => {
                if (!result) {
                    res
                        .status(403)
                        .json({
                            success: false
                        })
                } else {
                    res.json({
                        success: true,
                        data: result ?? null
                    })
                }
            })
        })
})

server.post('/files', async (req, res) => {
    const name = req.body.name
    const secret = req.body.secret || (Math.floor(Math.random() * (999_999_999 - 100_000_000)) + 100_000_000).toString()

    const token = jwt.sign(
        { name },
        'MYSECRETKEY',
        { algorithm: 'HS256' }
    )

    db.run('INSERT INTO files (name, secret, token, createdAt) VALUES (?, ?, ?, ?)', [name, secret, token, new Date().toISOString()], function (error) {
        if (error) {
            console.error(error)
            res
                .status(500)
                .json({
                    success: false,
                })
        } else {
            res.json({
                success: true,
                data: {
                    url: `${HOST}:${PORT}/files/${this.lastID}`,
                    token
                }
            })   
        }
    })    
})

server.delete('/files/:id', async (req, res) => {
    const token = (req.headers.authorization || '').split(' ').pop()
    const fileId = Number(req.params.id)

    db.run('DELETE FROM files WHERE token = ? AND id = ?', [token, fileId], function (error) {
        if (error) console.error(error)

        if (this.changes === 0) {
            res
                .status(403)
                .json({
                    success: false
                })
        } else {
            res
                .status(204)
                .json({
                    success: true,
                })
        }
    })
})

server.listen(PORT, () => console.log(`Listening on port ${PORT}`))