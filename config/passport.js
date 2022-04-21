const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const Usuarios = require('../models/Usuarios');

passport.use(new localStrategy({
        usernameField : 'email',
        passwordField : 'password',
    },
    async(email, password, next) => {
        // este codigo se ejecuta al llenar el formulario
        const usuario = await Usuarios.findOne({
            where: {
                email,
                activo: 1
            }
        })

        // revisar si existe o no
        if(!usuario) return next(null, false, {
            message: 'Ese usuario no existe'
        });

        // si el usuario existe comparar su password
        const verificarPass = usuario.validarPassword(password, this.password);
        // si el password es incorrecto
        if(!verificarPass) return next(null, false, {
            message: 'password incorrecto'
        })
        // todo bien
        return next(null, usuario);
    }
))

passport.serializeUser(function(usuario, cb){
    cb(null, usuario)
})

passport.deserializeUser(function(usuario, cb){
    cb(null, usuario)
})

module.exports = passport;