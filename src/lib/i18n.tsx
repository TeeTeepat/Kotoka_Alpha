"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Locale = "th" | "en";

export interface Strings {
  // ── Common ──────────────────────────────────────────────
  appName: string;
  tagline: string;
  save: string;
  cancel: string;
  next: string;
  back: string;
  done: string;
  skip: string;
  confirm: string;
  loading: string;
  error: string;
  retry: string;
  close: string;
  edit: string;
  delete: string;
  search: string;
  yes: string;
  no: string;
  ok: string;
  of: string;
  words: string;
  score: string;
  correct: string;
  incorrect: string;
  start: string;
  finish: string;
  continue: string;
  restart: string;
  submit: string;
  learnMore: string;
  seeAll: string;
  tryAgain: string;
  great: string;
  wellDone: string;
  keepGoing: string;
  beta: string;

  // ── Bottom Nav ──────────────────────────────────────────
  navHome: string;
  navReview: string;
  navSnap: string;
  navCommunity: string;
  navStory: string;

  // ── Status Bar ──────────────────────────────────────────
  statusBarStreak: string;

  // ── Home / Root ─────────────────────────────────────────
  homeGreeting: string;
  homeSubtitle: string;
  homeStartSnap: string;
  homeStartReview: string;
  homeDailyGoal: string;
  homeStreakDays: string;
  homeWordsLearned: string;
  homeWordsToday: string;
  homeQuickReview: string;
  homeSnap: string;

  // ── Login ───────────────────────────────────────────────
  loginTitle: string;
  loginSubtitle: string;
  loginWithGoogle: string;
  loginEmail: string;
  loginPassword: string;
  loginSignIn: string;
  loginNoAccount: string;
  loginSignUp: string;
  loginForgotPassword: string;
  loginTerms: string;

  // ── Sign Up ─────────────────────────────────────────────
  signupTitle: string;
  signupSubtitle: string;
  signupName: string;
  signupEmail: string;
  signupPassword: string;
  signupCreateAccount: string;
  signupHaveAccount: string;
  signupSignIn: string;
  signupWithGoogle: string;

  // ── Consent ─────────────────────────────────────────────
  consentTitle: string;
  consentSubtitle: string;
  consentBody: string;
  consentAccept: string;
  consentDecline: string;
  consentPrivacy: string;
  consentTerms: string;

  // ── Onboarding: Language ────────────────────────────────
  onboardLangTitle: string;
  onboardLangSubtitle: string;
  onboardLangNative: string;
  onboardLangTarget: string;
  onboardLangContinue: string;

  // ── Onboarding: CEFR Test ───────────────────────────────
  onboardCefrTitle: string;
  onboardCefrSubtitle: string;
  onboardCefrStart: string;
  onboardCefrQuestion: string;
  onboardCefrListening: string;
  onboardCefrReading: string;
  onboardCefrWriting: string;
  onboardCefrProgress: string;
  onboardCefrPlayAudio: string;
  onboardCefrPlaying: string;
  onboardCefrLoading: string;
  onboardCefrPlayAgain: string;
  onboardCefrHint: string;

  // ── Onboarding: CEFR Result ─────────────────────────────
  onboardResultTitle: string;
  onboardResultSubtitle: string;
  onboardResultLevel: string;
  onboardResultDesc: string;
  onboardResultContinue: string;
  onboardResultRetake: string;

  // ── Review Hub ──────────────────────────────────────────
  reviewTitle: string;
  reviewSubtitle: string;
  reviewDueToday: string;
  reviewNoCards: string;
  reviewStartSession: string;
  reviewFlashcards: string;
  reviewFillBlank: string;
  reviewPronunciation: string;
  reviewConversation: string;
  reviewDictation: string;
  reviewReadWrite: string;
  reviewListening: string;
  reviewCefrRetest: string;
  reviewWordsReady: string;
  reviewAllCaughtUp: string;
  reviewDeckCount: string;

  // ── Session ─────────────────────────────────────────────
  sessionTitle: string;
  sessionProgress: string;
  sessionComplete: string;
  sessionXpEarned: string;
  sessionCoinsEarned: string;
  sessionStreakBonus: string;
  sessionSummary: string;
  sessionBackToReview: string;
  sessionAccuracy: string;
  sessionNextSkill: string;
  sessionSkillFlashcard: string;
  sessionSkillFillBlank: string;
  sessionSkillPronunciation: string;
  sessionSkillConversation: string;

  // ── Flashcards ──────────────────────────────────────────
  flashcardTitle: string;
  flashcardTap: string;
  flashcardKnow: string;
  flashcardDontKnow: string;
  flashcardDefinition: string;
  flashcardExample: string;
  flashcardTranslation: string;
  flashcardRemaining: string;

  // ── Fill in the Blank ───────────────────────────────────
  fillBlankTitle: string;
  fillBlankInstruction: string;
  fillBlankCheck: string;
  fillBlankHint: string;
  fillBlankCorrect: string;
  fillBlankIncorrect: string;
  fillBlankAnswer: string;

