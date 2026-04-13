import { NextRequest, NextResponse } from "next/server";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export async function POST(req: NextRequest) {
  try {
    const { audioData } = await req.json();

    if (!audioData) {
      return NextResponse.json({ error: "Missing audioData" }, { status: 400 });
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY!,
      process.env.AZURE_SPEECH_REGION!
    );
    speechConfig.speechRecognitionLanguage = "en-US";

    const audioBuffer = Buffer.from(audioData, "base64");
    const pushStream = sdk.AudioInputStream.createPushStream();
    pushStream.write(
      audioBuffer.buffer.slice(
        audioBuffer.byteOffset,
        audioBuffer.byteOffset + audioBuffer.byteLength
      )
    );
    pushStream.close();

    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    const result = await new Promise<{ transcript: string; confidence: number }>(
      (resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (res) => {
            recognizer.close();
            if (res.reason === sdk.ResultReason.RecognizedSpeech) {
              resolve({ transcript: res.text, confidence: 1.0 });
            } else if (res.reason === sdk.ResultReason.NoMatch) {
              resolve({ transcript: "", confidence: 0 });
            } else {
              const cancel = sdk.CancellationDetails.fromResult(res);
              reject(new Error(`STT failed: ${cancel.errorDetails}`));
            }
          },
          (error) => {
            recognizer.close();
            reject(error);
          }
        );
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("STT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "STT failed" },
      { status: 500 }
    );
  }
}
