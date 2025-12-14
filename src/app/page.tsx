"use client";

import { ChangeEvent, useMemo, useState, useEffect } from "react";
import { FaCopy } from "react-icons/fa6";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

export default function Home() {
	const [file, setFile] = useState<File | null>(null);
	const [raw, setRaw] = useState<string>(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("savedJson") ?? "";
		}
		return "";
	});

	const [formatted, setFormatted] = useState<string>("");

	const [debouncedRaw] = useDebounce(raw, 300);

	function updateJsonInput(e: ChangeEvent<HTMLTextAreaElement>) {
		setRaw(e.target.value);
	}

	function updateFormattedJsonInput(e: ChangeEvent<HTMLTextAreaElement>) {
		setFormatted(e.target.value);
	}

	function copyFormattedJson() {
		if (typeof window !== "undefined" && formatted) {
			window.navigator.clipboard.writeText(formatted || error);
			toast("Copied to Clipboard");
		}
		return;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!file) return;

		const formData = new FormData();
		formData.append("jsonFile", file);

		// setLoading(true);

		const res = await fetch("http://localhost:8080/api/json-formatter/format-file", {
			method: "POST",
			body: formData,
		});

		const blob = await res.blob();
		const url = window.URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = "formatted.json"; // fallback
		document.body.appendChild(a);
		a.click();
		a.remove();

		window.URL.revokeObjectURL(url);
		// setResult(data);
		// setLoading(false);
	}

	// save JSON safely
	useEffect(() => {
		if (typeof window !== "undefined" && debouncedRaw != null) {
			localStorage.setItem("savedJson", debouncedRaw);
		}
	}, [debouncedRaw]);

	const { error } = useMemo(() => {
		const text = debouncedRaw ?? "";

		if (!text.trim()) {
			return { error: "" };
		}

		try {
			const parsedJson = JSON.parse(text);
			const formattedJson = JSON.stringify(parsedJson, null, 4);
			setFormatted(formattedJson);
			return { error: "" };
		} catch (err) {
			const message = err instanceof Error ? err.message : "Invalid JSON input";
			setFormatted("");
			return { error: message };
		}
	}, [debouncedRaw]);

	return (
		<div className="flex items-center justify-center p-4 overflow-clip font-semibold text-lg text-off-white">
			<main className="flex flex-wrap w-full h-[calc(100svh-2rem)] overflow-clip p-4">
				<div className="w-full flex justify-center items-center gap-2 mb-4">
					{/* Hidden real input */}
					<input id="json-file" type="file" accept=".json" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

					{/* Fake input */}
					<label htmlFor="json-file" className="bg-off-white rounded-2xl py-1 px-4 text-black cursor-pointer min-w-max">
						{file ? file.name : "Select File"}
					</label>

					{/* Submit button */}
					<button className="bg-off-white rounded-2xl py-1 px-4 text-black hover:cursor-pointer" onClick={handleSubmit} disabled={!file}>
						Submit
					</button>
				</div>

				<div className="w-1/2 h-full px-2">
					<textarea value={raw} onChange={updateJsonInput} spellCheck={false} className="h-full w-full bg-background-contrast rounded-3xl p-4 py-5 outline-none resize-none text-nowrap" />
				</div>
				<div className="w-1/2 h-full px-2 relative">
					<textarea value={error || formatted} onChange={updateFormattedJsonInput} spellCheck={false} className="h-full w-full bg-background-contrast rounded-3xl p-4 py-5 outline-none resize-none text-nowrap" />
					<button onClick={copyFormattedJson} className="text-white absolute top-4 right-4 hover:cursor-pointer">
						<FaCopy />
					</button>
				</div>
			</main>
		</div>
	);
}
