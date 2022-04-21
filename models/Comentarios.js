const Sequelize = require('sequelize');
const db = require('../config/db');
const Meeti = require('./Meeti');
const Usuarios = require('./Usuarios');

const Comentarios = db.define('comentario', {
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mensaje: {
        type: Sequelize.TEXT,
    }
}, {
    timestamps: false
});

Comentarios.belongsTo(Usuarios);
Comentarios.belongsTo(Meeti);

module.exports = Comentarios