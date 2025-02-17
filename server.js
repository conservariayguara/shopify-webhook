const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Rota para a raiz (apenas para testar)
app.get('/', (req, res) => {
    res.send('Servidor está funcionando!');
});

// Rota para receber webhooks do Shopify
app.post('/webhook', (req, res) => {
    console.log('Webhook recebido!');

    if (!req.body) {
        console.log('Erro: Corpo da requisição vazio.');
        return res.status(400).send('Corpo da requisição vazio.');
    }

    const orderData = req.body;
    console.log('Dados do pedido:', orderData);

    if (orderData && orderData.customer) {
        console.log('Dados do cliente:', orderData.customer);

        // Capturar o fbclid (se estiver presente na URL de origem)
        let fbc = null;
        if (orderData.referring_site && orderData.referring_site.includes('fbclid=')) {
            const url = new URL(orderData.referring_site);
            const fbclid = url.searchParams.get('fbclid');
            if (fbclid) {
                fbc = `fb.1.${Math.floor(Date.now() / 1000)}.${fbclid}`;
            }
        }

        const event_data = {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            user_data: {
                em: hash('sha256', orderData.customer.email),
                ph: hash('sha256', orderData.customer.phone),
                fbc: fbc  // Adiciona o FBC se disponível
            },
            custom_data: {
                currency: orderData.currency,
                value: parseFloat(orderData.total_price)
            }
        };

        console.log('Dados enviados ao Facebook:', event_data);

        axios.post('https://graph.facebook.com/v12.0/1128466078514544/events', {
            data: [event_data]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.FACEBOOK_ACCESS_TOKEN}`,
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
