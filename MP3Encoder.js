'use strict';
var encoder;
onmessage = function(e) {
  switch(e.data.command) {
    case 'init':
      encoder = new MP3Encoder(e.data);
      break;

    case 'encode':
      if (encoder) {
        encoder.encode(e.data.buffers);
      }
      break;

    case 'done':
      if (encoder) {
        encoder.finish();
      }
      break;
  }
};

var MP3Encoder = function(config) {
  console.log(config);
  this.numberOfChannels = config.numberOfChannels || 1;
  this.originalSampleRate = config.originalSampleRate;
  this.encoderSampleRate = config.originalSampleRate;
  // this.encoderSampleRate = config.encoderSampleRate || 44100;
  this.bitRate = config.bitRate || 128;

  this.resamplerPath = config.resamplerPath || 'resampler.js';
  importScripts(this.resamplerPath);
  this.resampler = new Resampler({
    resampledRate: this.encoderSampleRate,
    originalSampleRate: this.originalSampleRate,
    numberOfChannels: this.numberOfChannels
  });

  this.mp3LibraryPath = config.mp3LibraryPath || 'lame.all.js';
  importScripts(this.mp3LibraryPath);

  var MP3Library = new lamejs();
  this.MP3Recorder = new MP3Library.Mp3Encoder(this.numberOfChannels, this.encoderSampleRate, this.bitRate);
};

MP3Encoder.prototype.encode = function(inputBuffer) {
  console.log('enc', inputBuffer);
  // var resampled = (this.res(inputBuffer[0], 48000, 44100));
  // var input = this.float32ToInt(resampled);
  var input = this.float32ToInt(inputBuffer[0]);

  var chunk = this.MP3Recorder.encodeBuffer(input);

  if (chunk.length > 0) {
    postMessage({ action: 'chunk', data: chunk});
  }
};

MP3Encoder.prototype.inter = function(arr, pos) {
  // return pos >= arr.length - 0.5 ? arr[0] : arr[Math.round(pos)];
  var first   = Math.floor(pos),
        second  = first  + 1,
        frac    = pos - first;
  second      = second < arr.length ? second : 0;
  return arr[first] * (1 - frac) + arr[second] * frac;
};

MP3Encoder.prototype.res = function(buffer, fromRate, fromFrequency, toRate, toFrequency) {
  var argc        = arguments.length,
    speed       = argc === 2 ? fromRate : argc === 3 ? fromRate / fromFrequency : toRate / fromRate * toFrequency / fromFrequency,
    l       =   buffer.length,
    length      = Math.ceil(l / speed),
    newBuffer   = new Float32Array(length),
    i, n;
  for    (i=0, n=0; i<l; i += speed) {
    newBuffer[n++] = this.inter(buffer, i);
  }
  return newBuffer;    
};

MP3Encoder.prototype.resample = function(buffers) {
  var resampledBuffers = [];

  // for (var channel = 0; channel < this.numberOfChannels; channel++) {
    resampledBuffers.push(this.resampler.resample(buffers, 0));
  // }

  return resampledBuffers;
};

MP3Encoder.prototype.float32ToInt = function(f32) {
  var len = f32.length, i = 0;
  var i16 = new Int16Array(len);

  while(i < len) {
    i16[i] = convert(f32[i++]);
  }

  function convert(n) {
    var v = n < 0 ? n * 32768 : n * 32767;       // convert in range [-32768, 32767]
    return Math.max(-32768, Math.min(32768, v)); // clamp
  }

  return i16;
};

MP3Encoder.prototype.finish = function() {
  postMessage({action: 'done', data: this.MP3Recorder.flush()});
};

