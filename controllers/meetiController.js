const Grupos = require('../models/Grupos');
const Meeti = require('../models/Meeti');

// muestra el formulario para nuevos meeti
exports.formNuevoMeeti = async (req, res) => {
    const grupos = await Grupos.findAll({ where: { usuarioId: req.user.id } });

    res.render('nuevo-meeti', {
        nombrePagina: 'Crear Nuevo Meeti',
        grupos
    })
}

// Inserta nuevos Meeti en la BD
exports.crearMeti = async (req, res) => {
    // obtener los datos
    const meeti = req.body;

    // asignar el usuario
    meeti.usuarioId = req.user.id;

    // almacena la ubicación con un point
    const point = { type: 'Point', coordinates: [parseFloat(req.body.lat), parseFloat(req.body.lng)] };
    meeti.ubicacion = point;

    // cupo opcional
    if (req.body.cupo === '') {
        meeti.cupo = 0;
    }

    // almacenar en la BD
    try {
        await Meeti.create(meeti);
        req.flash('exito', 'Se ha creado el Meeti Correctamente');
        res.redirect('/administracion');
    } catch (error) {
        if (error.length > 0) {
            // extraer el message de los errores
            const erroresSequelize = error.errors.map(err => err.message);
            req.flash('error', erroresSequelize);
            res.redirect('/nuevo-meeti');
        }
    }
}

// Sanitiza los meetis
exports.sanitizarMeeti = (req, res, next) => {
    req.sanitizeBody('titulo');
    req.sanitizeBody('invitado');
    req.sanitizeBody('cupo');
    req.sanitizeBody('fecha');
    req.sanitizeBody('hora');
    req.sanitizeBody('direccion');
    req.sanitizeBody('ciudad');
    req.sanitizeBody('estado');
    req.sanitizeBody('pais');
    req.sanitizeBody('lat');
    req.sanitizeBody('lng');
    req.sanitizeBody('grupoId');

    next();

}

// muestra el form para editar meetis
exports.formEditarMeeti = async (req, res, next) => {
    const consultas = [];

    consultas.push(Grupos.findAll({ where: { usuarioId: req.user.id } }));
    consultas.push(Meeti.findByPk(req.params.id));

    // retornar promise
    const [grupos, meeti] = await Promise.all(consultas);

    if (!grupos || !meeti) {
        req.flash('error', 'Operacion no valida');
        res.redirect('/nuevo-meeti');
        return next();
    }

    // mostramos la vista
    res.render('editar-meeti', {
        nombrePagina: `Editar meeti: ${meeti.titulo}`,
        grupos,
        meeti
    })
}

// almacena los cambios en el meeti
exports.editarMeeti = async (req, res, next) => {
    const meeti = await Meeti.findOne({
        where: {
            id: req.params.id,
            usuarioId: req.user.id
        }
    })

    if(!meeti){
        req.flash('error', 'Operacion no valida');
        res.redirect('/nuevo-meeti');
        return next();
    }

    // asigna los valores
    const { grupoId, titulo, invitado, fecha, hora, cupo, descripcion, direccion, ciudad, estado, pais, lat, lng } = req.body

    meeti.grupoId = grupoId;
    meeti.titulo = titulo;
    meeti.invitado = invitado;
    meeti.fecha = fecha;
    meeti.hora = hora;
    meeti.cupo = cupo;
    meeti.descripcion = descripcion;
    meeti.direccion = direccion;
    meeti.ciudad = ciudad;
    meeti.estado = estado;
    meeti.pais = pais;

    // asignar point
    const point = {type: 'Point', coordinates: [ parseFloat(lat), parseFloat(lng) ]};

    meeti.ubicacion = point;

    // almacenarlo en la base de datos
    await meeti.save();
    req.flash('exito', 'Cambios guardados correctamente');
    res.redirect('/administracion')
}

// muestra un form para eliminar meetis
exports.formEliminarMeeti = async(req, res, next) => {
    const meeti = await Meeti.findOne({
        where: {
            id: req.params.id,
            usuarioId: req.user.id
        }
    })

    if(!meeti){
        req.flash('error', 'operacion no valida');
        res.redirect('/administracion');
        return next();
    }

    res.render('eliminar-meeti', {
        nombrePagina: `Eliminar meeti: ${meeti.titulo}`
    })

}

// elimina meetis de ls db
exports.eliminarMeeti = async(req, res) => {
    await Meeti.destroy({
        where: {
            id: req.params.id
        }
    })

    req.flash('exito', 'Meeti eliminado');
    res.redirect('/administracion')
}