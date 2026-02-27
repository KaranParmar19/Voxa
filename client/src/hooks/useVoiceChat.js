import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';

// Polyfill for global
if (typeof window !== 'undefined' && !window.global) {
    window.global = window;
}

const useVoiceChat = (roomId, user, socket) => {
    const [peers, setPeers] = useState([]); // [{ peerID, peer }]
    const [isMuted, setIsMuted] = useState(false);
    const [loopbackActive, setLoopbackActive] = useState(false);

    const localStreamRef = useRef(null);   // the raw MediaStream from mic
    const loopbackAudioRef = useRef(null); // hidden <audio> for loopback
    const peersRef = useRef([]);
    const socketRef = useRef(socket);

    useEffect(() => {
        socketRef.current = socket;
    }, [socket]);

    useEffect(() => {
        if (!roomId || !user) return;

        console.log("🎤 VoiceChat Hook: Mounting... Socket ID:", socket?.id);
        const isMounted = { current: true };
        let cleanupListeners = null;

        const initVoice = async () => {
            try {
                console.log("🎤 VoiceChat: Requesting Mic Permissions...");
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

                if (!isMounted.current) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                console.log("🎤 VoiceChat: Mic Access Granted!");
                localStreamRef.current = stream;

                // --- Handlers ---
                const handleUserJoined = (newUser) => {
                    const targetId = newUser.socketId;
                    if (targetId === socketRef.current.id) return;

                    if (peersRef.current.find(p => p.peerID === targetId)) {
                        console.warn("⚠️ Voice: Peer already exists (Join), skipping:", targetId);
                        return;
                    }

                    console.log("📞 Voice: User joined, initiating call to:", targetId);
                    const peer = createPeer(targetId, socketRef.current.id, stream, user);
                    peersRef.current.push({ peerID: targetId, peer });
                    setPeers((users) => [...users, { peerID: targetId, peer }]);
                };

                const handleIncomingCall = (payload) => {
                    const targetId = payload.callerId;
                    if (peersRef.current.find(p => p.peerID === targetId)) {
                        console.warn("⚠️ Voice: Peer already exists (Incoming), skipping:", targetId);
                        return;
                    }

                    console.log("📞 Voice: Receiving call from:", targetId);
                    const peer = addPeer(payload.signal, targetId, stream);
                    peersRef.current.push({ peerID: targetId, peer });
                    setPeers((users) => [...users, { peerID: targetId, peer }]);
                };

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

                // Attach Listeners
                if (socketRef.current) {
                    socketRef.current.on("user-joined", handleUserJoined);
                    socketRef.current.on("user-joined-signal", handleIncomingCall);
                    socketRef.current.on("receiving-returned-signal", handleReturnSignal);
                    socketRef.current.on("user-left", handleUserLeft);
                }

                return () => {
                    if (socketRef.current) {
                        socketRef.current.off("user-joined", handleUserJoined);
                        socketRef.current.off("user-joined-signal", handleIncomingCall);
                        socketRef.current.off("receiving-returned-signal", handleReturnSignal);
                        socketRef.current.off("user-left", handleUserLeft);
                    }
                };

            } catch (err) {
                console.error("Voice Chat Error:", err);
            }
        };

        initVoice().then(cleanup => {
            cleanupListeners = cleanup;
        });

        return () => {
            isMounted.current = false;
            // Stop loopback if active
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

    function createPeer(userToSignal, callerId, stream, user) {
        const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending-signal", { userToSignal, callerId, signal, user });
        });

        peer.on("error", err => console.error("❌ Initiator Peer Error:", err));
        return peer;
    }

    function addPeer(incomingSignal, callerId, stream) {
        const peer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("returning-signal", { signal, callerId });
        });

        peer.on("error", err => console.error("❌ Receiver Peer Error:", err));
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

    // Loopback: play your own mic audio back to yourself
    const toggleLoopback = useCallback(() => {
        if (!loopbackAudioRef.current) {
            // Create a hidden audio element for loopback
            const audio = document.createElement('audio');
            audio.autoplay = true;
            audio.muted = false;
            // Do NOT set 'muted' – we WANT to hear ourselves
            document.body.appendChild(audio);
            loopbackAudioRef.current = audio;
        }

        if (!loopbackActive) {
            // Start loopback
            if (localStreamRef.current) {
                loopbackAudioRef.current.srcObject = localStreamRef.current;
                loopbackAudioRef.current
                    .play()
                    .catch(e => console.warn("Loopback play error:", e));
                setLoopbackActive(true);
                console.log("🔁 Mic loopback ON");
            }
        } else {
            // Stop loopback
            loopbackAudioRef.current.pause();
            loopbackAudioRef.current.srcObject = null;
            setLoopbackActive(false);
            console.log("🔇 Mic loopback OFF");
        }
    }, [loopbackActive]);

    return { peers, isMuted, toggleMute, loopbackActive, toggleLoopback };
};

export default useVoiceChat;
