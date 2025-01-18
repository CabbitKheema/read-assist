import { useEffect, useRef, useState } from "react";
import { setTextResult } from "../../features/searchword/textResultSlice";
import { useDispatch, useSelector } from "react-redux";
// import { VoiceNoteToText } from "../../apis/VoiceNoteToText";
import { FiMic, FiPause, FiPlay, FiSearch, FiTrash } from "react-icons/fi";
import { IoStopOutline } from "react-icons/io5";
import BackToOptions from "./Buttons/BackToOptions";
import { websiteAction } from "../../enums/enums";
import { setWebsiteAction } from "../../features/websiteActions/websiteActionSlice";
import {
  borderColor,
  centerFadingAbsoluteLabel,
  circularInteractableEdgeStyle,
  fadingAbsoluteLabelSpan,
  hoverOrDisabledInteractableBG,
  idleActiveText,
  idleDisabledText,
  idleInteractableBG,
  idleTextSize,
  interactablePadding,
  labelSpanIconStyle,
  leftInteractableEdgeStyle,
  middleInteractableEdgeStyle,
  rightInteractableEdgeStyle,
  searchOptionStyle,
} from "../../constants";

import { useAudioRecorder } from "react-audio-voice-recorder";
import { useToast } from "../Toast/ToastService";
import { useForm } from "react-hook-form";
// import { VoiceNoteToText } from "../../apis/VoiceNoteToText";