  // ── Pronunciation ───────────────────────────────────────
  pronunciationTitle: string;
  pronunciationInstruction: string;
  pronunciationTap: string;
  pronunciationRecording: string;
  pronunciationAnalyzing: string;
  pronunciationScore: string;
  pronunciationFeedback: string;
  pronunciationTryAgain: string;
  pronunciationNext: string;
  pronunciationAccuracy: string;
  pronunciationFluency: string;
  pronunciationCompleteness: string;

  // ── Conversation ────────────────────────────────────────
  conversationTitle: string;
  conversationInstruction: string;
  conversationPlaceholder: string;
  conversationExchanges: string;
  conversationComplete: string;
  conversationBeta: string;
  conversationBetaNotice: string;

  // ── Dictation ───────────────────────────────────────────
  dictationTitle: string;
  dictationInstruction: string;
  dictationPlay: string;
  dictationCheck: string;
  dictationYourAnswer: string;

  // ── Read & Write ────────────────────────────────────────
  readWriteTitle: string;
  readWriteInstruction: string;
  readWriteYourAnswer: string;
  readWriteCheck: string;
  readWriteHint: string;

  // ── CEFR Retest ─────────────────────────────────────────
  cefrRetestTitle: string;
  cefrRetestSubtitle: string;
  cefrRetestStart: string;

  // ── Snap & Learn ────────────────────────────────────────
  snapTitle: string;
  snapSubtitle: string;
  snapAnalyzing: string;
  snapPickWords: string;
  snapFound: string;
  snapScene: string;
  snapGallery: string;
  snapCameraError: string;
  snapOpenCamera: string;
  snapRetake: string;

  // ── Tag Page ────────────────────────────────────────────
  tagTitle: string;
  tagSubtitle: string;
  tagContextDetected: string;
  tagGpsZone: string;
  tagWeather: string;
  tagScene: string;
  tagHowFeeling: string;
  tagPickMood: string;
  tagMood: string;
  tagPlace: string;
  tagAmbientSound: string;
  tagSoundAssigned: string;
  tagWordsToSave: string;
  tagSaveWords: string;
  tagSaving: string;
  tagSaved: string;
  tagPreview: string;

  // ── Story ───────────────────────────────────────────────
  storyTitle: string;
  storySubtitle: string;
  storyRead: string;
  storyListen: string;
  storyVocab: string;
  storyProgress: string;
  storyComplete: string;
  storyNoContent: string;

  // ── Community: Leaderboard ──────────────────────────────
  leaderboardTitle: string;
  leaderboardSubtitle: string;
  leaderboardRank: string;
  leaderboardXp: string;
  leaderboardYou: string;
  leaderboardWeekly: string;
  leaderboardAllTime: string;
  leaderboardEmpty: string;

  // ── Community: Nearby ───────────────────────────────────
  nearbyTitle: string;
  nearbySubtitle: string;
  nearbyLocating: string;
  nearbyNoUsers: string;
  nearbyDistance: string;
  nearbyLevel: string;
  nearbyConnect: string;

  // ── Profile ─────────────────────────────────────────────
  profileTitle: string;
  profileEditProfile: string;
  profileLevel: string;
  profileXp: string;
  profileCoins: string;
  profileStreak: string;
  profileWordsLearned: string;
  profileDecksCreated: string;
  profileAchievements: string;
  profileSettings: string;
  profileLogout: string;
  profileJoined: string;

  // ── Settings / Privacy ──────────────────────────────────
  settingsTitle: string;
  settingsLanguage: string;
  settingsLanguageDesc: string;
  settingsNotifications: string;
  settingsPrivacy: string;
  settingsPrivacyDesc: string;
  settingsLocationData: string;
  settingsLocationDataDesc: string;
  settingsDeleteData: string;
  settingsDeleteDataDesc: string;
  settingsDeleteConfirm: string;
  settingsSaved: string;
  settingsThaiLanguage: string;
  settingsEnglishLanguage: string;

  // ── Shop ────────────────────────────────────────────────
  shopTitle: string;
  shopSubtitle: string;
  shopBuy: string;
  shopOwned: string;
  shopCoins: string;
  shopGems: string;
  shopNotEnough: string;
  shopPurchased: string;

  // ── Gacha ───────────────────────────────────────────────
  gachaTitle: string;
  gachaSubtitle: string;
  gachaSpin: string;
  gachaSpinning: string;
  gachaResult: string;
  gachaAgain: string;
  gachaCost: string;

  // ── Luggage ─────────────────────────────────────────────
  luggageTitle: string;
  luggageSubtitle: string;
  luggageEmpty: string;
  luggageEmptyDesc: string;
  luggageWordsCollected: string;

  // ── Memory Map ──────────────────────────────────────────
  memoryMapTitle: string;
  memoryMapSubtitle: string;
  memoryMapNodes: string;
  memoryMapUnlocked: string;
  memoryMapLocked: string;
  memoryMapReview: string;
}

