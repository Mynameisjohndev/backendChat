const express = require('express');
const app = express();
const socket = require('socket.io');
const cors = require('cors')
const User = require('./models/User');
const Message = require('./models/Message');
const Sala = require('./models/Sala');

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET', 'POST', 'PUT', 'DELETE');
    res.header('Access-Control-Allow-Headers', "X-PINGOTHER, Content-Type, Authorization")
    app.use(cors());
    next();
});

app.get('/', function (req, res) {
    res.send('Bem vindo!')
});

app.get('/listar-messsages/:sala', async (req, res) => {
    const { sala } = req.params;

    await Message.findAll({
        order: [['id', 'ASC']],
        where: {
            sala: sala
        },
        include: [{
            model: User
        }, {
            model: Sala
        }]
    })
        .then((messages) => {
            return res.json({
                error: false,
                messages
            });
        })
        .catch((err) => {
            return res.status(400).json({
                error: true,
                message: "Não foi possivel carregar as menssagens"
            });
        });
});


app.post('/cadastrar-message', async (req, res) => {
    await Message.create(req.body)
        .then(() => {
            return res.json({
                erro: false,
                message: "Mensagem cadastradro com sucesso!"
            });
        })
        .catch(() => {
            return res.status(400).json({
                erro: true,
                message: "Não foi possível cadastrar a mensagem!"
            });
        });
});

app.post('/cadastrar-sala', async (req, res) => {
    await Sala.create(req.body)
        .then(() => {
            return res.json({
                erro: false,
                message: "Sala cadastradro com sucesso!"
            });
        })
        .catch(() => {
            return res.status(400).json({
                erro: true,
                message: "Não foi possível cadastrar a sala!"
            });
        });
});

app.post('/cadastrar-usuario', async (req, res) => {
    var dados = req.body;
    // return res.json({
    //     dados: dados
    // });

    const usuario = await User.findOne({
        where: {
            email: dados.email
        }
    });

    if (usuario) {
        return res.status(400).json({
            erro: true,
            message: "Este e-mail já esta cadastrado!"
        });
    }

    await User.create(dados)
        .then(() => {
            return res.json({
                erro: false,
                message: "Usuaário cadastradro com sucesso!"
            });
        })
        .catch(() => {
            return res.status(400).json({
                erro: true,
                message: "Não foi possível cadastrar o usuário!"
            });
        });
});

app.post('/validar-acesso', async (req, res) => {
    const usuario = await User.findOne({
        attributes: ['id', 'name'],
        where: {
            email: req.body.email
        }
    });
    if (usuario === null) {
        return res.status(400).json({
            error: true,
            mensagem: "Erro: usuário não encontrado"
        })
    }
    return res.json({
        error: false,
        mensagem: "Login realizado com sucesso!",
        usuario
    })
});

const server = app.listen(8080, () => {
    console.log('Servidor iniciado na porta 8080')
});

io = socket(server, { cors: { origin: "*" } });

io.on('connect', (socket) => {
    //console.log(socket.id);

    socket.on("sala_conectada", (dados) => {
        //console.log("Sala conectada" + dados);
        socket.join(dados);
    });

    socket.on("enviar_mensagem", (dados) => {
        console.log(dados);

        Message.create({
            mensagem: dados.conteudo.mensagem,
            sala: dados.sala,
            usuarioId: dados.conteudo.usuario.id
        })

        socket.to(dados.sala).emit("mensagem_dados", dados.conteudo);
        //console.log(dados.conteudo);
    });

});

