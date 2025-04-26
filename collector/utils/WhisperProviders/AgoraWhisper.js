const fs = require("fs");
const path = require("path");
const { v4 } = require("uuid");
const axios = require("axios");

class AgoraSTT {
  constructor({ options }) {
    // Agora 憑證從 options 或環境變數中讀取
    this.appId = options?.AgoraAppId || process.env.AGORA_APP_ID;
    this.accessToken = options?.AgoraAccessToken || process.env.AGORA_ACCESS_TOKEN;
    this.language = options?.AgoraLanguage || "en-US";
    this.apiUrl = `https://api.agora.io/v1/projects/${this.appId}/rtsc/speech-to-text`;

    // 臨時目錄用於儲存轉換後的音訊檔案
    this.tmpDir = path.resolve(
      process.env.STORAGE_DIR
        ? path.resolve(process.env.STORAGE_DIR, `tmp`)
        : path.resolve(__dirname, `../../storage/tmp`)
    );

    // 確保臨時目錄存在
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }

    // 驗證憑證是否存在
    if (!this.appId || !this.accessToken) {
      throw new Error("Agora App ID and Access Token are required.");
    }

    this.#log("Initialized with Agora STT.");
  }

  #log(text, ...args) {
    console.log(`\x1b[32m[AgoraSTT]\x1b[0m ${text}`, ...args);
  }

  #validateAudioFile(wavFile) {
    const sampleRate = wavFile.fmt.sampleRate;
    const duration = wavFile.data.samples / sampleRate;

    // Agora 通常要求 8kHz 或更高的採樣率
    if (sampleRate < 8000) {
      throw new Error("Audio file sample rate is too low. Minimum required is 8kHz.");
    }

    // 設置合理的時長限制（例如 1 小時，根據 Agora 的限制調整）
    const MAX_DURATION_SECONDS = 60 * 60; // 1 小時
    if (duration > MAX_DURATION_SECONDS) {
      throw new Error("Audio file duration exceeds maximum limit of 1 hour.");
    }

    return true;
  }

  async #convertToWavAudioData(sourcePath) {
    try {
      let buffer;
      const wavefile = require("wavefile");
      const ffmpeg = require("fluent-ffmpeg");
      const outFolder = this.tmpDir;
      const fileExtension = path.extname(sourcePath).toLowerCase();

      if (fileExtension !== ".wav") {
        this.#log(`Converting ${fileExtension} to WAV format...`);
        const outputFile = path.resolve(outFolder, `${v4()}.wav`);
        const convert = new Promise((resolve, reject) => {
          ffmpeg(sourcePath)
            .toFormat("wav")
            .audioChannels(1) // 單聲道
            .audioFrequency(16000) // 16kHz 採樣率
            .on("error", (error) => {
              this.#log(`Conversion Error: ${error.message}`);
              reject(error);
            })
            .on("progress", (progress) => {
              this.#log(`Conversion Progress: ${progress.targetSize}KB converted`);
            })
            .on("end", () => {
              this.#log(`Conversion Complete: Converted to WAV.`);
              resolve(outputFile);
            })
            .save(outputFile);
        });

        const outputPath = await convert;
        buffer = fs.readFileSync(outputPath);
        fs.rmSync(outputPath);
      } else {
        buffer = fs.readFileSync(sourcePath);
      }

      const wavFile = new wavefile.WaveFile(buffer);
      try {
        this.#validateAudioFile(wavFile);
      } catch (error) {
        this.#log(`Audio validation failed: ${error.message}`);
        throw new Error(`Invalid audio file: ${error.message}`);
      }

      return buffer; // 直接返回 WAV 檔案的 Buffer
    } catch (error) {
      this.#log(`convertToWavAudioData Error: ${error.message}`);
      throw error;
    }
  }

  async processFile(fullFilePath, filename) {
    try {
      // 將音訊轉換為 WAV 格式
      const wavBuffer = await this.#convertToWavAudioData(fullFilePath);
      const base64Audio = wavBuffer.toString("base64");

      this.#log(`Sending audio to Agora STT API...`);
      const response = await axios.post(
        this.apiUrl,
        {
          audio: base64Audio,
          config: {
            language: this.language,
            audio_format: "wav",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const transcription = response.data.transcription || response.data.text;
      this.#log(`Transcription successful: ${transcription.slice(0, 50)}...`);

      return { content: transcription, error: null };
    } catch (error) {
      this.#log(`Transcription Error: ${error.message}`);
      return { content: null, error: error.message };
    }
  }
}

module.exports = {
  AgoraSTT,
};