export default function SearchByVoice() {
  const currentWebsiteAction = useSelector(
    (state) => state.websiteActionReducer.websiteAction
  );

  const isTranscribing = currentWebsiteAction == websiteAction.TRANSCRIBING;

  const [recordedAudio, setRecordedAudio] = useState(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const dispatch = useDispatch();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const {
    startRecording,
    stopRecording,
    recordingBlob,
    isRecording,
    // recordingTime,
  } = useAudioRecorder();

  useEffect(() => {
    if (!recordingBlob) return;

    // recordingBlob will be present at this point after 'stopRecording' has been called
    const audioUrl = URL.createObjectURL(recordingBlob);
    setRecordedAudio({ url: audioUrl, blob: recordingBlob });
  }, [recordingBlob]);
  // const startRecording = async () => {
  //   try {
  //   } catch (error) {
  //     console.error("Error accessing microphone:", error);
  //     dispatch(
  //       setTextResult("Error accessing the microphone. Please try again.")
  //     );
  //   }
  // };

  const cancelRecordedAudio = () => {
    reset();
    setRecordedAudio(null);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Define the async function
  const convertVoiceToText = async () => {
    console.log("Converting voice to text...");
    dispatch(setWebsiteAction(websiteAction.TRANSCRIBING));

    // VoiceNoteToText(recordedAudio.blob)
    //   .then((response) => {
    //     // large audio error
    //     // setValue(
    //     //   "inputText",
    //     //   "abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghija"
    //     // );

    //     // empty transcription error
    //     // setValue("inputText", "");

    //     // transcription returned space error
    //     // setValue("inputText", " ");

    //     // proper output
    //     setValue("inputText", response.data);

    //     toast.notificationToast(response);
    //   })
    //   .catch((response) => {
    //     console.error("Error recognizing voice:", response.error);
    //     toast.notificationToast(response);
    //     cancelRecordedAudio();
    //   })
    //   .finally(() => {
    //     dispatch(setWebsiteAction(websiteAction.IDLE));
    //   });

    // const file = new File([recordedAudio.blob], "audio.m4a", {
    //   type: "audio/m4a",
    // });

    // console.log("Request file:", file);
    // console.log("File size:", file.size);

    try {
      // Convert Blob to a File object (compatible with FormData)
      const audioFile = new File([recordedAudio.blob], "audio.m4a", {
        type: "audio/m4a",
      });

      const formData = new FormData();

      // Append the audio blob with a filename and correct MIME type if necessary
      formData.append("audioFile", audioFile);

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/transcribe-word`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400) {
          // Handle bad request specifically
          console.warn("Bad request:", data.error);
          toast.notificationToast(data);
        } else {
          // Handle general HTTP errors
          console.error("Error from server:", res.statusText);
          toast.notificationToast(data);
        }
      } else if (data.success === false) {
        // Handle API-level failure
        console.error("Error recognizing voice:", data.error);
        toast.notificationToast(data);
      } else {
        // Handle success
        setValue("inputText", data.data);
        toast.notificationToast(data);
      }
    } catch (error) {
      toast.notificationToast({
        message: ["Error!", error.message || "Something went wrong."],
      });
    } finally {
      dispatch(setWebsiteAction(websiteAction.IDLE));
    }
  };

  // Call the function when audio has been recorded
  useEffect(() => {
    if (recordedAudio && recordedAudio.blob) {
      convertVoiceToText();
    }
  }, [recordedAudio]);

  {
    /*End Mic recroding section*/
  }

  const onSubmit = async (formData) => {
    try {
      const res = await fetch(
        import.meta.env.VITE_BACKEND_URL + "/find-word-definition",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (data.success === false) {
        console.error("Error fetching word meaning:", data.error);
        toast.notificationToast(data);
      } else if (res.ok) {
        dispatch(setTextResult(data.data));
        toast.notificationToast(data);
        cancelRecordedAudio();
      } else if (res.status == 400) {
        toast.notificationToast(data);
      }
    } catch (error) {
      toast.notificationToast({
        message: ["Error!", error.message || "Something went wrong."],
      });
    }
  };

  return (
    <form className={searchOptionStyle} onSubmit={handleSubmit(onSubmit)}>
      <label className={centerFadingAbsoluteLabel}>
        <span
          className={`${fadingAbsoluteLabelSpan}  ${
            isRecording || recordedAudio !== null || errors.inputText
              ? "opacity-0"
              : "opacity-100"
          }`}
        >
          <FiMic className={labelSpanIconStyle} /> to record voice
        </span>

        <span
          className={`${fadingAbsoluteLabelSpan}  ${
            isRecording && !errors.inputText ? "opacity-100" : "opacity-0"
          } `}
        >
          <IoStopOutline className={labelSpanIconStyle} /> to stop recording
        </span>
        <span
          className={`${fadingAbsoluteLabelSpan}  ${
            isRecording ||
            isTranscribing ||
            isSubmitting ||
            errors.inputText ||
            isPlaying ||
            recordedAudio === null
              ? "opacity-0"
              : "opacity-100"
          }`}
        >
          <FiPlay className={labelSpanIconStyle} /> to replay recording
        </span>

        <span
          className={`${fadingAbsoluteLabelSpan} ${
            isPlaying && !errors.inputText ? "opacity-100" : "opacity-0"
          } `}
        >
          <FiPause className={labelSpanIconStyle} /> to pause replay
        </span>
        <span
          className={`${fadingAbsoluteLabelSpan} ${
            isSubmitting && !errors.inputText ? "opacity-100" : "opacity-0"
          } `}
        >
          Searching...
        </span>
        <span
          className={`${fadingAbsoluteLabelSpan} ${
            isTranscribing && !errors.inputText ? "opacity-100" : "opacity-0"
          } `}
        >
          Transcribing audio...
        </span>
      </label>

      {/*Audio recording/stop button*/}
      <button
        type="button"
        onClick={() =>
          isRecording ? stopRecording() : (reset(), startRecording())
        }
        className={`${interactablePadding} ${leftInteractableEdgeStyle} ${
          isPlaying || isSubmitting || isTranscribing
            ? hoverOrDisabledInteractableBG
            : idleInteractableBG
        } ${borderColor} `}
        disabled={isPlaying || isSubmitting || isTranscribing}
      >
        {isRecording ? <IoStopOutline /> : <FiMic />}
      </button>

      {recordedAudio === null ? (
        /*Open all options button*/
        <BackToOptions isRecording={isRecording} />
      ) : (
        <>
          {/*Recorded audio play/pause button*/}
          <button
            type="button"
            onClick={togglePlay}
            className={`${interactablePadding}  ${
              isRecording || isSubmitting || isTranscribing
                ? hoverOrDisabledInteractableBG
                : idleInteractableBG
            }  ${middleInteractableEdgeStyle} ${borderColor}`}
            disabled={isRecording || isSubmitting || isTranscribing}
          >
            {isPlaying ? <FiPause /> : <FiPlay />}
            {/* Hidden audio reference  */}
            <audio
              className="hidden"
              ref={audioRef}
              src={recordedAudio.url}
              onEnded={() => {
                setIsPlaying(false);
              }}
            />
          </button>
          {/*Transcription*/}
          <input
            type="text"
            {...register("inputText", {
              maxLength: 100,
              required: true,
              validate: (value) =>
                value.trim().length > 0 ||
                "Transcription returned space Say something",
            })}
            className={`p-2 ${middleInteractableEdgeStyle} ${idleTextSize} 
            ${
              isRecording || isSubmitting || isTranscribing
                ? idleDisabledText
                : idleActiveText
            }   
            ${borderColor} 
            
            w-full focus:outline-none`}
            placeholder="..."
            disabled={true}
          />
          {errors.inputText && (
            <div className="absolute bottom-16 flex-1 justify-center items-center">
              <p className="max-w-52 text-xs text-center bg-neutral-900 border border-red-500 rounded-lg p-2">
                {errors.inputText.type === "maxLength" &&
                  "Voice note too large Transcribed text should be at most 100 words"}
                {errors.inputText.type === "required" &&
                  "Empty voice note is not allowed"}
                {errors.inputText.message}
              </p>
              <div className="-mt-1 text-red-600 flex justify-center">|</div>
            </div>
          )}
          {/*Recorded audio deletion button*/}
          <button
            type="button"
            onClick={cancelRecordedAudio}
            className={`absolute bottom-0.5 p-1.5 ${circularInteractableEdgeStyle} ${
              isRecording || isPlaying || isSubmitting || isTranscribing
                ? hoverOrDisabledInteractableBG
                : idleInteractableBG
            }  ${borderColor}`}
            disabled={
              isPlaying || isRecording || isSubmitting || isTranscribing
            }
          >
            <FiTrash className="size-3" />
            {/* This is the vertical line connecting delete and play button */}
            <div className="absolute left-2.5 bottom-4 -z-10 text-neutral-600">
              |
            </div>
          </button>
          {/*Recorded audio search button*/}
          <button
            type="submit"
            // onClick={findInputTextMeaning}
            className={`${interactablePadding} ${rightInteractableEdgeStyle} ${
              isRecording || isPlaying || isSubmitting || isTranscribing
                ? hoverOrDisabledInteractableBG
                : idleInteractableBG
            }   ${borderColor}`}
            disabled={
              isPlaying || isRecording || isSubmitting || isTranscribing
            }
          >
            <FiSearch />
          </button>
        </>
      )}
    </form>
  );
}