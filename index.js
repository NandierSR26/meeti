const express = require('express');
const router = require('./routes/index');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const expressValidator = require('express-validator');
const passport = require('./config/passport');

// configuracion y modelos de la db
const db  = require('./config/db');
    require('./models/Usuarios');
    require('./models/Categorias');
    require('./models/Grupos');
    require('./models/Meeti');
    require('./models/Comentarios');
    db.sync().then(() => console.log('DB conectada')).catch( error => console.log(error))

// variables de desarrollo
require('dotenv').config({path: 'variables.env'});

// crear la aplicacion de express
const app = express();

// bosyParser leer formularios
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// express validator
app.use(expressValidator());


// habilitar ejs como template engine
app.use(expressLayouts);
app.set('view engine', 'ejs');

// ubicacion de las vistas
app.set('views', path.join(__dirname, './views'));

// archivos estaticos
app.use(express.static('public'));

// habilitar cookie parser
app.use(cookieParser('secret'));

// crear la sesion
app.use(session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false
}));

// inicializar passport
app.use(passport.initialize());
app.use(passport.session());

// agrega flash messages
app.use(flash());

// middleware(usuario logueado, flash messages, fecha actual)
app.use((req, res, next) => {
    res.locals.usuario = {...req.user} || null;
    res.locals.mensajes = req.flash();
    const fecha = new Date();
    res.locals.year = fecha.getFullYear();
    next();
});

// Routing
app.use('/', router());

// leer el host y el puerto
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 5000;


app.listen(port, host, () => {
    console.log('Sevidor funcionando en el puerto: ', port);
})