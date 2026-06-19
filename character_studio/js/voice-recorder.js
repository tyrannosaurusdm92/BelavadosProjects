/* Belavadös Voice Studio - local microphone base-voice recorder */
(() => {
  'use strict';
  const Recorder = {
    mediaRecorder: null,
    stream: null,
    chunks: [],
    blob: null,
    url: '',
    dataUrl: '',
    clip: null,
    async start() {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        throw new Error('This browser does not support microphone recording through MediaRecorder.');
      }
      this.stopTracks();
      this.chunks = [];
      this.blob = null;
      this.dataUrl = '';
      this.clip = null;
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:true } });
      const preferred = ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported?.(t));
      this.mediaRecorder = new MediaRecorder(this.stream, preferred ? { mimeType: preferred } : undefined);
      this.mediaRecorder.ondataavailable = ev => { if (ev.data && ev.data.size) this.chunks.push(ev.data); };
      this.mediaRecorder.start();
      return { status:'recording', mimeType:this.mediaRecorder.mimeType };
    },
    stop() {
      return new Promise((resolve, reject) => {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
          resolve(this.current());
          return;
        }
        this.mediaRecorder.onstop = async () => {
          try {
            this.blob = new Blob(this.chunks, { type: this.mediaRecorder.mimeType || 'audio/webm' });
            if (this.url) URL.revokeObjectURL(this.url);
            this.url = URL.createObjectURL(this.blob);
            this.dataUrl = await this.blobToDataUrl(this.blob);
            this.clip = this.makeClip();
            this.stopTracks();
            resolve(this.current());
          } catch (err) { reject(err); }
        };
        this.mediaRecorder.stop();
      });
    },
    stopTracks() {
      try { this.stream?.getTracks?.().forEach(t => t.stop()); } catch {}
      this.stream = null;
    },
    blobToDataUrl(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    },
    makeClip() {
      if (!this.blob || !this.url) return null;
      return {
        id: 'recorded-own-voice-base',
        filename: 'recorded-own-voice-base.webm',
        displayName: 'My Recorded Base Voice',
        file: this.url,
        embeddedDataUrl: this.dataUrl,
        duration: 0,
        tags: ['recorded','custom','own voice','base','clean'],
        source: 'local microphone recording',
        recordedAt: new Date().toISOString()
      };
    },
    current() {
      return { blob:this.blob, url:this.url, dataUrl:this.dataUrl, clip:this.clip };
    },
    clear() {
      if (this.url) URL.revokeObjectURL(this.url);
      this.stopTracks();
      this.mediaRecorder = null;
      this.chunks = [];
      this.blob = null;
      this.url = '';
      this.dataUrl = '';
      this.clip = null;
    }
  };
  window.BelavadosVoiceRecorder = Recorder;
})();
