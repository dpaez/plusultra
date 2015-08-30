/**
 * Plusultra clients-consumer-like API tests.
 * 
 * Intended to be use against a "live" Plusultra instance.  
 */

var should = require( 'should' );
var jwt = require( 'jsonwebtoken' );
var io = require( 'socket.io-client' );

var socketURL = 'ws://localhost:26060';
var options ={
  'forceNew': true
};

describe("Plusultra server",function(){

  it('Should broadcast a single client after connect', function( done ){
    // create client connection
    var client = io.connect( socketURL, options );
    var secretBase64 = new Buffer( 'th1s1sn0s0s3cr3t', 'base64' );
    var myToken = jwt.sign( { foo: 'bar' }, secretBase64 );

    client.on('connect',function(){
      client
        .on( 'authenticated', function(){
          console.info( 'Authenticated. ...|_|... on Plusultra!\n' );
        })
        .on( 'unauthorized', function(){
          console.info( 'unauthorized!' );
        })
        .emit( 'authenticate', {token: myToken} )

        .on( 'plusultra::welcome', function( data ){
          data.should.be.an.Object;
          data.msg.should.be.a.String;
          data.msg.should.be.equal( 'Welcome to plusultra ...|_|...' );
          client.disconnect( true );
          done();
        })
    })
    .on('error', function ( e ){ console.log('Connection Error: ', e) })
  });

  it('Should do a ping pong with the server', function( done ){
    var client = io.connect( socketURL, options );
    var secretBase64 = new Buffer( 'th1s1sn0s0s3cr3t', 'base64' );
    var myToken = jwt.sign( { foo: 'bar' }, secretBase64 );

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
    var UnknownSecretBase64 = new Buffer( '4n0th3rs3cr3t', 'base64' );
    var myToken = jwt.sign( { foo: 'bar' }, UnknownSecretBase64 );

    client.on('connect',function(){
      client
        .on( 'authenticated', function(){
          console.info( 'Authenticated. ...|_|... on Plusultra!\n' );
        })

        .on( 'unauthorized', function( err ){
          err.data.code.should.be.eql( 'invalid_token' );
          console.info( 'Unauthorized\n' );
          done();
        })

        .on( 'disconnect', function(  ){
          done();
        })

        .emit( 'authenticate', {token: myToken} )
    });
  });

});