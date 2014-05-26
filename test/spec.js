var should = require( 'should' );
var jwt = require( 'jsonwebtoken' );
var io = require( 'socket.io-client' );

var socketURL = 'ws://0.0.0.0:26060';
var options ={
  //'transports': ['websocket'],
  'force new connection': true,
  'forceNew': true
};

describe("Plusultra server",function(){

  it('Should broadcast a single client after connect', function( done ){
    var client = io.connect( socketURL, options );
    var secret = 'th1s1sn0s0s3cr3t';
    var myToken = jwt.sign( { foo: 'bar' }, secret );

    client.on('connect',function(){
      client
        .on( 'authenticated', function(){
          console.info( 'Authenticated. ...|_|... on Plusultra!\n' );
        })
        .on( 'unauthorized', function(){
          console.info( 'unauthorized!' );
        })
        .on( 'error', function(err,res){
          console.log( 'ERROR: ', err );
        })
        .emit( 'authenticate', {token: myToken} )

        .on( 'plusultra::welcome', function( data ){
          data.should.be.an.Object;
          data.msg.should.be.a.String;
          data.msg.should.be.equal( 'Welcome to plusultra ...|_|...' );
          client.disconnect( true );
          done();
        })
    });
  });

  it('Should do a ping pong with the server', function( done ){
    var client = io.connect( socketURL, options );
    var secret = 'th1s1sn0s0s3cr3t';
    var myToken = jwt.sign( { foo: 'bar' }, secret );

    client.on('connect',function(){
      client
        .on( 'authenticated', function(){
          console.info( 'Authenticated. ...|_|... on Plusultra!\n' );
          client.emit( 'ping', {} );
        })

        .emit( 'authenticate', {token: myToken} )

        .on('pong', function(data){
          data.should.be.an.Object;
          data.should.be.empty;
          console.info( 'PONG' );
          client.disconnect( true );
          done();
        })
    });
  });

  it('Should fail at connect with bad credentials', function( done ){
    var client = io.connect( socketURL, options );
    var secret = '4n0th3rs3cr3t';
    var myToken = jwt.sign( { foo: 'baz' }, secret );

    client.on('connect',function(){
      client
        .on( 'authenticated', function(){
          console.info( 'Authenticated. ...|_|... on Plusultra!\n' );
        })

        .on( 'disconnect', function(  ){
          done();
        })

        .on( 'error', function( err ){
          err.should.be.eql( 'handshake unauthorized' );
          done();
        })

        .emit( 'authenticate', {token: myToken} )
    });
  });

});