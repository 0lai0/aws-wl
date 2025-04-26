import { useState } from "react";

export default function AgoraSTTOptions({ settings }) {
  const [appId, setAppId] = useState(settings?.AgoraAppId || "");
  const [accessToken, setAccessToken] = useState(settings?.AgoraAccessToken || "");
  const [language, setLanguage] = useState(settings?.AgoraLanguage || "en-US");

  return (
    <div className="flex gap-x-7 gap-[36px] mt-1.5">
      <div className="flex flex-col w-60">
        <label className="text-white text-sm font-semibold block mb-3">
          Agora App ID
        </label>
        <input
          type="text"
          name="AgoraAppId"
          className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
          placeholder="Agora App ID"
          value={appId}
          required={true}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setAppId(e.target.value)}
        />
      </div>
      <div className="flex flex-col w-60">
        <label className="text-white text-sm font-semibold block mb-3">
          Agora Access Token
        </label>
        <input
          type="password"
          name="AgoraAccessToken"
          className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
          placeholder="Agora Access Token"
          value={accessToken}
          required={true}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setAccessToken(e.target.value)}
        />
      </div>
      <div className="flex flex-col w-60">
        <label className="text-white text-sm font-semibold block mb-3">
          Language
        </label>
        <select
          name="AgoraLanguage"
          className="border-none flex-shrink-0 bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en-US">English (US)</option>
          <option value="zh-CN">Chinese (Simplified)</option>
          <option value="es-ES">Spanish</option>
          {/* 根據 Agora STT API 支援的語言添加更多選項 */}
        </select>
      </div>
    </div>
  );
}