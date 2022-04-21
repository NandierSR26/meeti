const Grupos = require("../../models/Grupos")
const Meeti = require("../../models/Meeti")
const Usuarios = require("../../models/Usuarios")
const moment = require('moment')
const Sequelize = require('sequelize');
const Categorias = require("../../models/Categorias");
const Comentarios = require("../../models/Comentarios");
const Op = Sequelize.Op;

exports.mostrarMeeti = async (req, res, next) => {
    const meeti = await Meeti.findOne({
        where: {
            slug: req.params.slug
        },
        include: [
            {
                model: Grupos
            },
            {
                model: Usuarios,
                attributes: ['id', 'nombre', 'imagen']
            }
        ]
    });

    
    // si no existe
    if (!meeti) {
        res.redirect('/')
    }

    // consultar por meetis cercanos
    const ubicacion = Sequelize.literal(`ST_GeomFromText( 'POINT( ${meeti.ubicacion.coordinates[0]} ${meeti.ubicacion.coordinates[1]} )' )`);

    // ST_DISTANCES_Sphere = retorna una linea en metros
    const distancia = Sequelize.fn('ST_DistanceSphere', Sequelize.col('ubicacion'), ubicacion);

    // encontrar meetis cercanos
    const cercanos = await Meeti.findAll({
        order: distancia,
        where: Sequelize.where(distancia, { [Op.lte]: 2000 }),
        limit: 3,
        offset: 1,
        include: [
            {
                model: Grupos
            },
            {
                model: Usuarios,
                attributes: ['id', 'nombre', 'imagen']
            }
        ]
    })

    // consultar despues de verificar que existe el meeti
    const comentarios = await Comentarios.findAll({
        where:{
            meetiId: meeti.id
        },
        include: [
            {
                model: Usuarios,
                attributes: ['id', 'nombre', 'imagen']
            }
        ]
    })

    // pasa el resultado a la vista
    res.render('mostrar-meeti', {
        nombrePagina: meeti.titulo,
        meeti,
        comentarios,
        cercanos,
        moment
    })
}

// confirma o cacela si el usuario asistira al meeti
exports.confirmarAsistencia = async (req, res) => {

    const { accion } = req.body;

    if (accion === 'confirmar') {
        // agregar el usuaario
        Meeti.update(
            { 'interesados': Sequelize.fn('array_append', Sequelize.col('interesados'), req.user.id) },
            { 'where': { 'slug': req.params.slug } }
        );
        res.send('has confirmado tu asistencia')
    } else {
        // cancelar la asistencia
        Meeti.update(
            { 'interesados': Sequelize.fn('array_remove', Sequelize.col('interesados'), req.user.id) },
            { 'where': { 'slug': req.params.slug } }
        );
        res.send('has cancelado tu asistencia')
    }

}

// mostrar listado de asitentes
exports.mostrarAsistentes = async(req, res) => {
    const meeti = await Meeti.findOne({
        where: {
            slug: req.params.slug,
        },
        attributes: ['interesados']
    })

    // extraer interesados
    const { interesados } = meeti;

    const asistentes = await Usuarios.findAll({
        attributes: ['nombre', 'imagen'],
        where: {
            id: interesados
        }
    })

    // crear la vista y pasar datos
    res.render('asistentes-meeti', {
        nombrePagina: 'Listado asistentes meeti',
        asistentes
    })
}

// muestra los meetis mostrados por Categoria
exports.mostrarCategoria = async(req, res, next) => {
    const categoria = await Categorias.findOne({
        attributes: ['id', 'nombre'],
        where: {
            slug: req.params.categoria
        }
    })

    const meetis = await Meeti.findAll({
        order: [
            ['fecha', 'ASC'],
            ['hora', 'ASC']
        ],
        include: [
            {
                model: Grupos,
                where: {categoriaId: categoria.id}
            },
            {
                model: Usuarios,
            }
        ]
    })

    res.render('categoria', {
        nombrePagina: `Categoria: ${categoria.nombre}`,
        meetis,
        moment
    })

    console.log(categoria.id);
}