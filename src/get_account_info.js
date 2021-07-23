
module.exports = (ws) => {



    const RippleAPI = require('ripple-lib').RippleAPI;

    const api = new RippleAPI({
        server: 'wss://s.altnet.rippletest.net:51233'
    })

    ws.on("message", data => {
        api.connect().then(()=> {
            const address = data
            console.log(' getting account info for', address);
            if (address !== 'test'){
                return api.getAccountInfo(address);
            }
          
          }).then(info => {
            ws.send(JSON.stringify(info))
            console.log('getAccountInfo done');
          
          }).then(() => {
            return api.disconnect();
          }).then(() => {
            console.log('done and disconnected.');
          }).catch(console.error);
    })



} // end of export





