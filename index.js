const webSocket = require('ws');
const RippleAPI = require('ripple-lib').RippleAPI;

    const api = new RippleAPI({
        server: 'wss://s.altnet.rippletest.net:51233'
    })

const ws1_port = 8080;
const ws1 = new webSocket.Server({ port: ws1_port });

// spin the server

ws1.on('connection', ws => {
    // console.log('Client connected on port:', ws1_port)

    
    ws.on("message", data => {
        api.connect().then(()=> {
            console.log('wallet *', data)
            address = data
            if (data !== ''){
                console.log(' - Getting account info');
                return api.getAccountInfo(address);
            }
          
          }).then(info => {
            ws.send(JSON.stringify(info))
            console.log(' - Done');
          
          }).then(() => {
            return api.disconnect();
          }).then(() => {
            console.log(' - Disconnected');
          }).catch(console.error);

        //   api.disconnect()
    })

    

    
    
    ws.on('close', () => {
        console.log('Client disconnected')
    })
    
    
})







