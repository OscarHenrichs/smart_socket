
require('uWebSockets.js').SSLApp({


    // /* There are more SSL options, cut for brevity */
    key_file_name: 'misc/key.pem',
    cert_file_name: 'misc/cert.pem',
    
  }).ws('/', {
    idleTimeout: 32,
    maxBackpressure: 1024,
    maxPayloadLength: 512,

    upgrade: (res, req, context) => {
      console.log('An Http connection wants to become WebSocket, URL: ' + req.getUrl() + '!');
  
      /* This immediately calls open handler, you must not use res after this call */
      res.upgrade({
          myData: req.getUrl() /* First argument is UserData (see WebSocket.getUserData()) */
        },
        /* Spell these correctly */
        req.getHeader('sec-websocket-key'),
        req.getHeader('sec-websocket-protocol'),
        req.getHeader('sec-websocket-extensions'),
        context);
  
    },
  
    // upgrade:(res, req, context) => {
    //   try { res.user = decodeJwtCookie(res, req, 'cookieName'); }
    //   catch { return res.writeStatus('401').end(); }
    //   res.upgrade({ uid: res.user._id }, req.getHeader('sec-websocket-key'), req.getHeader('sec-websocket-protocol'), req.getHeader('sec-websocket-extensions'), context);
    // },
  
    /* There are many common helper features */
    
    /* For brevity we skip the other events (upgrade, open, ping, pong, close) */
    message: (ws, message, isBinary) => {
      /* You can do app.publish('sensors/home/temperature', '22C') kind of pub/sub as well */
      
      /* Here we echo the message back, using compression if available */
      let ok = ws.send(message, isBinary, true);
    }
    
  }).listen(9001, (listenSocket) => {
  
    if (listenSocket) {
      console.log('Listening to port 9001');
    }
    
  });