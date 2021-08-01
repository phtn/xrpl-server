const webSocket = require("ws");
const RippleAPI = require("ripple-lib").RippleAPI;

const api = new RippleAPI({
  server: "wss://s.altnet.rippletest.net:51233",
});

const port = 8080;

// spin up the server
const ws = new webSocket.Server({ port });

ws.on("connection", (socket) => {
  socket.on("message", (data) => {
    const clientData = JSON.parse(data);

    switch (clientData[0].type) {
      case "GET_ACCOUNT_INFO": {
        console.log("type:", clientData);
        api
          .connect()
          .then(() => {
            console.log("wallet :", clientData[1]);
            address = clientData[1];
            if (data !== "") {
              console.log(" - Getting account info ");
              return api.getAccountInfo(address);
            }
            api.disconnect();
          })
          .then((info) => {
            socket.send(JSON.stringify(info));
            console.log(" - Done");
            api.disconnect();
          })
          .then(() => {
            api.disconnect();
          })
          .then(() => {
            console.log(" - Disconnected");
          })
          .catch(console.error);
        break;
      }

      case "SEND_PAYMENT": {
        clientData[1].Amount = api.xrpToDrops(clientData[1].Amount);

        api.connect();
        api.on("connected", async () => {
          const preparedTx = await api.prepareTransaction(clientData[1], {
            maxLedgerVersionOffset: 75,
          });
          const maxLedgerVersion = preparedTx.instructions.maxLedgerVersion;
          const signed = api.sign(preparedTx.txJSON, clientData[2].secret);
          const txID = signed.id;
          const tx_blob = signed.signedTransaction;
          console.log(preparedTx.txJSON);
          console.log(txID);
          console.log(tx_blob);

          // const earliestLedgerVersion = (await api.getLedgerVersion()) + 1;
          const result = await api.submit(tx_blob);
          console.log("Tentative result code:", result.resultCode);
          console.log("Tentative result message:", result.resultMessage);

          // Validation
          let has_final_status = false;
          api.request("subscribe", { accounts: [clientData[1].Account] });
          api.connection.on("transaction", (event) => {
            if (event.transaction.hash == txID) {
              console.log("Transaction has executed!", event);
              has_final_status = true;
              socket.send(JSON.stringify(event));
            }
          });
          api.on("ledger", (ledger) => {
            if (ledger.ledgerVersion > maxLedgerVersion && !has_final_status) {
              console.log(
                "Ledger version",
                ledger.ledgerVersion,
                "was validated."
              );
              console.log(
                "If the transaction hasn't succeeded by now, it's expired"
              );
              has_final_status = true;
            }
          });
        });

        // api.disconnect();
        break;
      }
    }

    // console.log(clientData[0]);
    // console.log(clientData[1]);
  });

  socket.on("close", () => {
    console.log(" = "); // equal sign in command line is the end of each api call
  });
});
