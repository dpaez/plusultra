/*
  Module dependencies
 */

var nopt = require( 'nopt' );
var redis = require( 'socket.io-redis' );
var socketioJwt = require( 'socketio-jwt' );
var channels = require( '../plusultra_channels' );
//var plusultraEntrance = require( '../plusultra_entrance' );

/*
  Module variables
 */

var strategy,
  briareoServer,
  entrance,
  knownOpts = {
    'sioPort' : Number,
    'entranceHost' : String,
    'entrancePort' : Number,
    'communicationStrategy' : [ 'socket.io', 'ws' ]
  },
  shortHands = {
    'sp' : ['--sioPort', 26060],
    'eh' : ['--entranceHost', 'http://127.0.0.1'],
    'ep' : ['--entrancePort', 6379],
    'cs' : ['--communicationStrategy', 'socket.io']
  },
  parsed,
  SIO_PORT,
  ENTRANCE_HOST,
  ENTRANCE_PORT,
  COMMUNICATION_STRGY;


parsed = nopt( knownOpts, shortHands, process.argv, 2 );

// getting command line parsed args or defaults...
SIO_PORT = parsed.sioPort || 26060;
ENTRANCE_HOST = parsed.entranceHost || '127.0.0.1';
ENTRANCE_PORT = parsed.entrancePort || 6379;
COMMUNICATION_STRGY = parsed.communicationStrategy || 'socket.io';

/**
  Module stuff
 */


//entrance = new plusultraEntrance( ENTRANCE_HOST, ENTRANCE_PORT );

strategy = channels.getStrategy( COMMUNICATION_STRGY );

briareoServer = strategy.createServer( {'server' : SIO_PORT} );

briareoServer.adapter( redis({ host: 'localhost', port: ENTRANCE_PORT }) );
//briareoServer.configure( 'authorization', entrance.checkConnection );

var djb2Code = function(str){
  var hash = 5381;
  for (i = 0; i < str.length; i++) {
      char = str.charCodeAt(i);
      hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
  }
  return hash;
};

  //.on('authenticated', function( s ){
var onAuthenticated = function( socket ){
  socket.emit('plusultra::welcome',{msg:'Welcome to plusultra ...|_|...'});

  // TODO: cache this in a redis style system.
  var roomID = djb2Code( socket.decoded_token );
  if ( 'undefined' === typeof socket.rooms[ roomID ] ){
    socket.join(roomID);
    socket.currentRoom = roomID;
  }

  socket.on('ping', function( data ){
    console.info('PING');
    socket.emit( 'pong', {} );
  });

  socket.on( 'plusultra::new_modality', function( data ){
    console.info( 'NEW MODALITY: ', data.modality );
    socket.emit( 'ACK' );
    socket.to( socket.currentRoom ).emit(
      'plusultra::broadcast_new_modality',
      {'modality': data.modality}
    );
  });

  socket.on( 'plusultra::modality_signal', function( data ){
    console.info( 'MODALITY SIGNAL: ', data.signal );

    socket.emit(
      'plusultra::broadcast_modality_signal',
      {'signal': data.signal.data} // TODO: clean emitted signal object
    );

    socket.to( socket.currentRoom ).emit(
      'plusultra::broadcast_modality_signal',
      {'signal': data.signal.data} // TODO: clean emitted signal object
    );
  });


  socket.on( 'plusultra::interpretation', function( data ){
    socket.to( socket.currentRoom ).emit(
      'plusultra::broadcast_interpretation',
      {'interpretation':data.interpretation}
    );
  });


  /*
  socket.on( 'plusultra::authenticate', function( data ){
    this.emit( 'authenticate', {'token':data.token} );
  });
  */
};

briareoServer
  .on('connection', socketioJwt.authorize({
    secret: 'th1s1sn0s0s3cr3t',
    timeout: 15000 // 15 seconds to send the authentication message
  },onAuthenticated));
