/*
  Module dependencies
 */

var debug = require( 'debug' )( 'plusultra' );
var nopt = require( 'nopt' );
var redis = require( 'socket.io-redis' );
var socketioJwt = require( 'socketio-jwt' );
var channels = require( 'plusultra_channels' );

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
    'sp' : ['--sioPort', '26060'],
    'eh' : ['--entranceHost', 'localhost'],
    'ep' : ['--entrancePort', '6379'],
    'cs' : ['--communicationStrategy', 'socket.io']
  },
  parsed,
  SIO_PORT,
  ENTRANCE_HOST,
  ENTRANCE_PORT,
  COMMUNICATION_STRGY;


parsed = nopt( knownOpts, shortHands, process.argv, 2 );

// getting command line parsed args or defaults...
SIO_PORT = parsed.sioPort || process.env.PORT || 26060;

// if we deploy against appfog
var service = false;
var VCAP_SERVICES = {};
if ( process.env.VCAP_SERVICES ){
  VCAP_SERVICES = JSON.parse( process.env.VCAP_SERVICES );
  var keys = Object.keys( VCAP_SERVICES );
  if ( keys.length ){
    service = VCAP_SERVICES[ keys[0] ][0];
  }
}

if ( service ){
  ENTRANCE_HOST = service['credentials']['host'];
  ENTRANCE_PORT = service['credentials']['port'];
  ENTRANCE_PWD  = service['credentials']['password'];
}else if ( process.env.OPENSHIFT_REDIS_HOST ){
  // if we deploy against openshift :)
  ENTRANCE_HOST = process.env.OPENSHIFT_REDIS_HOST;
  ENTRANCE_PORT = process.env.OPENSHIFT_REDIS_PORT;
  ENTRANCE_PWD  = process.env.REDIS_PASSWORD;
}else{
  ENTRANCE_HOST = parsed.entranceHost || 'localhost';
  ENTRANCE_PORT = parsed.entrancePort || 6379;
}

COMMUNICATION_STRGY = parsed.communicationStrategy || 'socket.io';

/**
  Module Setup
 */

strategy = channels.getStrategy( COMMUNICATION_STRGY );

briareoServer = strategy.createServer( {'server' : SIO_PORT} );
if ( service ){
  briareoServer.adapter( redis({ host: ENTRANCE_HOST, port: ENTRANCE_PORT, password: ENTRANCE_PWD }) );
}else{
  briareoServer.adapter( redis({ host: ENTRANCE_HOST, port: ENTRANCE_PORT }) );
}

var djb2Code = function(str){
  var hash = 5381;
  for (i = 0; i < str.length; i++) {
      char = str.charCodeAt(i);
      hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
  }
  return hash;
};


/**
 * Module Code
 */

var onAuthenticated = function( socket ){
  socket.emit('plusultra::welcome',{msg:'Welcome to plusultra ...|_|...'});

  // TODO: cache this in a redis style system.
  var roomID = djb2Code( socket.decoded_token );
  debug( 'socket.rooms ', socket.rooms );
  debug( 'roomID ', roomID );
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


  socket.on( 'plusultra::authenticate', function( data ){
    this.emit( 'authenticate', {'token':data.token} );
  });

  socket.on('error', function(err){
    console.error( err );
  })
}



briareoServer.sockets
.on('connection', socketioJwt.authorize({
  secret: new Buffer('th1s1sn0s0s3cr3t', 'base64'),
  timeout: 15000 // 15 seconds to send the authentication message
}))
.on('authenticated', onAuthenticated )
.on('error', function ( e ){ console.error( 'Plusultra Connection Error: ', e ) } )
