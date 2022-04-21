const Comentarios = require("../../models/Comentarios");
const Meeti = require("../../models/Meeti");

exports.agregarComentario = async(req, res, next) => {
    // obtener el comentario
    const { comentario } = req.body;

    // crear coemtario en la db
    await Comentarios.create({
        mensaje: comentario,
        usuarioId: req.user.id,
        meetiId: req.params.id
    })

    // redireccionar a la misma pagina
    res.redirect('back');
    next();
}

// elimina un comentario en la db
exports.eliminarComentario = async (req, res, next) => {
    const { comentarioId } = req.body;

    // consultar el comentario
    const comentario = await Comentarios.findOne({
        where: {
            id: comentarioId
        }
    })
    

    // verificar si existe el comentario
    if(!comentario){
        res.status(404).send('Accion no valida')
        return next();
    }

    // consultar el meeti al que pertenece el comentario
    const meeti = await Meeti.findOne({
        where: {
            id: comentario.meetiId
        }
    })

    // verificar que quien lo borra sea el creador
    if(comentario.usuarioId === req.user.id || meeti.usuarioId === req.user.id){
        await Comentarios.destroy({
            where: {
                id: comentario.id
            }
        })
        res.status(200).send('Eliminado correctamente')
        return next()
    } else {
        res.status(403).send('Accion no valida')
        return next()
    }
}