const Categorias = require('../models/Categorias');
const Grupos = require('../models/Grupos');

const multer = require('multer');
const shortid = require('shortid');
const fs = require('fs');

const configuracionMulter = {
    limits: { fileSize: 3000000 },
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, next) => {
            next(null, __dirname+'/../public/uploads/grupos');
        },
        filename: (req, file, next) => {
            const extension = file.mimetype.split('/')[1];
            next(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, next){
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
            // el formato es valido
            next(null, true)
        } else {
            // el formato no es valido
            next(new Error('formato no valido'), false)
        }
    }
}

const upload = multer(configuracionMulter).single('imagen');

// sube imagen al servidor
exports.subirImagen = (req, res, next) =>{
    upload(req, res, function(error){
        if (error) {
            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    req.flash('error','el archivo es muy grande');
                } else {
                    req.flash('error', 'error.message')
                }
            } else if(error.hasOwnProperty('message')){
                req.flash('error', error.message)
            }
            res.redirect('back');
            return;
        } else {
            next();
        }
    })
}


exports.formNuevoGrupo = async(req, res) => {
    const categorias = await Categorias.findAll();

    res.render('nuevo-grupo', {
        nombrePagina: 'Crea un Nuevo Grupo',
        categorias
    })
}

exports.crearGrupo = async(req, res) => {
    // sanitizar 
    req.sanitizeBody('nombre');
    req.sanitizeBody('url');

    const grupo = req.body;
    // console.log(req.body);

    // almacena el usuario autenticado como creador del grupo
    grupo.usuarioId = req.user.id;

    // leer la imagen
    if(req.file){
        grupo.imagen = req.file.filename
    }
    
    try {
        // almacenar grupos en la db
        await Grupos.create(grupo);
        req.flash('exito', 'Se ha creado el grupo correctamente');
        res.redirect('/administracion');

        
    } catch (error) {
        console.log(error);

        // if(error.errors.length === 0){
        //     req.flash('error', 'algo salio mal, intentalo de nuevo');
        //     return res.redirect('/nuevo-grupo')
        // }

        // // extraer el message de los errores
        // const erroresSequelize = error.errors.map(err => err.message);

        // req.flash('error', erroresSequelize);
        // res.redirect('/nuevo-grupo')
    }
}

exports.formEditarGrupo = async(req, res) => {
    const consultas = [];
    consultas.push( Grupos.findByPk(req.params.grupoId) );
    consultas.push( Categorias.findAll() );

    // promise con await
    const [ grupo, categorias ] = await Promise.all(consultas);

    res.render('editar-grupo', {
        nombrePagina: `Editar Grupo : ${grupo.nombre}`,
        grupo,
        categorias
    })
}

// guarda los cambios en l BD
exports.EditarGrupo = async(req, res, next) => {
    const grupo = await Grupos.findOne({where: { id: req.params.grupoId, usuarioId : req.user.id}});

    // si no existe el grupo o no es el dueño
    if(!grupo){
        req.flash('error', 'Operacion no valida');
        res.redirect('/administracion');
        return next();
    }

    // leer los valores
    const { nombre, categoriaId, descripcion, url } = req.body;

    // asignar valores
    grupo.nombre = nombre;
    grupo.categoriaId = categoriaId;
    grupo.descripcion = descripcion;
    grupo.url = url;

    // guardar en la bd
    await grupo.save();
    req.flash('exito', 'Cambios almacenados correctamente');
    res.redirect('/administracion');
}

// muestra el formularo para editar la imagen del grupo
exports.fromEditarImagen = async(req, res, next) => {
    const grupo = await Grupos.findOne({where: { id: req.params.grupoId, usuarioId : req.user.id}});
    
    res.render('imagen-grupo', {
        nombrePagina: `Editar imagen del grupo: ${grupo.nombre}`,
        grupo
    })
}

// almacena la imagen nueva en la bd y elimina la enterios
exports.editarImagen = async(req, res, next) => {
    const grupo = await Grupos.findOne({where: { id: req.params.grupoId, usuarioId : req.user.id}});

    if(!grupo){
        req.flash('error', 'Operacion no valida');
        res.redirect('/iniciar-sesion');
        return next();
    }

    // verificar que el archivo sea nuevo
    // if(req.file){
    //     console.log(req.file.filename);
    // }

    // revisar que exista un archivo anterior
    // if(grupo.imagen){
    //     console.log(grupo.imagen);
    // }

    // si hay imagen anterior y nueva significa que vamos a borrar la anterior
    if(req.file && grupo.imagen){
        const imagenAnteriorPath = __dirname+`/../public/uploads/grupos/${grupo.imagen}`;

        // eliminar archivo 
        fs.unlink(imagenAnteriorPath, (error) => {
            if (error) {
                console.log(error);
            }
            return;
        })
    }

    // si hay una imagen nueva se guarda
    if(req.file){
        grupo.imagen = req.file.filename;
    }

    // guardar en la db
    await grupo.save();
    req.flash('exito', 'Cambios almacenados correctamente');
    res.redirect('/administracion');
}

// muestra formulario para eliminar grupos
exports.formEliminarGrupo = async(req, res, next) => {
    const grupo = await Grupos.findOne({where: {id: req.params.grupoId, usuarioId: req.user.id}});

    if(!grupo){
        req.flash('error', 'Operacion no valida');
        res.redirect('/administracion');
        return next();
    }

    // ejecutar la vista
    res.render('eliminar-grupo', {
        nombrePagina: `Eliminar Grupo: ${grupo.nombre}`
    })
}

// elimina el grupo e imagen
exports.eliminarGrupo = async(req, res, next) => {
    const grupo = await Grupos.findOne({where: {id: req.params.grupoId, usuarioId: req.user.id}});

    if(!grupo){
        req.flash('error', 'Operacion no valida');
        res.redirect('/administracion');
        return next();
    }

    if(grupo.imagen){
        const imagenAnteriorPath = __dirname+`/../public/uploads/grupos/${grupo.imagen}`;

        // eliminar archivo 
        fs.unlink(imagenAnteriorPath, (error) => {
            if (error) {
                console.log(error);
            }
            return;
        })
    }

    // eliminar el grupo
    await Grupos.destroy({
        where: {
            id: req.params.grupoId
        }
    })

    // redireccionar
    req.flash('exito', 'Grupo eliminado');
    res.redirect('/administracion');
}