import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';

// Polyfill for global
if (typeof window !== 'undefined' && !window.global) {
    window.global = window;
}

// Multiple public STUN servers for better NAT traversal reliability.
// A TURN server is needed for symmetric NATs (corporate networks, etc.)
// If you have a TURN server, add it here:
//   { urls: 'turn:your-turn-server:3478', username: '...', credential: '...' }
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    // Free TURN relay (works behind most NATs and firewalls)
    {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
    {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
    {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
];

const useVoiceChat = (roomId, user, socket) => {
    const [peers, setPeers] = useState([]);
    const [isMuted, setIsMuted] = useState(false);
    const [loopbackActive, setLoopbackActive] = useState(false);

    const localStreamRef = useRef(null);
    const loopbackAudioRef = useRef(null);
    const peersRef = useRef([]);
    const socketRef = useRef(socket);

    useEffect(() => {
        socketRef.current = socket;
    }, [socket]);

    useEffect(() => {
        if (!roomId || !user) return;

        console.log('🎤 VoiceChat Hook: Mounting... Socket ID:', socket?.id);
        const isMounted = { current: true };
        let cleanupListeners = null;

        const initVoice = async () => {
            try {
                console.log('🎤 VoiceChat: Requesting Mic Permissions...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: {
                        // ── Hardware-level voice processing ──
                        echoCancellation: true,      // removes echo of remote speaker
                        noiseSuppression: true,      // filters background noise
                        autoGainControl: true,       // normalises volume automatically
                        // ── Quality settings ──
                        sampleRate: 48000,           // Opus works best at 48 kHz
                        sampleSize: 16,
                        channelCount: 1,             // mono is optimal for voice
                        latency: 0,                  // request lowest possible latency
                    },
                });

                if (!isMounted.current) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                console.log('🎤 VoiceChat: Mic Access Granted!');
                localStreamRef.current = stream;

                // ── When a NEW user joins, WE (the existing user) initiate a call to them ──
                const handleUserJoined = (newUser) => {
                    const targetId = newUser.socketId;
                    if (targetId === socketRef.current.id) return;

                    // With trickle=true, "signal" fires multiple times per peer.
                    // Only create the peer once — subsequent signals come via handleReturnSignal.
                    if (peersRef.current.find(p => p.peerID === targetId)) {
                        console.warn('⚠️ Voice: Peer already exists (Join), skipping:', targetId);
                        return;
                    }

                    console.log('📞 Voice: User joined, initiating call to:', targetId);
                    const peer = createPeer(targetId, socketRef.current.id, stream, user);
                    peersRef.current.push({ peerID: targetId, peer });
                    setPeers(prev => [...prev, { peerID: targetId, peer }]);
                };

                // ── Receiving a call from someone who joined before us ──
                const handleIncomingCall = (payload) => {
                    const targetId = payload.callerId;
                    const existingEntry = peersRef.current.find(p => p.peerID === targetId);

                    if (existingEntry) {
                        // This is a trickle ICE candidate for an already-established peer — forward it.
                        console.log('🔀 Voice: Trickle signal for existing peer:', targetId);
                        existingEntry.peer.signal(payload.signal);
                        return;
                    }

                    console.log('📞 Voice: Receiving call from:', targetId);
                    const peer = addPeer(payload.signal, targetId, stream);
                    peersRef.current.push({ peerID: targetId, peer });
                    setPeers(prev => [...prev, { peerID: targetId, peer }]);
                };

                // ── Answer signal coming back to the initiator after they sent an offer ──
                const handleReturnSignal = (payload) => {
                    const item = peersRef.current.find(p => p.peerID === payload.id);
                    if (item) {
                        item.peer.signal(payload.signal);
                    }
                };

                const handleUserLeft = (leftUser) => {
                    const item = peersRef.current.find(p => p.peerID === leftUser.socketId);
                    if (item) {
                        item.peer.destroy();
                        peersRef.current = peersRef.current.filter(p => p.peerID !== leftUser.socketId);
                        setPeers(prev => prev.filter(p => p.peerID !== leftUser.socketId));
                    }
                };

                if (socketRef.current) {
                    socketRef.current.on('user-joined', handleUserJoined);
                    socketRef.current.on('user-joined-signal', handleIncomingCall);
                    socketRef.current.on('receiving-returned-signal', handleReturnSignal);
                    socketRef.current.on('user-left', handleUserLeft);
                }

                return () => {
                    if (socketRef.current) {
                        socketRef.current.off('user-joined', handleUserJoined);
                        socketRef.current.off('user-joined-signal', handleIncomingCall);
                        socketRef.current.off('receiving-returned-signal', handleReturnSignal);
                        socketRef.current.off('user-left', handleUserLeft);
                    }
                };
            } catch (err) {
                console.error('Voice Chat Error:', err);
            }
        };

        initVoice().then(cleanup => {
            cleanupListeners = cleanup;
        });

        return () => {
            isMounted.current = false;
            if (loopbackAudioRef.current) {
                loopbackAudioRef.current.srcObject = null;
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
            if (cleanupListeners) cleanupListeners();
            peersRef.current.forEach(({ peer }) => {
                if (peer) peer.destroy();
            });
            peersRef.current = [];
        };
    }, [roomId]);

    /**
     * sdpTransform: Modify the SDP to give Opus higher bitrate + FEC.
     * Default Chrome Opus bitrate is ~32 kbps — we raise it to 128 kbps.
     * useinbandfec=1 enables Forward Error Correction so packet loss
     * sounds like a brief muffling rather than a hard cut.
     */
    function sdpTransform(sdp) {
        return sdp.replace(
            /a=fmtp:(\d+) (.*)useinbandfec=1(.*)/g,
            'a=fmtp:$1 $2useinbandfec=1$3;maxaveragebitrate=128000;usedtx=0'
        );
    }

    function createPeer(userToSignal, callerId, stream, user) {
        const peer = new SimplePeer({
            initiator: true,
            trickle: true,
            stream,
            config: { iceServers: ICE_SERVERS },
            sdpTransform,          // ✅ boost Opus bitrate
        });

        peer.on('signal', signal => {
            socketRef.current.emit('sending-signal', { userToSignal, callerId, signal, user });
        });

        peer.on('connect', () => console.log('✅ Initiator: P2P connected to', userToSignal));
        peer.on('error', err => console.error('❌ Initiator Peer Error:', err));
        return peer;
    }

    function addPeer(incomingSignal, callerId, stream) {
        const peer = new SimplePeer({
            initiator: false,
            trickle: true,
            stream,
            config: { iceServers: ICE_SERVERS },
            sdpTransform,          // ✅ boost Opus bitrate on receiver side too
        });

        peer.on('signal', signal => {
            socketRef.current.emit('returning-signal', { signal, callerId });
        });

        peer.on('connect', () => console.log('✅ Receiver: P2P connected to', callerId));
        peer.on('error', err => console.error('❌ Receiver Peer Error:', err));
        peer.signal(incomingSignal);
        return peer;
    }

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleLoopback = useCallback(() => {
        if (!loopbackAudioRef.current) {
            const audio = document.createElement('audio');
            audio.autoplay = true;
            document.body.appendChild(audio);
            loopbackAudioRef.current = audio;
        }

        if (!loopbackActive) {
            if (localStreamRef.current) {
                loopbackAudioRef.current.srcObject = localStreamRef.current;
                loopbackAudioRef.current.play().catch(e => console.warn('Loopback play error:', e));
                setLoopbackActive(true);
                console.log('🔁 Mic loopback ON');
            }
        } else {
            loopbackAudioRef.current.pause();
            loopbackAudioRef.current.srcObject = null;
            setLoopbackActive(false);
            console.log('🔇 Mic loopback OFF');
        }
    }, [loopbackActive]);

    return { peers, isMuted, toggleMute, loopbackActive, toggleLoopback };
};

export default useVoiceChat;
