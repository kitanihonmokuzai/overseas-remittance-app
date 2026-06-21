"use client";

import { useEffect, useState } from "react";
import { Download, FolderOpen, Save } from "lucide-react";
import type { AttachmentLink } from "@/lib/db";

const DB_NAME = "remittance-app";
const STORE = "handles";
const KEY = "save-dir";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readwrite").objectStore(STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function SaveAttachments({ files }: { files: AttachmentLink[] }) {
  const [supported, setSupported] = useState(false);
  const [dirName, setDirName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && "showDirectoryPicker" in window) {
      setSupported(true);
      idbGet<{ name: string }>(KEY)
        .then((handle) => {
          if (handle) setDirName(handle.name);
        })
        .catch(() => {});
    }
  }, []);

  async function chooseFolder() {
    try {
      const handle = await (window as unknown as { showDirectoryPicker: (o: object) => Promise<{ name: string }> }).showDirectoryPicker({ mode: "readwrite" });
      await idbSet(KEY, handle);
      setDirName(handle.name);
      setMessage(`保存先を「${handle.name}」に設定しました。`);
    } catch {
      /* キャンセル時は何もしない */
    }
  }

  async function ensurePermission(handle: { queryPermission: (o: object) => Promise<string>; requestPermission: (o: object) => Promise<string> }) {
    const opts = { mode: "readwrite" };
    if ((await handle.queryPermission(opts)) === "granted") return true;
    return (await handle.requestPermission(opts)) === "granted";
  }

  async function saveToFolder() {
    setBusy(true);
    setMessage("");
    try {
      let handle = await idbGet<any>(KEY);
      if (!handle) {
        await chooseFolder();
        handle = await idbGet<any>(KEY);
      }
      if (!handle) {
        setBusy(false);
        return;
      }
      if (!(await ensurePermission(handle))) {
        setMessage("フォルダへのアクセスが許可されませんでした。");
        setBusy(false);
        return;
      }
      let saved = 0;
      for (const file of files) {
        if (!file.url) continue;
        const response = await fetch(file.url);
        const blob = await response.blob();
        const fileHandle = await handle.getFileHandle(file.file_name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        saved += 1;
      }
      setMessage(`${saved}件を「${handle.name}」に保存しました。`);
    } catch {
      setMessage("保存中にエラーが発生しました。");
    } finally {
      setBusy(false);
    }
  }

  async function downloadAll() {
    for (const file of files) {
      if (!file.url) continue;
      const anchor = document.createElement("a");
      anchor.href = file.url;
      anchor.download = file.file_name;
      anchor.target = "_blank";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return (
    <div className="save-attachments">
      {supported ? (
        <>
          <div className="save-row">
            <button type="button" className="secondary small" onClick={chooseFolder}>
              <FolderOpen size={15} />
              {dirName ? `保存先: ${dirName}` : "保存先フォルダを選択"}
            </button>
            <button type="button" className="primary small" onClick={saveToFolder} disabled={busy}>
              <Save size={15} />
              {busy ? "保存中..." : "フォルダへ保存"}
            </button>
          </div>
          <p className="save-note">
            対応ブラウザ（Chrome / Edge）で、選択したフォルダへまとめて保存します。初回や再アクセス時はアクセス許可を求められます。
          </p>
        </>
      ) : (
        <>
          <button type="button" className="secondary small" onClick={downloadAll}>
            <Download size={15} />
            まとめてダウンロード
          </button>
          <p className="save-note">
            このブラウザはフォルダ保存に未対応のため、通常のダウンロードになります。Chrome / Edge ではフォルダ指定が可能です。
          </p>
        </>
      )}
      {message ? <p className="save-message">{message}</p> : null}
    </div>
  );
}
