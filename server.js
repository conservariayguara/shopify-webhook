const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Rota para receber webhooks do Shopify
app.post('/webhook', (req, res) => {
    console.log('Webhook recebido!'); // Confirma que a requisição chegou

    if (!req.body) {
        console.log('Erro: Corpo da requisição vazio.');
        return res.status(400).send('Corpo da requisição vazio.');
    }

    const orderData = req.body;
    console.log('Dados do pedido:', orderData); // Exibe os dados recebidos

    if (orderData && orderData.customer) {
        console.log('Dados do cliente:', orderData.customer);

        const event_data = {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            user_data: {
                em: hash('sha256', orderData.customer.email),
                ph: hash('sha256', orderData.customer.phone)
            },
            custom_data: {
                currency: orderData.currency,
                value: parseFloat(orderData.total_price)
            }
        };

        console.log('Dados enviados ao Facebook:', event_data); // Exibe os dados que serão enviados

        axios.post('https://graph.facebook.com/v12.0/1128466078514544/events', {
            data: [event_data]
        }, {
            headers: {
                'Authorization': 'Bearer EAAQcF4xrFJ0BOZBZBlDZBikeMDw4unN8787HzdX0iWUxlDfXDzwZBfjvTw3CctDOH4ZAtHY9N6SaRt63wkawP6YokMNWmOkiJxvl4O4C36o1Be9aoBdmD9maVys0DrpkdT0FYa4M54qRQ779aqfBuGnn9Tja8260i0sT25ADeMrj1OXWvaiNt4TzjgRLFcQPN0AZDZD',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            console.log('Resposta do Facebook:', response.data);
        })
        .catch(error => {
            console.error('Erro ao enviar dados:', error.response.data);
        });
    } else {
        console.log('Erro: Dados do cliente não encontrados.');
    }

    res.status(200).send('Webhook recebido com sucesso!');
});

// Função para gerar hash SHA-256
function hash(algorithm, value) {
    return require('crypto').createHash(algorithm).update(value).digest('hex');
}

// Inicia o servidor na porta 3000
const PORT = process.env.PORT || 3000; // Usa a porta do ambiente ou 3000 como fallback
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);

// Rota para a raiz (apenas para testar)
app.get('/', (req, res) => {
    res.send('Servidor está funcionando!');
});



