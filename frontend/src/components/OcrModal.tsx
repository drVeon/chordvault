import { Progress, Modal, Button, Input, NativeSelect, TextInput, Textarea } from '@mantine/core';
import { useModals } from '@mantine/modals';
import { useState, useRef, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { showStatusNotification as toast } from '../lib/notifications';
import { DEFAULT_GEMINI_MODEL } from '../lib/constants';

interface OcrModalProps {
  opened: boolean;
  hasGeminiKey: boolean;
  onResult: (text: string, language?: string | null) => void;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function OcrModal({ opened, hasGeminiKey, onResult, onClose }: OcrModalProps) {
  const modalManager = useModals();
  return (
    <Modal opened={opened} onClose={onClose} title="Import from image or PDF" trapFocus={modalManager.modals.length === 0} closeOnEscape={modalManager.modals.length === 0} closeOnClickOutside={modalManager.modals.length === 0}>
      {opened && <OcrContent hasGeminiKey={hasGeminiKey} onResult={onResult} onClose={onClose} />}
    </Modal>
  );
}

function OcrContent({ hasGeminiKey, onResult, onClose }: Omit<OcrModalProps, 'opened'>) {
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const api = useApi();
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultText, setResultText] = useState('');
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // Model selection
  const [selectedModel, setSelectedModel] = useState(DEFAULT_GEMINI_MODEL);
  const [models, setModels] = useState<{ id: string; label: string; hint: string }[]>([]);

  useEffect(() => {
    api<{ model: string; models: { id: string; label: string; hint: string }[] }>('GET', '/api/settings/ocr-model')
      .then(data => { if (active.current) { setSelectedModel(data.model); setModels(data.models); } })
      .catch(() => {});
  }, [api]);

  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [fixInput, setFixInput] = useState('');
  const [refining, setRefining] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const pdf = file.type === 'application/pdf';
    setIsPdf(pdf);
    if (pdf) {
      setPreview(file.name);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => { if (active.current) setPreview(ev.target?.result as string); };
      reader.readAsDataURL(file);
    }
    // Reset state on new file
    setResultText('');
    setChatHistory([]);
    setImageBase64(null);
  };

  const process = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast('Please select a file first', 'error'); return; }
    if (!hasGeminiKey) { toast('Please set up your Gemini API key in Settings first', 'error'); return; }

    setProcessing(true);
    setProgress(0);
    setChatHistory([]);
    try {
      setProgress(10);
      const base64 = await fileToBase64(file);
      if (!active.current) return;
      setImageBase64(base64);
      setProgress(30);
      const result = await api<{ text: string; language: string | null }>('POST', '/api/ocr/gemini', { image: base64, model: selectedModel });
      if (!active.current) return;
      setProgress(100);
      setResultText(result.text);
      setDetectedLang(result.language);
      // Seed chat history with the initial model response
      setChatHistory([{ role: 'model', text: result.text }]);
    } catch (e) {
      if (active.current) toast(`OCR failed: ${(e as Error).message}`, 'error');
    }
    if (active.current) setProcessing(false);
  };

  const sendFix = async () => {
    const msg = fixInput.trim();
    if (!msg || !imageBase64) return;

    setRefining(true);
    setFixInput('');
    const newHistory = [...chatHistory, { role: 'user' as const, text: msg }];
    setChatHistory(newHistory);

    try {
      const result = await api<{ text: string }>('POST', '/api/ocr/gemini/refine', {
        image: imageBase64,
        history: chatHistory,
        message: msg,
        model: selectedModel,
      });
      if (!active.current) return;
      setResultText(result.text);
      setChatHistory([...newHistory, { role: 'model', text: result.text }]);
      setTimeout(() => { if (active.current) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    } catch (e) {
      if (!active.current) return;
      toast(`Fix failed: ${(e as Error).message}`, 'error');
      // Remove the user message on failure
      setChatHistory(chatHistory);
    }
    if (active.current) setRefining(false);
  };

  const useResult = () => {
    onResult(resultText, detectedLang);
    onClose();
    toast('Text imported — review and edit before saving', 'success');
  };

  const hasCorrections = chatHistory.filter(m => m.role === 'user').length > 0;

  return (<>



        {/* File picker — hide after extraction to save space */}
        {!resultText && (
          <>
            <div className="field">

              <Input.Wrapper label="Select image or PDF" id="ocr-file">
                <Input id="ocr-file" type="file" ref={fileRef} accept="image/*,application/pdf" onChange={handleFile} style={{ fontSize: 14, padding: 8 }} />
              </Input.Wrapper>
            </div>
            {preview && (
              <div style={{ marginBottom: 14 }}>
                {isPdf ? (
                  <div className="muted-text" style={{ padding: 12, background: 'var(--surface2)', borderRadius: 8 }}>
                    &#128196; {preview}
                  </div>
                ) : (
                  <img src={preview} className="ocr-preview" alt="Preview" />
                )}
              </div>
            )}
            {!hasGeminiKey && (
              <div className="muted-text" style={{ marginBottom: 12, padding: 10, background: 'var(--surface)', borderRadius: 8 }}>
                Requires a Gemini API key. Set one up in Settings.
              </div>
            )}
            {models.length > 0 && (
              <div className="field" style={{ marginBottom: 12 }}>

                <NativeSelect label={<>Model</>}
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{ fontSize: 14, padding: '8px 12px' }}
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.label} — {m.hint}</option>
                  ))}
                </NativeSelect>
              </div>
            )}
            <Button className="btn" onClick={process} disabled={processing} style={{ width: '100%', padding: '12px 22px', fontSize: 15 }}>
              {processing ? 'Processing...' : '\u2728 Extract text'}
            </Button>
            {(processing || progress > 0) && (
              <div style={{ marginTop: 12 }}>
                <Progress value={progress} aria-label="OCR progress" />
              </div>
            )}
          </>
        )}

        {/* Result + conversation */}
        {resultText && (
          <div style={{ marginTop: resultText ? 0 : 14 }}>
            {/* Correction history */}
            {hasCorrections && (
              <div className="ocr-chat-history">
                {chatHistory.slice(1).map((m, i) => (
                  <div key={i} className={`ocr-chat-bubble ${m.role === 'user' ? 'ocr-chat-user' : 'ocr-chat-ai'}`}>
                    {m.role === 'user' ? m.text : '\u2713 Fix applied'}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}


            <Textarea label={<>
              {hasCorrections ? 'Corrected result' : 'Extracted text'}
              {hasCorrections && <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 400, textTransform: 'none' }}>({chatHistory.filter(m => m.role === 'user').length} fix{chatHistory.filter(m => m.role === 'user').length > 1 ? 'es' : ''} applied)</span>}
            </>} className="ocr-result" readOnly value={resultText} />
            {detectedLang && (
              <div className="muted-text" style={{ marginTop: 6 }}>
                Detected language: <strong>{detectedLang}</strong>
              </div>
            )}

            {/* Chat input for corrections */}
            {models.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <NativeSelect
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{ fontSize: 12, padding: '4px 8px', color: 'var(--muted)' }}
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.label} — {m.hint}</option>
                  ))}
                </NativeSelect>
              </div>
            )}
            <div className="ocr-fix-row">
              <TextInput aria-label="Describe what to fix..."
                type="text"
                className="ocr-fix-input"
                placeholder="Describe what to fix..."
                value={fixInput}
                onChange={(e) => setFixInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFix(); } }}
                disabled={refining}
              />
              <Button size="xs"
                className="btn btn-sm"
                onClick={sendFix}
                disabled={refining || !fixInput.trim()}
              >
                {refining ? '...' : 'Fix'}
              </Button>
            </div>
            <div className="muted-text" style={{ fontSize: 12, marginTop: 4 }}>
              e.g. "move the G chord to the next word" or "verse 2 should be Am not Em"
            </div>

            {/* Action buttons */}
            <div className="flex-row" style={{ marginTop: 12 }}>
              <Button className="btn" onClick={useResult}>Use this</Button>
              <Button variant="default" className="btn btn-ghost" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        )}

    </>);
}