const th: Strings = {
  // Common
  appName: "Kotoka",
  tagline: "เรียนรู้ภาษาอังกฤษผ่านชีวิตประจำวัน",
  save: "บันทึก",
  cancel: "ยกเลิก",
  next: "ถัดไป",
  back: "ย้อนกลับ",
  done: "เสร็จสิ้น",
  skip: "ข้าม",
  confirm: "ยืนยัน",
  loading: "กำลังโหลด...",
  error: "เกิดข้อผิดพลาด",
  retry: "ลองใหม่",
  close: "ปิด",
  edit: "แก้ไข",
  delete: "ลบ",
  search: "ค้นหา",
  yes: "ใช่",
  no: "ไม่",
  ok: "ตกลง",
  of: "จาก",
  words: "คำ",
  score: "คะแนน",
  correct: "ถูกต้อง",
  incorrect: "ไม่ถูกต้อง",
  start: "เริ่ม",
  finish: "จบ",
  continue: "ดำเนินการต่อ",
  restart: "เริ่มใหม่",
  submit: "ส่ง",
  learnMore: "เรียนรู้เพิ่มเติม",
  seeAll: "ดูทั้งหมด",
  tryAgain: "ลองอีกครั้ง",
  great: "เยี่ยมมาก!",
  wellDone: "ทำได้ดีมาก!",
  keepGoing: "สู้ต่อไป!",
  beta: "เบต้า",

  // Bottom Nav
  navHome: "หน้าหลัก",
  navReview: "ทบทวน",
  navSnap: "ถ่ายภาพ",
  navCommunity: "ชุมชน",
  navStory: "เรื่องราว",

  // Status Bar
  statusBarStreak: "วันต่อเนื่อง",

  // Home
  homeGreeting: "สวัสดี",
  homeSubtitle: "วันนี้เรียนรู้คำศัพท์ใหม่กันเถอะ!",
  homeStartSnap: "ถ่ายภาพและเรียนรู้",
  homeStartReview: "ทบทวนคำศัพท์",
  homeDailyGoal: "เป้าหมายวันนี้",
  homeStreakDays: "วันต่อเนื่อง",
  homeWordsLearned: "คำที่เรียนแล้ว",
  homeWordsToday: "คำวันนี้",
  homeQuickReview: "ทบทวนด่วน",
  homeSnap: "ถ่ายภาพ",

  // Login
  loginTitle: "ยินดีต้อนรับกลับ",
  loginSubtitle: "เข้าสู่ระบบเพื่อดำเนินการต่อ",
  loginWithGoogle: "เข้าสู่ระบบด้วย Google",
  loginEmail: "อีเมล",
  loginPassword: "รหัสผ่าน",
  loginSignIn: "เข้าสู่ระบบ",
  loginNoAccount: "ยังไม่มีบัญชี?",
  loginSignUp: "สมัครสมาชิก",
  loginForgotPassword: "ลืมรหัสผ่าน?",
  loginTerms: "การเข้าสู่ระบบหมายความว่าคุณยอมรับข้อกำหนดการใช้งานของเรา",

  // Sign Up
  signupTitle: "สร้างบัญชีใหม่",
  signupSubtitle: "เริ่มต้นการเรียนรู้วันนี้",
  signupName: "ชื่อของคุณ",
  signupEmail: "อีเมล",
  signupPassword: "รหัสผ่าน",
  signupCreateAccount: "สร้างบัญชี",
  signupHaveAccount: "มีบัญชีอยู่แล้ว?",
  signupSignIn: "เข้าสู่ระบบ",
  signupWithGoogle: "สมัครด้วย Google",

  // Consent
  consentTitle: "นโยบายความเป็นส่วนตัว",
  consentSubtitle: "โปรดอ่านและยอมรับก่อนใช้งาน",
  consentBody: "Kotoka ใช้ข้อมูลตำแหน่งและรูปภาพของคุณเพื่อสร้างประสบการณ์การเรียนรู้ที่ปรับแต่งตามบริบท ข้อมูลของคุณจะไม่ถูกแชร์กับบุคคลที่สาม",
  consentAccept: "ยอมรับและดำเนินการต่อ",
  consentDecline: "ไม่ยอมรับ",
  consentPrivacy: "นโยบายความเป็นส่วนตัว",
  consentTerms: "ข้อกำหนดการใช้งาน",

  // Onboarding: Language
  onboardLangTitle: "เลือกภาษา",
  onboardLangSubtitle: "เลือกภาษาต้นทางและภาษาที่ต้องการเรียน",
  onboardLangNative: "ภาษาของคุณ",
  onboardLangTarget: "ภาษาที่ต้องการเรียน",
  onboardLangContinue: "ดำเนินการต่อ",

  // Onboarding: CEFR Test
  onboardCefrTitle: "ทดสอบระดับภาษา",
  onboardCefrSubtitle: "ให้เราประเมินระดับภาษาของคุณ",
  onboardCefrStart: "เริ่มทดสอบ",
  onboardCefrQuestion: "คำถาม",
  onboardCefrListening: "ฟัง",
  onboardCefrReading: "อ่าน",
  onboardCefrWriting: "เขียน",
  onboardCefrProgress: "ความคืบหน้า",
  onboardCefrPlayAudio: "เล่นเสียง",
  onboardCefrPlaying: "กำลังเล่น...",
  onboardCefrLoading: "กำลังโหลด...",
  onboardCefrPlayAgain: "เล่นอีกครั้ง",
  onboardCefrHint: "กดเล่นเสียงก่อน แล้วจึงตอบคำถาม",

  // Onboarding: CEFR Result
  onboardResultTitle: "ผลการทดสอบ",
  onboardResultSubtitle: "ระดับภาษาของคุณคือ",
  onboardResultLevel: "ระดับ",
  onboardResultDesc: "เราจะปรับบทเรียนให้เหมาะกับระดับของคุณ",
  onboardResultContinue: "เริ่มเรียนรู้",
  onboardResultRetake: "ทำแบบทดสอบใหม่",

  // Review Hub
  reviewTitle: "ทบทวน",
  reviewSubtitle: "ทบทวนคำศัพท์ของคุณ",
  reviewDueToday: "ถึงกำหนดวันนี้",
  reviewNoCards: "ไม่มีการ์ดที่ต้องทบทวน",
  reviewStartSession: "เริ่มเซสชัน",
  reviewFlashcards: "บัตรคำ",
  reviewFillBlank: "เติมคำ",
  reviewPronunciation: "การออกเสียง",
  reviewConversation: "บทสนทนา",
  reviewDictation: "การเขียนตามคำบอก",
  reviewReadWrite: "อ่านและเขียน",
  reviewListening: "การฟัง",
  reviewCefrRetest: "ทดสอบระดับใหม่",
  reviewWordsReady: "คำที่พร้อมทบทวน",
  reviewAllCaughtUp: "เยี่ยม! คุณทบทวนครบแล้ว",
  reviewDeckCount: "เด็ค",

  // Session
  sessionTitle: "เซสชันการเรียน",
  sessionProgress: "ความคืบหน้า",
  sessionComplete: "เซสชันเสร็จสิ้น!",
  sessionXpEarned: "XP ที่ได้รับ",
  sessionCoinsEarned: "เหรียญที่ได้รับ",
  sessionStreakBonus: "โบนัสต่อเนื่อง",
  sessionSummary: "สรุปการเรียน",
  sessionBackToReview: "กลับไปทบทวน",
  sessionAccuracy: "ความแม่นยำ",
  sessionNextSkill: "ทักษะถัดไป",
  sessionSkillFlashcard: "บัตรคำ",
  sessionSkillFillBlank: "เติมคำ",
  sessionSkillPronunciation: "การออกเสียง",
  sessionSkillConversation: "บทสนทนา",

  // Flashcards
  flashcardTitle: "บัตรคำ",
  flashcardTap: "แตะเพื่อดูคำแปล",
  flashcardKnow: "รู้แล้ว",
  flashcardDontKnow: "ยังไม่รู้",
  flashcardDefinition: "ความหมาย",
  flashcardExample: "ตัวอย่าง",
  flashcardTranslation: "คำแปล",
  flashcardRemaining: "เหลืออยู่",

  // Fill in the Blank
  fillBlankTitle: "เติมคำในช่องว่าง",
  fillBlankInstruction: "พิมพ์คำที่ถูกต้องลงในช่องว่าง",
  fillBlankCheck: "ตรวจคำตอบ",
  fillBlankHint: "คำใบ้",
  fillBlankCorrect: "ถูกต้อง!",
  fillBlankIncorrect: "ไม่ถูกต้อง",
  fillBlankAnswer: "คำตอบที่ถูกต้องคือ",

  // Pronunciation
  pronunciationTitle: "ฝึกออกเสียง",
  pronunciationInstruction: "กดปุ่มไมค์แล้วออกเสียงคำนี้",
  pronunciationTap: "แตะเพื่อพูด",
  pronunciationRecording: "กำลังบันทึก...",
  pronunciationAnalyzing: "กำลังวิเคราะห์...",
  pronunciationScore: "คะแนนการออกเสียง",
  pronunciationFeedback: "ผลการประเมิน",
  pronunciationTryAgain: "ลองอีกครั้ง",
  pronunciationNext: "คำถัดไป",
  pronunciationAccuracy: "ความถูกต้อง",
  pronunciationFluency: "ความคล่องแคล่ว",
  pronunciationCompleteness: "ความครบถ้วน",

  // Conversation
  conversationTitle: "ฝึกบทสนทนา",
  conversationInstruction: "พูดคุยกับ Koko เพื่อฝึกใช้คำศัพท์",
  conversationPlaceholder: "พิมพ์ข้อความของคุณ...",
  conversationExchanges: "รอบการสนทนา",
  conversationComplete: "เซสชันเสร็จสิ้น!",
  conversationBeta: "เบต้า",
  conversationBetaNotice: "⚠️ ฟีเจอร์นี้ยังอยู่ในช่วงทดสอบ ขอโทษที่เกิดข้อผิดพลาด เราจะรีบแก้ไขโดยเร็ว!",

  // Dictation
  dictationTitle: "เขียนตามคำบอก",
  dictationInstruction: "ฟังแล้วพิมพ์สิ่งที่ได้ยิน",
  dictationPlay: "เล่นเสียง",
  dictationCheck: "ตรวจคำตอบ",
  dictationYourAnswer: "คำตอบของคุณ",

  // Read & Write
  readWriteTitle: "อ่านและเขียน",
  readWriteInstruction: "อ่านประโยคและเติมคำที่หายไป",
  readWriteYourAnswer: "คำตอบของคุณ",
  readWriteCheck: "ตรวจคำตอบ",
  readWriteHint: "คำใบ้",

  // CEFR Retest
  cefrRetestTitle: "ทดสอบระดับอีกครั้ง",
  cefrRetestSubtitle: "ตรวจสอบว่าระดับของคุณเปลี่ยนไปหรือไม่",
  cefrRetestStart: "เริ่มทดสอบ",

  // Snap & Learn
  snapTitle: "ถ่ายภาพและเรียนรู้",
  snapSubtitle: "ถ่ายภาพสิ่งรอบตัวเพื่อค้นพบคำศัพท์ใหม่",
  snapAnalyzing: "กำลังวิเคราะห์ภาพ...",
  snapPickWords: "เลือกคำศัพท์ของคุณ",
  snapFound: "พบ",
  snapScene: "ฉาก",
  snapGallery: "เลือกจากคลัง",
  snapCameraError: "ไม่สามารถเปิดกล้องได้ กรุณาเลือกรูปภาพจากคลัง",
  snapOpenCamera: "เปิดกล้อง",
  snapRetake: "ถ่ายใหม่",

  // Tag
  tagTitle: "ติดแท็กอัตโนมัติ",
  tagSubtitle: "Koko ตรวจจับบริบทของคุณโดยอัตโนมัติ",
  tagContextDetected: "บริบทที่ตรวจพบ",
  tagGpsZone: "โซน GPS",
  tagWeather: "สภาพอากาศ",
  tagScene: "ฉาก",
  tagHowFeeling: "คุณรู้สึกอย่างไร?",
  tagPickMood: "เลือกอารมณ์",
  tagMood: "อารมณ์",
  tagPlace: "สถานที่",
  tagAmbientSound: "เสียงรอบข้าง",
  tagSoundAssigned: "เสียงที่กำหนด",
  tagWordsToSave: "คำที่จะบันทึก",
  tagSaveWords: "บันทึกคำศัพท์",
  tagSaving: "กำลังบันทึก...",
  tagSaved: "บันทึกเด็คแล้ว!",
  tagPreview: "ตัวอย่าง",

  // Story
  storyTitle: "เรื่องราว",
  storySubtitle: "อ่านและฟังเรื่องราวภาษาอังกฤษ",
  storyRead: "อ่าน",
  storyListen: "ฟัง",
  storyVocab: "คำศัพท์",
  storyProgress: "ความคืบหน้า",
  storyComplete: "จบแล้ว!",
  storyNoContent: "ยังไม่มีเนื้อหา",

  // Leaderboard
  leaderboardTitle: "กระดานคะแนน",
  leaderboardSubtitle: "แข่งขันกับผู้เรียนคนอื่น",
  leaderboardRank: "อันดับ",
  leaderboardXp: "XP",
  leaderboardYou: "คุณ",
  leaderboardWeekly: "สัปดาห์นี้",
  leaderboardAllTime: "ตลอดเวลา",
  leaderboardEmpty: "ยังไม่มีข้อมูล",

  // Nearby
  nearbyTitle: "ผู้เรียนใกล้ฉัน",
  nearbySubtitle: "พบผู้เรียนภาษาอังกฤษในบริเวณใกล้เคียง",
  nearbyLocating: "กำลังค้นหาตำแหน่ง...",
  nearbyNoUsers: "ไม่พบผู้เรียนในบริเวณนี้",
  nearbyDistance: "กม.",
  nearbyLevel: "ระดับ",
  nearbyConnect: "เชื่อมต่อ",

  // Profile
  profileTitle: "โปรไฟล์",
  profileEditProfile: "แก้ไขโปรไฟล์",
  profileLevel: "ระดับ",
  profileXp: "XP",
  profileCoins: "เหรียญ",
  profileStreak: "ต่อเนื่อง",
  profileWordsLearned: "คำที่เรียนแล้ว",
  profileDecksCreated: "เด็คที่สร้าง",
  profileAchievements: "ความสำเร็จ",
  profileSettings: "ตั้งค่า",
  profileLogout: "ออกจากระบบ",
  profileJoined: "เข้าร่วมเมื่อ",

  // Settings / Privacy
  settingsTitle: "ตั้งค่า",
  settingsLanguage: "ภาษา",
  settingsLanguageDesc: "เลือกภาษาที่แสดงในแอป",
  settingsNotifications: "การแจ้งเตือน",
  settingsPrivacy: "ความเป็นส่วนตัว",
  settingsPrivacyDesc: "จัดการข้อมูลและความเป็นส่วนตัวของคุณ",
  settingsLocationData: "ข้อมูลตำแหน่ง",
  settingsLocationDataDesc: "อนุญาตให้แอปใช้ตำแหน่งของคุณเพื่อปรับประสบการณ์การเรียน",
  settingsDeleteData: "ลบข้อมูล",
  settingsDeleteDataDesc: "ลบข้อมูลทั้งหมดของคุณออกจากระบบ",
  settingsDeleteConfirm: "คุณแน่ใจหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
  settingsSaved: "บันทึกการตั้งค่าแล้ว",
  settingsThaiLanguage: "ภาษาไทย",
  settingsEnglishLanguage: "English",

  // Shop
  shopTitle: "ร้านค้า",
  shopSubtitle: "ใช้เหรียญแลกรับรางวัล",
  shopBuy: "ซื้อ",
  shopOwned: "มีแล้ว",
  shopCoins: "เหรียญ",
  shopGems: "เพชร",
  shopNotEnough: "เหรียญไม่พอ",
  shopPurchased: "ซื้อสำเร็จ!",

  // Gacha
  gachaTitle: "กาชา",
  gachaSubtitle: "หมุนเพื่อลุ้นรับรางวัล",
  gachaSpin: "หมุน",
  gachaSpinning: "กำลังหมุน...",
  gachaResult: "ผลลัพธ์",
  gachaAgain: "หมุนอีกครั้ง",
  gachaCost: "ค่าใช้จ่าย",

  // Luggage
  luggageTitle: "กระเป๋า",
  luggageSubtitle: "คำศัพท์ทั้งหมดที่คุณสะสม",
  luggageEmpty: "ยังไม่มีคำศัพท์ในกระเป๋า",
  luggageEmptyDesc: "สะสมรางวัลจากกาชาและฝึกคำศัพท์ 5 ครั้งติดต่อกันเพื่อเติมกระเป๋า",
  luggageWordsCollected: "คำที่สะสม",

  // Memory Map
  memoryMapTitle: "แผนที่ความจำ",
  memoryMapSubtitle: "ติดตามความคืบหน้าของคุณ",
  memoryMapNodes: "โหนด",
  memoryMapUnlocked: "ปลดล็อคแล้ว",
  memoryMapLocked: "ล็อคอยู่",
  memoryMapReview: "ทบทวน",
};

