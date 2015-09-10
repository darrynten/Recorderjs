
 MP3Encoder = function(config){
console.log('mp3encoder');
  config = config ||{};
  var libLamePath = config.mp3LibPath || 'lame.all.js';
  importScripts(libLamePath);


  var lib = new lamejs();

  var mp3encoder;

  function init(config){

    mp3encoder = new lib.Mp3Encoder(config.cannels ||1, config.sampleRate ||  44100, config.bitRate ||128); //mono 44.1khz encode to 128kbps
  }

  function encode(buffer){


    var input = float32ToInt(buffer);

    var output = mp3encoder.encodeBuffer(input);

    return output;
  }


  function float32ToInt(f32){


    var len = f32.length, i = 0;
    var i16 = new Int16Array(len);

    while(i < len)
      i16[i] = convert(f32[i++]);

    function convert(n) {
      var v = n < 0 ? n * 32768 : n * 32767;       // convert in range [-32768, 32767]
      return Math.max(-32768, Math.min(32768, v)); // clamp
    }

    return i16;

  }



  function finish(){
      return mp3encoder.flush();
  }

  function flush(){
    return mp3encoder.flush();
  }

  function toFile(buffer, config){

    init(config);

    var mp3data =  [encode(buffer)];

    mp3data.push(finish());

    var mp3Blob = new Blob(mp3data, {type: 'audio/mp3'});

    return mp3Blob;

  }

  function getMP3(){


    var mp3Blob = new Blob(recBufferMP3, {type: 'audio/mp3'});
    return mp3Blob;
  }


  this.init = init;
  this.encode = encode;
  this.toFile = toFile;
  this.getMP3 = getMP3;
  this.flush = flush;



};


