import { useState, useRef, useCallback } from 'react';
import { getAiClient } from '../../services/geminiService';
import { LiveServerMessage, Modality, Blob } from '@google/genai';

// Audio encoding & decoding functions
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface LiveSession {
    close: () => void;
    sendRealtimeInput: (input: { media: Blob }) => void;
}

interface UseLiveSessionProps {
    onMessage: (message: LiveServerMessage & {userInput?: string; modelOutput?: string}) => void;
    onError?: (error: any) => void;
    systemInstruction?: string;
}

export const useLiveSession = ({ onMessage, onError, systemInstruction }: UseLiveSessionProps) => {
    const [isListening, setIsListening] = useState(false);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);
    const liveTranscriptionRef = useRef({ userInput: '', modelOutput: '' });

    const stopAudioPlayback = useCallback(() => {
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, []);

    const stopMic = useCallback(() => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if(processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    },[]);

    const stop = useCallback(async () => {
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session", e);
            }
            sessionPromiseRef.current = null;
        }
        stopMic();
        stopAudioPlayback();
        setIsListening(false);
    }, [stopMic, stopAudioPlayback]);
    
    const start = useCallback(async () => {
        if (isListening) return;

        setIsListening(true);
        stopAudioPlayback();
        
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = 0;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            
            const ai = getAiClient();
            sessionPromiseRef.current = ai.live.connect({
                // FIX: Updated model name to 'gemini-2.5-flash-native-audio-preview-12-2025' per GenAI guidelines.
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    ...(systemInstruction && { systemInstruction })
                },
                callbacks: {
                    onopen: () => {
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        const source = audioContextRef.current.createMediaStreamSource(stream);
                        processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        processorRef.current.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                            
                            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(processorRef.current);
                        processorRef.current.connect(audioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            liveTranscriptionRef.current.userInput += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                             liveTranscriptionRef.current.modelOutput += message.serverContent.outputTranscription.text;
                        }

                        onMessage(message);

                        // Use optional chaining for inlineData and data to prevent unhandled rejection
                        const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            nextStartTimeRef.current = Math.max(
                              nextStartTimeRef.current,
                              outputAudioContextRef.current.currentTime,
                            );
                            const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContextRef.current, 24000, 1);
                            const sourceNode = outputAudioContextRef.current.createBufferSource();
                            sourceNode.buffer = audioBuffer;
                            sourceNode.connect(outputAudioContextRef.current.destination);
                            sourceNode.addEventListener('ended', () => {
                              sourcesRef.current.delete(sourceNode);
                            });
                    
                            sourceNode.start(nextStartTimeRef.current);
                            nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
                            sourcesRef.current.add(sourceNode);
                        }
                        
                        if(message.serverContent?.turnComplete){
                            const userInput = liveTranscriptionRef.current.userInput.trim();
                            const modelOutput = liveTranscriptionRef.current.modelOutput.trim();
                            onMessage({ ...message, userInput, modelOutput } as any);
                            liveTranscriptionRef.current = { userInput: '', modelOutput: '' };
                        }

                        if(message.serverContent?.interrupted){
                            stopAudioPlayback();
                        }
                    },
                    onclose: () => { 
                        console.log('Session closed'); 
                        stopMic(); 
                    },
                    onerror: (e) => { 
                        console.error('Session error', e); 
                        if (onError) onError(e);
                        stop(); 
                    }
                }
            });
        } catch (error) {
            console.error("Mic/session failed", error);
            if (onError) onError(error);
            setIsListening(false);
        }
    }, [isListening, onMessage, onError, stop, stopAudioPlayback, stopMic, systemInstruction]);

    return { isListening, start, stop };
};
