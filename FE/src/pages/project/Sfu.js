const _EVENTS = {
  onLeave: "onLeave",
  onJoin: "onJoin",
  onCreate: "onCreate",
  onStreamStarted: "onStreamStarted",
  onStreamEnded: "onStreamEnded",
  onReady: "onReady",
  onScreenShareStopped: "onScreenShareStopped",
  exitRoom: "exitRoom",
  onConnected: "onConnected",
  onRemoteTrack: "onRemoteTrack",
};

class Sfu {
  constructor(options) {
    const defaultSettings = {
      port: 3003,
      configuration: {
        iceServers: [
          {
            urls: "turn:3.34.53.247",
            username: "admin",
            credential: "jgjg1234",
          },
          //         { urls: 'stun:stun01.sipphone.com' },
          // { urls: 'stun:stun.ekiga.net' },
          // { urls: 'stun:stun.fwdnet.net' },
          // { urls: 'stun:stun.ideasip.com' },
          // { urls: 'stun:stun.iptel.org' },
          // { urls: 'stun:stun.rixtelecom.se' },
          // { urls: 'stun:stun.schlund.de' },
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          // { urls: 'stun:stunserver.org' },
          // { urls: 'stun:stun.softjoys.com' },
          // { urls: 'stun:stun.voiparound.com' },
          // { urls: 'stun:stun.voipbuster.com' },
          // { urls: 'stun:stun.voipstunt.com' },
          // { urls: 'stun:stun.voxgratia.org' },
          // { urls: 'stun:stun.xten.com' },
          // {
          //     urls: 'turn:numb.viagenie.ca',
          //     credential: 'muazkh',
          //     username: 'webrtc@live.com'
          // },
          // {
          //     urls: 'turn:192.158.29.39:3478?transport=udp',
          //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          //     username: '28224511:1379330808'
          // },
          // {
          //     urls: 'turn:192.158.29.39:3478?transport=tcp',
          //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          //     username: '28224511:1379330808'
          // }
        ],
      },
    };

    this.settings = Object.assign({}, defaultSettings, options);
    this._isOpen = false;
    this.eventListeners = new Map();
    this.connection = null;
    this.consumers = new Map();
    this.clients = new Map();
    this.localPeer = null;
    this.localUUID = null;
    this.localStream = null;
    Object.keys(_EVENTS).forEach((event) => {
      this.eventListeners.set(event, []);
    });

    this.initWebSocket();
    this.trigger(_EVENTS.onReady);
  }

  initWebSocket() {
    // console.log('SFu 진입 !!!!!!!!!!');
    // console.log('!@@@@@', this.settings);
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${window.location.hostname}:${this.settings.port}`;
    this.connection = new WebSocket(url);
    this.connection.onmessage = (data) => this.handleMessage(data); 
    this.connection.onclose = () => this.handleClose();
    this.connection.onopen = (event) => {
      this.trigger(_EVENTS.onConnected, event);
      this._isOpen = true;
    };
  }

  on(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).push(callback);
    }
  }

  trigger(event, args = null) {
    if (this.eventListeners.has(event)) {
      this.eventListeners
        .get(event)
        .forEach((callback) => callback.call(this, args));
    }
  }

  static get EVENTS() {
    return _EVENTS;
  }

  get IsOpen() {
    return _isOpen;
  }

  findUserVideo(username) {
    return document.querySelector(`#remote_${username}`);
  }

  async handleRemoteTrack(stream, username) {
    const userVideo = this.findUserVideo(username);
    if (userVideo) {
      userVideo.srcObject.addTrack(stream.getTracks()[0]);
    } else {
      const video = document.createElement("video");
      video.id = `remote_${username}`;
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = username == this.settings.id;

      const div = document.createElement("div");
      div.id = `user_${username}`;
      div.classList.add("videoWrap");

      const nameContainer = document.createElement("div");
      nameContainer.classList.add("display_name");
      const textNode = document.createTextNode(username);
      nameContainer.appendChild(textNode);
      div.appendChild(nameContainer);
      div.appendChild(video);
      // document.querySelector(".videos-inner").appendChild(div);

      this.trigger(_EVENTS.onRemoteTrack, stream);
    }

    // this.recalculateLayout();
  }

  async handleIceCandidate({ candidate }) {
    if (candidate && candidate.candidate && candidate.candidate.length > 0) {
      // console.log(`candidata : ${candidate}, uqid : ${this.localUUID}`);
      const payload = {
        type: "ice",
        ice: candidate,
        uqid: this.localUUID,
      };
      this.connection.send(JSON.stringify(payload));
    }
  }

  handleConsumerIceCandidate(e, id, consumerId) {
    const { candidate } = e;
    if (candidate && candidate.candidate && candidate.candidate.length > 0) {
      const payload = {
        type: "consumer_ice",
        ice: candidate,
        uqid: id,
        consumerId,
      };
      this.connection.send(JSON.stringify(payload));
    }
  }

