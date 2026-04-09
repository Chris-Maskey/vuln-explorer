import {useRef, useState} from 'react';
import {motion} from 'motion/react';

interface AffectedUploadFormProps {
  onFile: (file: File) => void;
  isBusy: boolean;
  onReset: () => void;
  hasResults: boolean;
}

const ACCEPTED_TYPES = '.json,.txt';

export function AffectedUploadForm({onFile, isBusy, onReset, hasResults}: AffectedUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isBusy && inputRef.current?.click()}
        className={[
          'border border-dashed border-[#141414] p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer select-none',
          dragOver ? 'bg-[#141414] text-[#E4E3E0]' : 'bg-transparent hover:bg-[#141414]/5',
          isBusy ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileChange}
          className="hidden"
          disabled={isBusy}
        />
        <p className="font-mono text-xs uppercase tracking-widest opacity-60">
          Drop file or click to upload
        </p>
        <p className="font-mono text-xs opacity-40 text-center">
          package.json · requirements.txt · CycloneDX / SPDX SBOM (.json)
        </p>
      </div>

      <div className="border border-[#141414]/20 bg-[#141414]/5 p-3">
        <p className="font-mono text-xs uppercase tracking-wider opacity-50">
          Accuracy notice
        </p>
        <p className="font-mono text-xs opacity-40 mt-1">
          Only exact pinned versions are checked. Ranges, git references, and workspace deps are
          skipped and listed separately.
        </p>
      </div>

      {hasResults && !isBusy && (
        <motion.button
          type="button"
          onClick={onReset}
          whileHover={{scale: 1.02}}
          whileTap={{scale: 0.98}}
          transition={{duration: 0.12}}
          className="font-mono text-xs uppercase tracking-widest border border-[#141414] px-4 py-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors cursor-pointer"
        >
          Upload another file
        </motion.button>
      )}
    </div>
  );
}