const en: Strings = {
  // Common
  appName: "Kotoka",
  tagline: "Learn English through daily life",
  save: "Save",
  cancel: "Cancel",
  next: "Next",
  back: "Back",
  done: "Done",
  skip: "Skip",
  confirm: "Confirm",
  loading: "Loading...",
  error: "Something went wrong",
  retry: "Retry",
  close: "Close",
  edit: "Edit",
  delete: "Delete",
  search: "Search",
  yes: "Yes",
  no: "No",
  ok: "OK",
  of: "of",
  words: "words",
  score: "Score",
  correct: "Correct",
  incorrect: "Incorrect",
  start: "Start",
  finish: "Finish",
  continue: "Continue",
  restart: "Restart",
  submit: "Submit",
  learnMore: "Learn more",
  seeAll: "See all",
  tryAgain: "Try again",
  great: "Great!",
  wellDone: "Well done!",
  keepGoing: "Keep going!",
  beta: "Beta",

  // Bottom Nav
  navHome: "Home",
  navReview: "Review",
  navSnap: "Snap",
  navCommunity: "Community",
  navStory: "Story",

  // Status Bar
  statusBarStreak: "day streak",

  // Home
  homeGreeting: "Hello",
  homeSubtitle: "Let's learn new words today!",
  homeStartSnap: "Snap & Learn",
  homeStartReview: "Review Words",
  homeDailyGoal: "Daily Goal",
  homeStreakDays: "day streak",
  homeWordsLearned: "Words Learned",
  homeWordsToday: "Today",
  homeQuickReview: "Quick Review",
  homeSnap: "Snap",

  // Login
  loginTitle: "Welcome back",
  loginSubtitle: "Sign in to continue",
  loginWithGoogle: "Continue with Google",
  loginEmail: "Email",
  loginPassword: "Password",
  loginSignIn: "Sign In",
  loginNoAccount: "Don't have an account?",
  loginSignUp: "Sign up",
  loginForgotPassword: "Forgot password?",
  loginTerms: "By signing in you agree to our Terms of Service",

  // Sign Up
  signupTitle: "Create account",
  signupSubtitle: "Start learning today",
  signupName: "Your name",
  signupEmail: "Email",
  signupPassword: "Password",
  signupCreateAccount: "Create Account",
  signupHaveAccount: "Already have an account?",
  signupSignIn: "Sign in",
  signupWithGoogle: "Sign up with Google",

  // Consent
  consentTitle: "Privacy Policy",
  consentSubtitle: "Please read and accept before continuing",
  consentBody: "Kotoka uses your location and photos to create a contextual learning experience. Your data will never be shared with third parties.",
  consentAccept: "Accept & Continue",
  consentDecline: "Decline",
  consentPrivacy: "Privacy Policy",
  consentTerms: "Terms of Service",

  // Onboarding: Language
  onboardLangTitle: "Choose Language",
  onboardLangSubtitle: "Select your native and target language",
  onboardLangNative: "Your Language",
  onboardLangTarget: "Language to Learn",
  onboardLangContinue: "Continue",

  // Onboarding: CEFR Test
  onboardCefrTitle: "Level Test",
  onboardCefrSubtitle: "Let us assess your English level",
  onboardCefrStart: "Start Test",
  onboardCefrQuestion: "Question",
  onboardCefrListening: "Listening",
  onboardCefrReading: "Reading",
  onboardCefrWriting: "Writing",
  onboardCefrProgress: "Progress",
  onboardCefrPlayAudio: "Play Audio",
  onboardCefrPlaying: "Playing...",
  onboardCefrLoading: "Loading...",
  onboardCefrPlayAgain: "Play Again",
  onboardCefrHint: "Press play to listen, then answer the question",

  // Onboarding: CEFR Result
  onboardResultTitle: "Your Result",
  onboardResultSubtitle: "Your English level is",
  onboardResultLevel: "Level",
  onboardResultDesc: "We'll tailor lessons to your level",
  onboardResultContinue: "Start Learning",
  onboardResultRetake: "Retake Test",

  // Review Hub
  reviewTitle: "Review",
  reviewSubtitle: "Review your vocabulary",
  reviewDueToday: "Due Today",
  reviewNoCards: "No cards to review",
  reviewStartSession: "Start Session",
  reviewFlashcards: "Flashcards",
  reviewFillBlank: "Fill in Blank",
  reviewPronunciation: "Pronunciation",
  reviewConversation: "Conversation",
  reviewDictation: "Dictation",
  reviewReadWrite: "Read & Write",
  reviewListening: "Listening",
  reviewCefrRetest: "Level Retest",
  reviewWordsReady: "Words Ready",
  reviewAllCaughtUp: "All caught up!",
  reviewDeckCount: "decks",

  // Session
  sessionTitle: "Study Session",
  sessionProgress: "Progress",
  sessionComplete: "Session Complete!",
  sessionXpEarned: "XP Earned",
  sessionCoinsEarned: "Coins Earned",
  sessionStreakBonus: "Streak Bonus",
  sessionSummary: "Summary",
  sessionBackToReview: "Back to Review",
  sessionAccuracy: "Accuracy",
  sessionNextSkill: "Next Skill",
  sessionSkillFlashcard: "Flashcard",
  sessionSkillFillBlank: "Fill Blank",
  sessionSkillPronunciation: "Pronunciation",
  sessionSkillConversation: "Conversation",

  // Flashcards
  flashcardTitle: "Flashcards",
  flashcardTap: "Tap to reveal",
  flashcardKnow: "Got it",
  flashcardDontKnow: "Not yet",
  flashcardDefinition: "Definition",
  flashcardExample: "Example",
  flashcardTranslation: "Translation",
  flashcardRemaining: "remaining",

  // Fill in the Blank
  fillBlankTitle: "Fill in the Blank",
  fillBlankInstruction: "Type the correct word in the blank",
  fillBlankCheck: "Check",
  fillBlankHint: "Hint",
  fillBlankCorrect: "Correct!",
  fillBlankIncorrect: "Not quite",
  fillBlankAnswer: "The answer is",

  // Pronunciation
  pronunciationTitle: "Pronunciation",
  pronunciationInstruction: "Tap the mic and say this word",
  pronunciationTap: "Tap to speak",
  pronunciationRecording: "Recording...",
  pronunciationAnalyzing: "Analyzing...",
  pronunciationScore: "Pronunciation Score",
  pronunciationFeedback: "Feedback",
  pronunciationTryAgain: "Try again",
  pronunciationNext: "Next word",
  pronunciationAccuracy: "Accuracy",
  pronunciationFluency: "Fluency",
  pronunciationCompleteness: "Completeness",

  // Conversation
  conversationTitle: "Conversation Practice",
  conversationInstruction: "Chat with Koko to practice vocabulary",
  conversationPlaceholder: "Type your response…",
  conversationExchanges: "exchanges",
  conversationComplete: "Session complete!",
  conversationBeta: "Beta",
  conversationBetaNotice: "⚠️ Conversation practice is in Beta and encountered an issue. Skipping this exercise — we'll have it fixed soon!",

  // Dictation
  dictationTitle: "Dictation",
  dictationInstruction: "Listen and type what you hear",
  dictationPlay: "Play Audio",
  dictationCheck: "Check",
  dictationYourAnswer: "Your answer",

  // Read & Write
  readWriteTitle: "Read & Write",
  readWriteInstruction: "Read the passage and fill in the missing word",
  readWriteYourAnswer: "Your answer",
  readWriteCheck: "Check",
  readWriteHint: "Hint",

  // CEFR Retest
  cefrRetestTitle: "Level Retest",
  cefrRetestSubtitle: "Check if your level has improved",
  cefrRetestStart: "Start Test",

  // Snap & Learn
  snapTitle: "Snap & Learn",
  snapSubtitle: "Point your camera at any scene to discover vocabulary",
  snapAnalyzing: "Analyzing Scene…",
  snapPickWords: "Pick Your Words",
  snapFound: "found",
  snapScene: "Scene",
  snapGallery: "Choose from Gallery",
  snapCameraError: "Camera unavailable. Upload a photo instead.",
  snapOpenCamera: "Open Camera",
  snapRetake: "Retake",

  // Tag
  tagTitle: "Auto-Tag Applied",
  tagSubtitle: "Koko detected your context automatically",
  tagContextDetected: "Context Detected",
  tagGpsZone: "GPS Zone",
  tagWeather: "Weather",
  tagScene: "Scene",
  tagHowFeeling: "How are you feeling?",
  tagPickMood: "Pick a mood",
  tagMood: "Mood",
  tagPlace: "Place",
  tagAmbientSound: "Ambient Sound",
  tagSoundAssigned: "Ambient Sound Assigned",
  tagWordsToSave: "Words to Save",
  tagSaveWords: "Save Words",
  tagSaving: "Saving...",
  tagSaved: "Deck Saved!",
  tagPreview: "Preview",

  // Story
  storyTitle: "Story",
  storySubtitle: "Read and listen to English stories",
  storyRead: "Read",
  storyListen: "Listen",
  storyVocab: "Vocabulary",
  storyProgress: "Progress",
  storyComplete: "Complete!",
  storyNoContent: "No content yet",

  // Leaderboard
  leaderboardTitle: "Leaderboard",
  leaderboardSubtitle: "Compete with other learners",
  leaderboardRank: "Rank",
  leaderboardXp: "XP",
  leaderboardYou: "You",
  leaderboardWeekly: "This Week",
  leaderboardAllTime: "All Time",
  leaderboardEmpty: "No data yet",

  // Nearby
  nearbyTitle: "Nearby Learners",
  nearbySubtitle: "Find English learners near you",
  nearbyLocating: "Locating...",
  nearbyNoUsers: "No learners found nearby",
  nearbyDistance: "km",
  nearbyLevel: "Level",
  nearbyConnect: "Connect",

  // Profile
  profileTitle: "Profile",
  profileEditProfile: "Edit Profile",
  profileLevel: "Level",
  profileXp: "XP",
  profileCoins: "Coins",
  profileStreak: "Streak",
  profileWordsLearned: "Words Learned",
  profileDecksCreated: "Decks Created",
  profileAchievements: "Achievements",
  profileSettings: "Settings",
  profileLogout: "Log Out",
  profileJoined: "Joined",

  // Settings / Privacy
  settingsTitle: "Settings",
  settingsLanguage: "Language",
  settingsLanguageDesc: "Choose the app display language",
  settingsNotifications: "Notifications",
  settingsPrivacy: "Privacy",
  settingsPrivacyDesc: "Manage your data and privacy",
  settingsLocationData: "Location Data",
  settingsLocationDataDesc: "Allow the app to use your location to personalise learning",
  settingsDeleteData: "Delete My Data",
  settingsDeleteDataDesc: "Permanently remove all your data from our servers",
  settingsDeleteConfirm: "Are you sure? This action cannot be undone.",
  settingsSaved: "Settings saved",
  settingsThaiLanguage: "ภาษาไทย",
  settingsEnglishLanguage: "English",

  // Shop
  shopTitle: "Shop",
  shopSubtitle: "Spend your coins on rewards",
  shopBuy: "Buy",
  shopOwned: "Owned",
  shopCoins: "Coins",
  shopGems: "Gems",
  shopNotEnough: "Not enough coins",
  shopPurchased: "Purchased!",

  // Gacha
  gachaTitle: "Gacha",
  gachaSubtitle: "Spin to win rewards",
  gachaSpin: "Spin",
  gachaSpinning: "Spinning...",
  gachaResult: "Result",
  gachaAgain: "Spin Again",
  gachaCost: "Cost",

  // Luggage
  luggageTitle: "Luggage",
  luggageSubtitle: "All your collected vocabulary",
  luggageEmpty: "No words in your luggage yet",
  luggageEmptyDesc: "Draw gacha items and master 5 flashcards in a row to fill your suitcase.",
  luggageWordsCollected: "Words Collected",

  // Memory Map
  memoryMapTitle: "Memory Map",
  memoryMapSubtitle: "Track your progress",
  memoryMapNodes: "Nodes",
  memoryMapUnlocked: "Unlocked",
  memoryMapLocked: "Locked",
  memoryMapReview: "Review",
};

export const STRINGS: Record<Locale, Strings> = { th, en };

// ── Context ──────────────────────────────────────────────────────────────────

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Strings;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "th",
  setLocale: () => {},
  t: th,
});

const STORAGE_KEY = "kotoka_locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("th");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "en" || stored === "th") setLocaleState(stored);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: STRINGS[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