  handleConsume({ sdp, id, consumerId }) {
    const desc = new RTCSessionDescription(sdp);
    this.consumers
      .get(consumerId)
      .setRemoteDescription(desc)
      .catch((e) => console.log(e));
  }

  async createConsumeTransport(peer) {
    const consumerId = this.uuidv4();
    const consumerTransport = new RTCPeerConnection(
      this.settings.configuration
    );
    this.clients.get(peer.id).consumerId = consumerId;
    consumerTransport.id = consumerId;
    consumerTransport.peer = peer;
    this.consumers.set(consumerId, consumerTransport);
    this.consumers
      .get(consumerId)
      .addTransceiver("video", { direction: "recvonly" });
    this.consumers
      .get(consumerId)
      .addTransceiver("audio", { direction: "recvonly" });
    const offer = await this.consumers.get(consumerId).createOffer();
    await this.consumers.get(consumerId).setLocalDescription(offer);

    this.consumers.get(consumerId).onicecandidate = (e) =>
      this.handleConsumerIceCandidate(e, peer.id, consumerId);

    this.consumers.get(consumerId).ontrack = (e) => {
      this.handleRemoteTrack(e.streams[0], peer.username);
    };

    return consumerTransport;
  }

  async consumeOnce(peer) {
    const transport = await this.createConsumeTransport(peer);
    const payload = {
      type: "consume",
      id: peer.id,
      consumerId: transport.id,
      sdp: await transport.localDescription,
    };

    this.connection.send(JSON.stringify(payload));
  }

  async handlePeers({ peers }) {
    if (peers.length > 0) {
      for (const peer in peers) {
        this.clients.set(peers[peer].id, peers[peer]);
        await this.consumeOnce(peers[peer]);
      }
    }
  }

  handleAnswer({ sdp }) {
    const desc = new RTCSessionDescription(sdp);
    this.localPeer.setRemoteDescription(desc).catch((e) => console.log(e));
  }

  async handleNewProducer({ id, username }) {
    if (id === this.localUUID) return;

    this.clients.set(id, { id, username });

    await this.consumeOnce({ id, username });
  }

  handleMessage({ data }) {
    const message = JSON.parse(data);

    switch (message.type) {
      case "welcome":
        // console.log(`message.id : ${JSON.stringify(message)}`);
        this.localUUID = message.id;
        break;
      case "answer":
        this.handleAnswer(message);
        break;
      case "peers":
        this.handlePeers(message);
        break;
      case "consume":
        this.handleConsume(message);
        break;
      case "newProducer":
        this.handleNewProducer(message);
        break;
      case "user_left":
        this.removeUser(message);
        break;
    }
  }

  removeUser({ id }) {
    const { username, consumerId } = this.clients.get(id);
    this.consumers.delete(consumerId);
    this.clients.delete(id);
    this.localStream
      .getTracks()
      .forEach((track) => track.stop());
    // document.querySelector(`#user_${username}`).remove();

    // this.recalculateLayout();
  }

  async connect() {
    //Produce media
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    // this.handleRemoteTrack(stream, username.value);
    this.handleRemoteTrack(stream, this.settings.id);

    this.localStream = stream;

    this.localPeer = this.createPeer();

    this.localStream
      .getTracks()
      .forEach((track) => this.localPeer.addTrack(track, this.localStream));

    await this.subscribe();
  }

  createPeer() {
    this.localPeer = new RTCPeerConnection(this.configuration);
    this.localPeer.onicecandidate = (e) => this.handleIceCandidate(e);
    //peer.oniceconnectionstatechange = checkPeerConnection;
    this.localPeer.onnegotiationneeded = () => this.handleNegotiation();
    return this.localPeer;
  }

  async subscribe() {
    // Consume media
    await this.consumeAll();
  }

  async consumeAll() {
    const payload = {
      type: "getPeers",
      uqid: this.localUUID,
    };

    this.connection.send(JSON.stringify(payload));
  }

  async handleNegotiation(peer, type) {
    console.log("*** negoitating ***");
    const offer = await this.localPeer.createOffer();
    await this.localPeer.setLocalDescription(offer);
    
    this.connection.send(
      JSON.stringify({
        type: "connect",
        sdp: this.localPeer.localDescription,
        uqid: this.localUUID,
        username: this.settings.id,
      })
    );
  }

  handleClose() {
    this.connection = null;
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
    this.clients = null;
    this.consumers = null;
  }

  uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  recalculateLayout() {
    const container = remoteContainer;
    const videoContainer = document.querySelector(".videos-inner");
    const videoCount = container.querySelectorAll(".videoWrap").length;

    if (videoCount >= 3) {
      videoContainer.style.setProperty("--grow", 0 + "");
    } else {
      videoContainer.style.setProperty("--grow", 1 + "");
    }
  }
}

export default Sfu;