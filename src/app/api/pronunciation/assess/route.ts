import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export async function POST(req: NextRequest) {
  // Require authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { referenceText, audioData } = await req.json();

    if (!referenceText || !audioData) {
      return NextResponse.json(
        { error: "Missing referenceText or audioData" },
        { status: 400 }
      );
    }

    // Server-side config - key NOT exposed to client
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY!,
      process.env.AZURE_SPEECH_REGION!
    );

    // Convert base64 audio to Azure format
    const audioBuffer = Buffer.from(audioData, "base64");
    const pushStream = sdk.AudioInputStream.createPushStream();
    pushStream.write(audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength));
    pushStream.close();

    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // Configure pronunciation assessment
    const assessmentConfig = new sdk.PronunciationAssessmentConfig(
      referenceText,
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Phoneme,
      true
    );
    assessmentConfig.enableProsodyAssessment = true;
    assessmentConfig.applyTo(recognizer);

    // Perform recognition with cleanup
    const result = await new Promise<sdk.SpeechRecognitionResult>((resolve, reject) => {
      recognizer.recognizeOnceAsync((result) => {
        recognizer.close();
        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
          resolve(result);
        } else if (result.reason === sdk.ResultReason.NoMatch) {
          reject(new Error("No speech detected"));
        } else if (result.reason === sdk.ResultReason.Canceled) {
          const cancelDetails = sdk.CancellationDetails.fromResult(result);
          reject(new Error(`Recognition canceled: ${cancelDetails.reason}`));
        } else {
          reject(new Error("Recognition failed"));
        }
      }, (error) => {
        recognizer.close();
        reject(error);
      });
    });

    // Extract results
    const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result);
    const detailedResult = JSON.parse(result.json);

    const metrics = {
      pronunciationScore: pronunciationResult.pronunciationScore,
      accuracyScore: pronunciationResult.accuracyScore,
      fluencyScore: pronunciationResult.fluencyScore,
      completenessScore: pronunciationResult.completenessScore,
    };

    if (pronunciationResult.prosodyScore !== undefined) {
      (metrics as any).prosodyScore = pronunciationResult.prosodyScore;
    }

    return NextResponse.json({
      ...metrics,
      detailedResult,
    });
  } catch (error) {
    console.error("Pronunciation assessment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Assessment failed" },
      { status: 500 }
    );
  }
}
