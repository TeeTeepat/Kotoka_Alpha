import { NextRequest, NextResponse } from "next/server";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export async function POST(req: NextRequest) {
  try {
    const { text, lang = "en-US" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY!,
      process.env.AZURE_SPEECH_REGION!
    );
    speechConfig.speechSynthesisLanguage = lang;
    speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";

    const audioChunks: Buffer[] = [];

    const synthesizer = new sdk.SpeechSynthesizer(
      speechConfig,
      sdk.AudioConfig.fromStreamOutput(
        sdk.AudioOutputStream.createPullStream()
      )
    );

    const audioBytes = await new Promise<ArrayBuffer>((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        (result) => {
          synthesizer.close();
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve(result.audioData);
          } else {
            reject(new Error(`TTS synthesis failed with reason: ${result.reason}`));
          }
        },
        (error) => {
          synthesizer.close();
          reject(error);
        }
      );
    });

    return new NextResponse(audioBytes, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "TTS failed" },
      { status: 500 }
    );
  }
}
