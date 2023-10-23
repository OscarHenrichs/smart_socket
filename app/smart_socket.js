
require('uWebSockets.js').App({


    // /* There are more SSL options, cut for brevity */
    key_file_name: 'misc/key.pem',
    cert_file_name: 'misc/cert.pem',
    
  }).ws('/', {
    idleTimeout: 32,
    maxBackpressure: 1024,
    maxPayloadLength: 512,

    upgrade: (res, req, context) => {
      console.log('An Htts connection wants to become WebSocket, URL: ' + req.getUrl() + '!');
      try { res.user = decodeJwtCookie(req.getHeader("user_id"), req.getHeader("pass"), req.getHeader("login")); }
      catch { return res.writeStatus('401').end(); }
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
    /* There are many common helper features */
    
    /* For brevity we skip the other events (upgrade, open, ping, pong, close) */
    message: (ws, message, isBinary) => {
      /* You can do app.publish('sensors/home/temperature', '22C') kind of pub/sub as well */
      console.log(message)
      /* Here we echo the message back, using compression if available */
      let ok = ws.send(message, isBinary, true);
    }
    
  }).listen(9001, (listenSocket) => {
  
    if (listenSocket) {
      console.log('Listening to port 9001');
    }
    
  });

  function decodeJwtCookie(user_id, pass, login) {
	const userId = user_id;
	const pass_code = pass;
	const login_char = login;

	if (pass_code != 1234 || login_char != "smart") {
		throw new TypeError("Sem auth")
	}

	return userId
  }