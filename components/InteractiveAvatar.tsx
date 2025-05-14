import {
  AvatarQuality,
  StreamingEvents,
  VoiceChatTransport,
  VoiceEmotion,
  StartAvatarRequest,
  STTProvider,
  ElevenLabsModel,
} from "@heygen/streaming-avatar";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, useUnmount } from "ahooks";

import { Button } from "./Button";
import { AvatarConfig } from "./AvatarConfig";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { AvatarControls } from "./AvatarSession/AvatarControls";
import { useVoiceChat } from "./logic/useVoiceChat";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from "./logic";
import { LoadingIcon, MicIcon } from "./Icons";
import { MessageHistory } from "./AvatarSession/MessageHistory";

import { AVATARS } from "@/app/lib/constants";

const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.High,
  avatarName: AVATARS[0].avatar_id,
  knowledgeId: undefined,
  voice: {
    rate: 1.5,
    emotion: VoiceEmotion.EXCITED,
    model: ElevenLabsModel.eleven_flash_v2_5,
  },
  language: "en",
  voiceChatTransport: VoiceChatTransport.LIVEKIT,
  sttSettings: {
    provider: STTProvider.DEEPGRAM,
  },
};

function InteractiveAvatar() {
  const { initAvatar, startAvatar, stopAvatar, sessionState, stream } =
    useStreamingAvatarSession();
  const { startVoiceChat } = useVoiceChat();

  const [config, setConfig] = useState<StartAvatarRequest>(DEFAULT_CONFIG);
  const [userVideoStream, setUserVideoStream] = useState<MediaStream | null>(null);

  const mediaStream = useRef<HTMLVideoElement>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();

      console.log("Access Token:", token); // Log the token to verify

      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      throw error;
    }
  }

  // Function to start the user's webcam
  const startUserCamera = async () => {
    try {
      // Release any existing streams first
      if (userVideoStream) {
        userVideoStream.getTracks().forEach(track => track.stop());
        setUserVideoStream(null);
      }
      
      console.log('Requesting camera access...');
      // Use more specific constraints to help with initialization
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 360 },
          facingMode: "user"
        },
        audio: true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted:', stream);
      
      // Check that we actually have video tracks
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error("No video tracks found in media stream");
      }
      
      console.log('Video tracks:', videoTracks);
      setUserVideoStream(stream);
      
      // Set the stream directly
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = null; // Clear any existing sources
        userVideoRef.current.srcObject = stream;
        console.log('Video element:', userVideoRef.current);
        
        // Force play with a small delay
        setTimeout(() => {
          if (userVideoRef.current) {
            userVideoRef.current.play()
              .then(() => console.log('Video is playing'))
              .catch(e => console.error('Error playing video:', e));
          }
        }, 100);
      }
      
      return stream;
    } catch (error) {
      console.error("Error accessing webcam:", error);
      // Handle the unknown error type safely
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Unable to access your camera: ${errorMessage}. Please check if another app is using your camera.`);
      return null;
    }
  };
  
  // Function to stop the user's webcam
  const stopUserCamera = () => {
    if (userVideoStream) {
      userVideoStream.getTracks().forEach(track => track.stop());
      setUserVideoStream(null);
    }
  };

  const startSessionV2 = useMemoizedFn(async (isVoiceChat: boolean) => {
    try {
      // Start the user's camera first
      await startUserCamera();
      
      const newToken = await fetchAccessToken();
      const avatar = initAvatar(newToken);

      avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        console.log("Avatar started talking", e);
      });
      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        console.log("Avatar stopped talking", e);
      });
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
        // Stop the camera when the stream disconnects
        stopUserCamera();
      });
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log(">>>>> Stream ready:", event.detail);
      });
      avatar.on(StreamingEvents.USER_START, (event) => {
        console.log(">>>>> User started talking:", event);
      });
      avatar.on(StreamingEvents.USER_STOP, (event) => {
        console.log(">>>>> User stopped talking:", event);
      });
      avatar.on(StreamingEvents.USER_END_MESSAGE, (event) => {
        console.log(">>>>> User end message:", event);
      });
      avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
        console.log(">>>>> User talking message:", event);
      });
      avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
        console.log(">>>>> Avatar talking message:", event);
      });
      avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
        console.log(">>>>> Avatar end message:", event);
      });

      await startAvatar(config);

      if (isVoiceChat) {
        await startVoiceChat();
      }
    } catch (error) {
      console.error("Error starting avatar session:", error);
      // Make sure to clean up camera if there's an error
      stopUserCamera();
    }
  });

  useUnmount(() => {
    stopAvatar();
    stopUserCamera();
  });

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
      };
    }
  }, [mediaStream, stream]);

  // Function to force restart camera when needed
  const forceRestartCamera = async () => {
    // Stop any existing streams
    if (userVideoStream) {
      userVideoStream.getTracks().forEach(track => track.stop());
      setUserVideoStream(null);
    }
    
    // Reset the video element
    if (userVideoRef.current) {
      userVideoRef.current.srcObject = null;
    }
    
    // Small delay before restarting
    setTimeout(() => {
      startUserCamera();
    }, 500);
  };
  
  // Effect to handle the user's webcam video element
  useEffect(() => {
    if (userVideoStream && userVideoRef.current) {
      console.log('Setting video source in effect hook');
      userVideoRef.current.srcObject = userVideoStream;
      userVideoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded, playing');
        userVideoRef.current!.play().catch(e => console.error('Error playing video:', e));
      };
    }

    // Cleanup function
    return () => {
      if (userVideoStream) {
        console.log('Cleaning up user video stream');
      }
    };
  }, [userVideoStream]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col rounded-xl bg-zinc-900 overflow-hidden">
        <div className="relative w-full aspect-video overflow-hidden flex flex-col items-center justify-center">
          {sessionState !== StreamingAvatarSessionState.INACTIVE ? (
            <div className="relative w-full h-full">
              {/* Main avatar display */}
              <div className="w-full h-full">
                <AvatarVideo ref={mediaStream} />
              </div>
              
              {/* User webcam display (small picture-in-picture) */}
              <div className="absolute bottom-4 right-4 w-1/3 aspect-video rounded-lg overflow-hidden shadow-xl border-2 border-indigo-500 z-10">
                {userVideoStream ? (
                  <>
                    <video
                      ref={userVideoRef}
                      autoPlay
                      playsInline
                      muted
                      width="100%"
                      height="100%"
                      style={{
                        backgroundColor: "#000",
                        objectFit: "cover",
                        transform: "scaleX(-1)" // Mirror the camera
                      }}
                    />
                    <div className="absolute top-1 left-1 text-xs text-white bg-black/50 px-1 rounded">
                      Your Camera
                    </div>
                    {/* Camera troubleshooting button */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault(); 
                        e.stopPropagation();
                        forceRestartCamera();
                      }}
                      className="absolute bottom-1 right-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded transition-colors duration-200"
                    >
                      Restart Camera
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/50 text-indigo-400">
                    Waiting for camera...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <AvatarConfig config={config} onConfigChange={setConfig} />
          )}
        </div>
        <div className="flex flex-col gap-3 items-center justify-center p-4 border-t border-zinc-700 w-full">
          {sessionState === StreamingAvatarSessionState.CONNECTED ? (
            <AvatarControls />
          ) : sessionState === StreamingAvatarSessionState.INACTIVE ? (
            <div className="flex items-center justify-center">
              <div className="relative group cursor-pointer">
                <div 
                  onClick={() => startSessionV2(true)}
                  className="relative z-10 flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 transition-all duration-300 shadow-lg"
                >
                  <div className="absolute inset-0 rounded-full bg-indigo-600 animate-ping opacity-25"></div>
                  <div className="absolute inset-0 rounded-full bg-purple-700 animate-pulse opacity-20"></div>
                  <MicIcon size={40} className="text-white" />
                </div>
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-indigo-400 font-medium text-center whitespace-nowrap">
                  Click to start video call
                </div>
              </div>
            </div>
          ) : (
            <LoadingIcon />
          )}
        </div>
      </div>
      {sessionState === StreamingAvatarSessionState.CONNECTED && (
        <MessageHistory />
      )}
    </div>
  );
}

export default function InteractiveAvatarWrapper() {
  return (
    <StreamingAvatarProvider basePath={process.env.NEXT_PUBLIC_BASE_API_URL}>
      <InteractiveAvatar />
    </StreamingAvatarProvider>
  );
}
